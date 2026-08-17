import { Component, OnDestroy, OnInit } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { LocalDataSource } from 'ng2-smart-table';
import { NbDialogService, NbToastrService, } from '@nebular/theme';

import { PesPessoaCpfDplService, PessoaFilters } from '../pes-pessoa-cpf-dpl.service';
import {
  ConfirmarUnificacaoDialogComponent,
} from '../../../../../shared/components/confirmar-unificacao-dialog/confirmar-unificacao-dialog.component';
import {
  UnificacaoAutomaticaService,
} from '../../../../../shared/services/unificacao-automatica.service';

@Component({
  selector: 'ngx-pes-pessoa-cpf-dpl-iud',
  templateUrl: './pes-pessoa-cpf-dpl-iud.component.html',
  styleUrls: ['./pes-pessoa-cpf-dpl-iud.component.scss'],
})
export class PesPessoaCpfDplIudComponent implements OnInit, OnDestroy {

  source: LocalDataSource = new LocalDataSource();
  processandoLote = false;
  isLoading = false;
  progressoLote = 0;

  filtro: PessoaFilters = new PessoaFilters();
  rows: any[] = [];

  mensagemErro = '';

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
        width: '600px',
        filterFunction: (_cell?: any, _search?: string) => true,
      },

      cnpjCpf: {
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
        width: '140px',
        filter: true,
        valuePrepareFunction: (_: any, row: any) => row?.dataNascimento ?? '',
        filterFunction: (_cell?: any, _search?: string) => true,
      },
    },
  };

  constructor(
    private service: PesPessoaCpfDplService,
    private toastrService: NbToastrService,
    private dialogService: NbDialogService,
    private unificacaoAutomaticaService: UnificacaoAutomaticaService,
  ) {}

  ngOnInit(): void {
    this.listar();

    this.source.onChanged().subscribe((change) => {
      if (change.action === 'filter') {
        this.onTableFilter(change.filter);
      }
    });
  }

  ngOnDestroy(): void {}

  listar(): void {
    this.filtro = new PessoaFilters();
    this.filtro.pagina = 0;
    this.filtro.itensPorPagina = 1000;

    this.execSearch(this.buildBaseParams());
  }

  async onEditarLinha(
    event: any
  ): Promise<void> {

    const pessoa = event?.data;
    const pessoaId = pessoa?.pessoa;

    const cpf =
      pessoa?.cnpjCpfDigits ||
      String(
        pessoa?.cnpjCpf ?? ''
      ).replace(/\D/g, '');

    const fisicaJuridica =
      pessoa?.fisicaJuridica || 'F';

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
            fisicaJuridica
          );

      /*
      * CPF não existe no Cadastro Único:
      * cria normalmente a pessoa consolidada.
      */
      if (!resultado?.existe) {

        const mensagem =
          await this.service
            .processarPessoaCpfDpl(
              pessoaId
            );

        this.toastrService.success(
          mensagem ||
          'Grupo processado com sucesso.',
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
    * O motor aprovou a vinculação automática
    * de todo o grupo duplicado.
    */
    if (
      avaliacao.decisao ===
      'AUTOMATICA'
    ) {
      const mensagem =
        await this.service
          .processarPessoaCpfDplJaExiste(
            pessoaId
          );

      this.toastrService.success(
        mensagem ||
          'Grupo vinculado automaticamente ao Cadastro Único.',
        'Unificação automática'
      );

      this.listar();
      return;
    }

      /*
      * CPF igual e nome diferente:
      *
      * mostra os dois cadastros para o usuário
      * decidir se representam a mesma pessoa.
      */
      const confirmou =
        await this.dialogService
          .open(
            ConfirmarUnificacaoDialogComponent,
            {
              closeOnBackdropClick: false,

              context: {
                tituloOrigem:
                  'Cadastro de Pessoas — CPF duplicado',

                pessoaOrigem: {
                  nome:
                    pessoa?.nome ?? null,

                  cpfCnpj:
                    pessoa?.cnpjCpf ?? cpf,

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
      *
      * O backend recupera e marca todos os integrantes
      * do grupo duplicado.
      */
      if (confirmou === false) {

        const mensagem =
          await this.service
            .registrarGrupoNaoMigrar(
              pessoaId
            );

        this.toastrService.info(
          mensagem ||
            'Grupo retirado da lista de migração.',
          'Não unificar'
        );

        this.listar();
        return;
      }

      /*
      * Se o modal for encerrado sem resposta explícita,
      * não grava nenhuma decisão.
      */
      if (confirmou !== true) {
        return;
      }

      /*
      * Usuário confirmou que os nomes diferentes
      * representam a mesma pessoa.
      */
      const mensagem =
        await this.service
          .processarPessoaCpfDplJaExiste(
            pessoaId
          );

      this.toastrService.success(
        mensagem ||
        'Grupo vinculado ao Cadastro Único com sucesso.',
        'Sucesso'
      );

      this.listar();

    } catch (e: any) {

      console.error(
        `Erro ao processar o grupo da pessoa ${pessoaId}`,
        e
      );

      const detalhe =
        typeof e?.error === 'string' &&
          e.error.trim()
          ? e.error.trim()
          : e?.message ||
          'Não foi possível processar o grupo.';

      this.toastrService.danger(
        detalhe,
        'Erro'
      );

    } finally {
      this.isLoading = false;
    }
  }

  async onCreateConfirm(
    _event: any
  ): Promise<void> {

    if (this.processandoLote) {
      this.toastrService.warning(
        'Já existe um processamento em andamento.',
        'Aviso'
      );
      return;
    }

    this.mensagemErro = '';
    this.progressoLote = 0;

    const gruposUnicos =
      this.getGruposUnicosParaLote();

    if (!gruposUnicos.length) {
      this.toastrService.warning(
        'Nenhum grupo disponível para processar.',
        'Aviso'
      );
      return;
    }

    this.processandoLote = true;
    this.isLoading = true;

    let processados = 0;
    let vinculados = 0;
    let ignorados = 0;
    let erros = 0;
    let concluidos = 0;

    try {

      for (const item of gruposUnicos) {

        const pessoaId =
          item?.pessoa;

        const cpf =
          item?.cnpjCpfDigits ||
          String(
            item?.cnpjCpf ?? ''
          ).replace(/\D/g, '');

        const fisicaJuridica =
          item?.fisicaJuridica || 'F';

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

          const resultado =
            await this.service
              .existeCpfCnpjNoCadUnico(
                cpf,
                fisicaJuridica
              );

          /*
          * CPF ainda não existe:
          * cria normalmente a pessoa consolidada.
          */
          if (!resultado?.existe) {

            await this.service
              .processarPessoaCpfDpl(
                pessoaId
              );

            processados++;
            continue;
          }

        const avaliacao =
          this.unificacaoAutomaticaService
            .avaliar(
              {
                nome:
                  item?.nome ?? null,

                cpfCnpj:
                  cpf,

                dataNascimento:
                  item?.dataNascimento ?? null,
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
        * No lote não abre modal.
        *
        * Quando o motor aprovar, vincula todo
        * o grupo duplicado ao Cadastro Único.
        */
        if (
          avaliacao.decisao ===
          'AUTOMATICA'
        ) {
          await this.service
            .processarPessoaCpfDplJaExiste(
              pessoaId
            );

          processados++;
          continue;
        }

        /*
        * EXIGIR_CONFIRMACAO ou INVALIDA:
        *
        * não processa automaticamente e mantém
        * o grupo para tratamento individual.
        */
        ignorados++;

        } catch (e: any) {

          erros++;

          console.error(
            `Erro ao processar o grupo da pessoa ${pessoaId}`,
            e
          );

          const detalhe =
            typeof e?.error === 'string' &&
            e.error.trim()
              ? e.error.trim()
              : e?.message ||
                'Não foi possível processar o grupo.';

          this.mensagemErro =
            `Pessoa ${
              pessoaId ?? 'não identificada'
            }: ${detalhe}`;

        } finally {

          concluidos++;

          this.progressoLote =
            Math.round(
              (
                concluidos /
                gruposUnicos.length
              ) * 100
            );
        }
      }

      const resumo =
        `Lote finalizado. ` +
        `Novos: ${processados}. ` +
        `Vinculados: ${vinculados}. ` +
        `Ignorados: ${ignorados}. ` +
        `Erros: ${erros}.`;

      if (erros > 0) {

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

      this.listar();

    } catch (e) {

      console.error(e);

      this.mensagemErro =
        'Erro ao executar o processamento em lote.';

      this.toastrService.danger(
        this.mensagemErro,
        'Erro'
      );

    } finally {

      this.processandoLote = false;
      this.isLoading = false;
    }
  }

  private buildBaseParams(): HttpParams {
    return new HttpParams()
      .set('fisicaJuridica', 'F')
      .set('somenteCpfUnico', 'false')
      .set('somenteNaoMigradas', 'true')
      .set('sort', 'pessoa');
  }

  onTableFilter(change: any): void {
    let params = this.buildBaseParams();

    const filtersArray = change?.filters ?? [];

    const pessoaFilter = filtersArray.find((f: any) => f.field === 'pessoa');
    const nomeFilter = filtersArray.find((f: any) => f.field === 'nome');
    const cpfCnpjFilter = filtersArray.find((f: any) => f.field === 'cnpjCpf');
    const nascimentoFilter = filtersArray.find((f: any) => f.field === 'dataNascimento');

    const pessoa = String(pessoaFilter?.search ?? '').trim();
    const nome = String(nomeFilter?.search ?? '').trim();

    const cpfCnpjRaw = String(cpfCnpjFilter?.search ?? '').trim();
    const cpfCnpjDigits = cpfCnpjRaw.replace(/\D/g, '');

    const nascRaw = String(nascimentoFilter?.search ?? '').trim();

    if (cpfCnpjDigits.length >= 6) {
      if (cpfCnpjDigits.length <= 11) {
        params = params.set('cpf', cpfCnpjDigits);
      } else {
        params = params.set('cnpj', cpfCnpjDigits);
      }

      this.execSearch(params);
      return;
    }

    const m = nascRaw.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (m) {
      const yyyyMMdd = `${m[3]}-${m[2]}-${m[1]}`;
      params = params.set('dataNascimento', yyyyMMdd);

      this.execSearch(params);
      return;
    }

    if (pessoa.length > 0) {
      params = params.set('pessoa', pessoa);
      this.execSearch(params);
      return;
    }

    if (nome.length > 0) {
      params = params.set('nome', nome);
      this.execSearch(params);
      return;
    }

    this.execSearch(params);
  }

  private execSearch(params: HttpParams): void {
    this.filtro.pagina = 0;
    this.filtro.itensPorPagina = 1000;
    this.filtro.params = params;

    this.isLoading = true;

    this.service.pesquisar({ ...this.filtro, params } as any)
      .then(({ pesPessoas, total }) => {
        this.filtro.totalRegistros = total ?? 0;

        const lista = (pesPessoas ?? []).map((p: any) => this.normalizePessoaRow(p));

        this.rows = lista;
        this.source.load(lista);
      })
      .catch((e) => {
        console.error(e);
        this.rows = [];
        this.source.load([]);
        this.toastrService.danger('Erro ao carregar a lista.', 'Erro');
      })
      .finally(() => {
        this.isLoading = false;
      });
  }

  private getGruposUnicosParaLote(): any[] {
    const mapa = new Map<string, any>();

    for (const row of this.rows ?? []) {
      const chave = this.buildCpfDuplicadoKey(row);

      if (!chave) {
        continue;
      }

      if (!mapa.has(chave)) {
        mapa.set(chave, row);
      }
  }

    return Array.from(mapa.values());
  }

  private buildCpfDuplicadoKey(
    row: any
    ): string {

    const cpf =
      String(
        row?.cnpjCpfDigits ?? ''
      ).trim();

    const nome =
      this.normalizeTextKey(
        row?.nome
      );

    if (!cpf || !nome) {
      return '';
    }

    return `${cpf}::${nome}`;
  }

  private normalizeTextKey(value: any): string {
    return String(value ?? '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .toUpperCase();
  }

  private normalizePessoaRow(
    p: any
  ): any {

    const digits =
      String(
        p?.cnpjCpf ??
        p?.cpf ??
        p?.dadosPessoaFisica?.cpf ??
        ''
      ).replace(/\D/g, '');

    let cnpjCpf = '';

    if (digits.length === 11) {

      cnpjCpf =
        this.formatCpf(
          digits
        );

    } else {

      cnpjCpf =
        String(
          p?.cnpjCpf ??
          p?.cpf ??
          ''
        );
    }

    const dataNascimentoOrigem =
      p?.dataNascimento ??
      p?.dadosPessoaFisica?.dataNascimento ??
      '';

    let dataNascimento = '';

    if (dataNascimentoOrigem) {

      const texto =
        String(
          dataNascimentoOrigem
        ).substring(0, 10);

      const partes =
        texto.split('-');

      if (partes.length === 3) {

        dataNascimento =
          `${partes[2]}/${partes[1]}/${partes[0]}`;

      } else {

        dataNascimento =
          String(
            dataNascimentoOrigem
          );
      }
    }

    return {
      ...p,
      cnpjCpfDigits: digits,
      cnpjCpf,
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

  private formatCnpj(d: string): string {
    const p1 = d.substring(0, 2);
    const p2 = d.substring(2, 5);
    const p3 = d.substring(5, 8);
    const p4 = d.substring(8, 12);
    const p5 = d.substring(12, 14);

    let out = p1;
    if (p2) out += '.' + p2;
    if (p3) out += '.' + p3;
    if (p4) out += '/' + p4;
    if (p5) out += '-' + p5;

    return out;
  }
}