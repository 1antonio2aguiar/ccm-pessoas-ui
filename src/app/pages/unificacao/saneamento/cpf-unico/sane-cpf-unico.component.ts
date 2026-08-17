import { Component, OnInit } from '@angular/core';
import { LocalDataSource } from 'ng2-smart-table';
import { NbDialogService, NbToastrService, } from '@nebular/theme';
import { HttpParams } from '@angular/common/http';

import { SanePessoaFilters, SanePessoaService } from '../sane-pessoa.service';
import {
  ConfirmarUnificacaoDialogComponent,
} from '../../../../shared/components/confirmar-unificacao-dialog/confirmar-unificacao-dialog.component';
import {
  UnificacaoAutomaticaService,
} from '../../../../shared/services/unificacao-automatica.service';
import {
  ControleMigracaoPessoaService,
} from '../../../../shared/services/controle-migracao-pessoa.service';

@Component({
  selector: 'ngx-sane-cpf-unico',
  templateUrl: './sane-cpf-unico.component.html',
  styleUrls: ['./sane-cpf-unico.component.scss'],
})

export class SaneCpfUnicoComponent implements OnInit {

  source: LocalDataSource = new LocalDataSource();
  isLoading = false;

  processandoLote = false;
  mensagemErro = '';

  progressoLote = 0;
  totalProcessados = 0;
  totalVinculados = 0;
  totalIgnorados = 0;
  totalErros = 0;
  etapaLote = '';
  detalheLote = '';

  carregandoRegistrosLote = false;

  totalRegistrosLote = 0;

  registroAtualLote = 0;
  pessoaAtualLote: number | null = null;

  filtro: SanePessoaFilters = new SanePessoaFilters();

  settings = {
    mode: 'external',

    pager: {
      perPage: this.filtro.itensPorPagina,
      display: true,
    },

    actions: {
      add: true,
      edit: true,
      delete: false,
      position: 'right',
    },

    add: {
      addButtonContent: '<i class="nb-play"></i>',
      createButtonContent: '',
      cancelButtonContent: '',
      confirmCreate: true,
      addMode: 'external',
    },

    edit: {
      editButtonContent: '<span class="icon-save-btn"></span>',
      saveButtonContent: '',
      cancelButtonContent: '',
      confirmSave: true,
    },

    rowClassFunction: (row: any) => {
      const status = row.data.statusCadastro;

      if (status === 'EXISTE NO CAD. ÚNICO') {
        return 'linha-verde';
      }

      /*if (status === 'ÚNICO') {
        return 'linha-laranja';
      }*/

      return '';
    },

    columns: {

      pessoa: {
        title: 'Pessoa',
        type: 'number',
        addable: false,
        filter: true,
        width: '90px',
        filterFunction: (_cell?: any, _search?: string) => true,
      },

      nome: {
        title: 'Nome',
        type: 'string',
        filter: true,
        width: '700px',
        filterFunction: (_cell?: any, _search?: string) => true,
      },

      cgcCpf: {
        title: 'CPF',
        type: 'string',
        width: '200px',
        filter: true,
        valuePrepareFunction: (value: any) => {
          if (!value) {
            return '';
          }

          const cpf = value.toString().replace(/\D/g, '').padStart(11, '0');

          return cpf.replace(
            /(\d{3})(\d{3})(\d{3})(\d{2})/,
            '$1.$2.$3-$4'
          );
        },
      },

      dataNascimento: {
        title: 'Dt Nascimento',
        type: 'string',
        width: '130px',
        filter: true,
        valuePrepareFunction: (_: any, row: any) =>
          row?.dataNascimento ?? '',
        filterFunction: (_cell?: any, _search?: string) => true,
      },

      statusCadastro: {
        title: 'Status',
        type: 'string',
        width: '260px',
        filter: true,
      },

    },
  };

  constructor(
    private service: SanePessoaService,
    private toastrService: NbToastrService,
    private dialogService: NbDialogService,
    private unificacaoAutomaticaService: UnificacaoAutomaticaService,
    private controleMigracaoPessoaService: ControleMigracaoPessoaService,
  ) { }

  ngOnInit(): void {
    this.listar();

    this.source.onChanged().subscribe((change) => {
      if (change.action === 'filter') {
        this.onTableFilter(change.filter);
      }
    });
  }

  listar(): void {
    this.filtro = new SanePessoaFilters();
    this.filtro.pagina = 0;
    this.filtro.itensPorPagina = 8;

    this.execSearch(this.buildBaseParams());
  }

  private buildBaseParams(): HttpParams {
    return new HttpParams()
      .set('sort', 'pessoa');
  }

  onTableFilter(change: any): void {
    let params = this.buildBaseParams();

    const filtersArray = change?.filters ?? [];

    const pessoaFilter = filtersArray.find((f: any) => f.field === 'pessoa');
    const nomeFilter = filtersArray.find((f: any) => f.field === 'nome');
    const cpfFilter = filtersArray.find((f: any) => f.field === 'cgcCpf');
    const nascimentoFilter = filtersArray.find((f: any) => f.field === 'dataNascimento');

    const pessoa = String(pessoaFilter?.search ?? '').trim();
    const nome = String(nomeFilter?.search ?? '').trim();

    const cpfRaw = String(cpfFilter?.search ?? '').trim();
    const cpfDigits = cpfRaw.replace(/\D/g, '');

    const nascRaw = String(nascimentoFilter?.search ?? '').trim();

    if (pessoa.length > 0) {
      params = params.set('pessoa', pessoa);
    }

    if (nome.length > 0) {
      params = params.set('nome', nome);
    }

    if (cpfDigits.length >= 6) {
      params = params.set('cpf', cpfDigits);
    }

    const m = nascRaw.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (m) {
      const yyyyMMdd = `${m[3]}-${m[2]}-${m[1]}`;
      params = params.set('dataNascimento', yyyyMMdd);
    }

    this.execSearch(params);
  }

  private execSearch(params: HttpParams): void {
    this.filtro.params = params;

    this.isLoading = true;

    this.service.pesquisarCpfUnico({ ...this.filtro, params } as any)
      .then(({ sanePessoas, total }) => {
        this.filtro.totalRegistros = total ?? 0;

        const lista = (sanePessoas ?? []).map((p: any) => this.normalizePessoaRow(p));

        this.source.load(lista);
      })
      .catch((e) => {
        console.error(e);
        this.source.load([]);
        this.toastrService.danger('Erro ao carregar a lista de CPF único do saneamento.', 'Erro');
      })
      .finally(() => {
        this.isLoading = false;
      });
  }

  private normalizePessoaRow(p: any): any {
    const digits = String(p?.cgcCpf ?? '').replace(/\D/g, '');

    let cgcCpf = '';

    if (digits.length === 11) {
      cgcCpf = this.formatCpf(digits);
    } else {
      cgcCpf = String(p?.cgcCpf ?? '');
    }

    const dnRaw = p?.dataNascimento ?? '';

    let dataNascimento = '';

    if (dnRaw) {
      const s = String(dnRaw).substring(0, 10);
      const parts = s.split('-');

      if (parts.length === 3) {
        dataNascimento = `${parts[2]}/${parts[1]}/${parts[0]}`;
      } else {
        dataNascimento = String(dnRaw);
      }
    }

    return {
      ...p,
      cgcCpfDigits: digits,
      cgcCpf,
      dataNascimento,
    };
  }

  private formatCpf(d: string): string {
    const p1 = d.substring(0, 3);
    const p2 = d.substring(3, 6);
    const p3 = d.substring(6, 9);
    const p4 = d.substring(9, 11);

    let out = p1;
    if (p2) out += '.' + p2;
    if (p3) out += '.' + p3;
    if (p4) out += '-' + p4;

    return out;
  }

  onCreateConfirm(
    _event: any
  ): void {

    this.processarLote();
  }

  async onEditarLinha(
    event: any
  ): Promise<void> {

    const pessoa = event?.data;
    const pessoaId = pessoa?.pessoa;

    const cpf =
      pessoa?.cgcCpfDigits ||
      String(
        pessoa?.cgcCpf ?? ''
      ).replace(/\D/g, '');

    if (!pessoaId) {
      this.toastrService.danger(
        'Código da pessoa não encontrado.',
        'Erro'
      );
      return;
    }

    if (!cpf) {
      this.toastrService.danger(
        'CPF não encontrado para validação.',
        'Erro'
      );
      return;
    }

    this.isLoading = true;

    try {

      const resultado =
        await this.service
          .existeCpfCnpjNoCadUnico(
            cpf,
            'F'
          );

      /*
      * CPF não existe:
      * realiza o processamento normal.
      */
      if (!resultado?.existe) {

        const mensagem =
          await this.service
            .processarCpfUnico(
              pessoaId
            );

        this.toastrService.success(
          mensagem ||
          `Pessoa ${pessoaId} processada com sucesso.`,
          'Sucesso'
        );

        this.listar();
        return;
      }

      const avaliacao =
        this.unificacaoAutomaticaService
          .avaliar(
            {
          nome:
            pessoa?.nome ?? null,

          cpfCnpj:
            cpf,

          dataNascimento:
            pessoa?.dataNascimento ?? null,
        },
        {
          nome:
            resultado?.nome ?? null,

          cpfCnpj:
            resultado?.cpfCnpj ?? cpf,

          dataNascimento:
            resultado?.dataNascimento ?? null,
        }
      );

      /*
      * Dados incompatíveis:
      * não processa e não abre o modal.
      */
      if (
        avaliacao.decisao ===
        'INVALIDA'
      ) {

        this.toastrService.danger(
          avaliacao.motivo,
          'Dados incompatíveis'
        );

        return;
      }

      /*
      * O motor aprovou a unificação:
      *
      * - nomes normalizados iguais; ou
      * - CPF e nascimento iguais com diferença
      *   de apenas uma letra no nome.
      */
      if (
        avaliacao.decisao ===
        'AUTOMATICA'
      ) {

        const mensagem =
          await this.service
            .processarJaExisteCadUnico(
              pessoaId
            );

        this.toastrService.success(
          mensagem ||
          `Pessoa ${pessoaId} vinculada automaticamente ao Cadastro Único.`,
          'Unificação automática'
        );

        this.listar();
        return;
      }


      /*
      * CPF igual e nome diferente:
      * solicita confirmação do usuário.
      */
      const confirmou =
        await this.dialogService
          .open(
            ConfirmarUnificacaoDialogComponent,
            {
              closeOnBackdropClick: false,

              context: {
                tituloOrigem:
                  'Saneamento',

                pessoaOrigem: {
                  nome:
                    pessoa?.nome ?? null,

                  cpfCnpj:
                    pessoa?.cgcCpf ?? cpf,

                  dataNascimento:
                    pessoa?.dataNascimento ?? null,
                },

                pessoaCadUnico:
                  resultado,
              },
            }
          )
          .onClose
          .toPromise();

      /*
      * O usuário clicou especificamente em "NÃO".
      */
      if (confirmou === false) {

        await this.controleMigracaoPessoaService
          .registrarNaoMigrar(
            'SANE',
            pessoaId
          );

        this.toastrService.info(
          'Pessoa retirada da lista de migração.',
          'Não unificar'
        );

        this.listar();
        return;
      }

      /*
      * Encerramento sem resposta explícita:
      * não registra nenhuma decisão.
      */
      if (confirmou !== true) {
        return;
      }

      /*
      * Usuário confirmou:
      * vincula a origem SANE à pessoa existente.
      */
      const mensagem =
        await this.service
          .processarJaExisteCadUnico(
            pessoaId
          );

      this.toastrService.success(
        mensagem ||
        `Pessoa ${pessoaId} vinculada ao Cadastro Único.`,
        'Sucesso'
      );

      this.listar();

    } catch (e: any) {

      console.error(
        `Erro ao processar a pessoa SANE ${pessoaId}`,
        e
      );

      const mensagemErro =
        typeof e?.error === 'string' &&
          e.error.trim()
          ? e.error.trim()
          : e?.message ||
          `Erro ao processar a pessoa ${pessoaId}.`;

      this.toastrService.danger(
        mensagemErro,
        'Erro'
      );

    } finally {
      this.isLoading = false;
    }
  }

  private normalizeTextKey(
    value: any
  ): string {

    return String(value ?? '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .toUpperCase();
  }

  private async processarLote(): Promise<void> {

    if (this.processandoLote) {
      this.toastrService.warning(
        'Já existe um processamento em andamento.',
        'Aviso'
      );
      return;
    }

    this.processandoLote = true;
    this.isLoading = true;
    this.carregandoRegistrosLote = true;

    this.progressoLote = 0;
    this.totalProcessados = 0;
    this.totalVinculados = 0;
    this.totalIgnorados = 0;
    this.totalErros = 0;

    this.totalRegistrosLote = 0;
    this.registroAtualLote = 0;
    this.pessoaAtualLote = null;

    this.mensagemErro = '';
    this.etapaLote = 'Carregando lote...';
    this.detalheLote = 'Buscando registros no backend.';

    try {

      const tamanhoLote = 100;

      const parametrosBase =
        this.filtro.params ||
        this.buildBaseParams();

      /*
      * Sempre consulta a primeira página.
      *
      * Os registros processados deixam de aparecer
      * na lista de não migrados. Portanto, no próximo
      * clique, a primeira página conterá o próximo lote.
      */
      const params = parametrosBase
        .set('page', '0')
        .set('size', String(tamanhoLote))
        .set('sort', 'pessoa');

      const filtroLote = new SanePessoaFilters();

      filtroLote.pagina = 0;
      filtroLote.itensPorPagina = tamanhoLote;
      filtroLote.params = params;

      /*
      * Busca somente um lote.
      */
      const resposta =
        await this.service.pesquisarCpfUnico(
          filtroLote as any
        );

      const pessoas =
        (resposta?.sanePessoas ?? [])
          .map(
            (registro: any) =>
              this.normalizePessoaRow(registro)
          );

      this.carregandoRegistrosLote = false;
      this.totalRegistrosLote = pessoas.length;

      if (!pessoas.length) {

        this.etapaLote =
          'Nenhum registro encontrado.';

        this.detalheLote =
          'Não há pessoas disponíveis para processamento.';

        this.toastrService.warning(
          'Não há registros para processar.',
          'Aviso'
        );

        return;
      }

      this.etapaLote =
        'Processando lote...';

      this.detalheLote =
        `Foram encontrados ${pessoas.length} registros.`;

      /*
      * Processa somente os registros recuperados
      * nesta única consulta.
      */
      for (
        let indice = 0;
        indice < pessoas.length;
        indice++
      ) {

        const pessoa =
          pessoas[indice];

        const pessoaId =
          Number(pessoa?.pessoa);

        const cpf =
          pessoa?.cgcCpfDigits ||
          String(
            pessoa?.cgcCpf ?? ''
          ).replace(/\D/g, '');

        const status =
          String(
            pessoa?.statusCadastro ?? ''
          )
            .trim()
            .toUpperCase();

        this.registroAtualLote =
          indice + 1;

        this.pessoaAtualLote =
          pessoaId > 0
            ? pessoaId
            : null;

        this.detalheLote =
          `Registro ${this.registroAtualLote} ` +
          `de ${this.totalRegistrosLote}. ` +
          `Pessoa: ${pessoaId || 'não identificada'}.`;

        /*
        * Atualiza a barra durante o lote.
        */
        this.progressoLote =
          Math.round(
            (
              this.registroAtualLote /
              this.totalRegistrosLote
            ) * 100
          );

        try {

          if (!pessoaId) {
            throw new Error(
              'Código da pessoa não encontrado.'
            );
          }

          if (!cpf) {
            throw new Error(
              `CPF não encontrado para a pessoa ${pessoaId}.`
            );
          }

          /*
          * CPF e nome iguais aos existentes
          * no Cadastro Único.
          *
          * Vincula automaticamente, sem modal.
          */
          if (
            status ===
            'EXISTE NO CAD. ÚNICO'
          ) {

            await this.service
              .processarJaExisteCadUnico(
                pessoaId
              );

            this.totalVinculados++;
            continue;
          }

          /*
          * Pessoa classificada como CPF único.
          */
          if (status === 'ÚNICO') {

          const resultado =
            await this.service
              .existeCpfCnpjNoCadUnico(
                cpf,
                'F'
              );

          if (resultado?.existe) {

            const avaliacao =
              this.unificacaoAutomaticaService
                .avaliar(
                  {
                    nome:
                      pessoa?.nome ?? null,

                    cpfCnpj:
                      cpf,

                    dataNascimento:
                      pessoa?.dataNascimento ?? null,
                  },
                  {
                    nome:
                      resultado?.nome ?? null,

                    cpfCnpj:
                      resultado?.cpfCnpj ?? cpf,

                    dataNascimento:
                      resultado?.dataNascimento ?? null,
                  }
                );

            if (
              avaliacao.decisao ===
              'AUTOMATICA'
            ) {

              await this.service
                .processarJaExisteCadUnico(
                  pessoaId
                );

              this.totalVinculados++;
              continue;
            }

            this.totalIgnorados++;
            continue;
          }

          /*
          * CPF realmente novo.
          */
          await this.service
            .processarCpfUnico(
              pessoaId
            );

          this.totalProcessados++;
          continue;
        }

          throw new Error(
            `Status não reconhecido: ${status || 'não informado'
            }.`
          );

        } catch (e: any) {

          this.totalErros++;

          console.error(
            `Erro ao processar a pessoa SANE ${pessoaId}`,
            e
          );

          const detalhe =
            typeof e?.error === 'string' &&
              e.error.trim()
              ? e.error.trim()
              : e?.message ||
              'Não foi possível processar a pessoa.';

          this.mensagemErro =
            `Pessoa ${pessoaId || 'não identificada'
            }: ${detalhe}`;
        }
      }

      /*
      * O único lote solicitado terminou.
      */
      this.progressoLote = 100;

      this.etapaLote =
        'Lote finalizado.';

      this.detalheLote =
        `Analisados: ${this.totalRegistrosLote}. ` +
        `Novos: ${this.totalProcessados}. ` +
        `Vinculados: ${this.totalVinculados}. ` +
        `Ignorados: ${this.totalIgnorados}. ` +
        `Erros: ${this.totalErros}.`;

      const resumo =
        `Lote finalizado. ` +
        `Novos: ${this.totalProcessados}. ` +
        `Vinculados: ${this.totalVinculados}. ` +
        `Ignorados: ${this.totalIgnorados}. ` +
        `Erros: ${this.totalErros}.`;

      if (this.totalErros > 0) {

        this.toastrService.warning(
          resumo,
          'Finalizado com erros'
        );

      } else {

        this.toastrService.success(
          resumo,
          'Sucesso'
        );
      }

      /*
      * Atualiza a lista depois do lote.
      */
      this.listar();

    } catch (e: any) {

      console.error(
        'Erro ao executar o lote do Saneamento.',
        e
      );

      const detalhe =
        typeof e?.error === 'string' &&
          e.error.trim()
          ? e.error.trim()
          : e?.message ||
          'Erro ao executar o processamento em lote.';

      this.mensagemErro = detalhe;
      this.etapaLote = 'Erro no processamento.';
      this.detalheLote = detalhe;

      this.toastrService.danger(
        detalhe,
        'Erro'
      );

    } finally {

      this.processandoLote = false;
      this.isLoading = false;
      this.carregandoRegistrosLote = false;
      this.pessoaAtualLote = null;
    }
  }

}
