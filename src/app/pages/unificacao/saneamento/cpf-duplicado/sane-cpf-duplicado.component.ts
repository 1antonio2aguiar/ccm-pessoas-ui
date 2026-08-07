import { Component, OnInit } from '@angular/core';
import { LocalDataSource } from 'ng2-smart-table';
import { NbDialogService, NbToastrService } from '@nebular/theme';
import { HttpParams } from '@angular/common/http';

import { SanePessoaFilters, SanePessoaService } from '../sane-pessoa.service';
import {
  ConfirmarUnificacaoDialogComponent,
} from '../../../../shared/components/confirmar-unificacao-dialog/confirmar-unificacao-dialog.component';

@Component({
  selector: 'ngx-sane-cpf-duplicado',
  templateUrl: './sane-cpf-duplicado.component.html',
  styleUrls: ['./sane-cpf-duplicado.component.scss'],
})

export class SaneCpfDuplicadoComponent implements OnInit {

  source: LocalDataSource = new LocalDataSource();
  isLoading = false;

  processandoLote = false;
  mensagemErro = '';

  progressoLote = 0;
  totalProcessados = 0;
  totalVinculados = 0;
  totalIgnorados = 0;
  totalErros = 0;
  totalGruposLote = 0;
  grupoAtualLote = 0;
  pessoaAtualLote: number | null = null;
  etapaLote = '';
  detalheLote = '';
  carregandoRegistrosLote = false;

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

      if (status === 'DUPLICADO') {
        return 'linha-vermelha';
      }

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

    this.service.pesquisarCpfDuplicado({ ...this.filtro, params } as any)
      .then(({ sanePessoas, total }) => {
        this.filtro.totalRegistros = total ?? 0;

        const lista = (sanePessoas ?? []).map((p: any) => this.normalizePessoaRow(p));

        this.source.load(lista);
      })
      .catch((e) => {
        console.error(e);
        this.source.load([]);
        this.toastrService.danger('Erro ao carregar a lista de CPF duplicado do saneamento.', 'Erro');
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

  onCreateConfirm(_event: any): void {
    this.processarLote();
  }

  async onEditarLinha(event: any): Promise<void> {
    const pessoa = event?.data;
    const pessoaId = Number(pessoa?.pessoa);
    const cpf = this.obterCpf(pessoa);

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
        await this.service.existeCpfCnpjNoCadUnico(cpf, 'F');

      /*
       * CPF ainda não existe:
       * cria uma nova pessoa para todo o grupo duplicado.
       */
      if (!resultado?.existe) {
        const mensagem =
          await this.service.processarCpfDuplicado(pessoaId);

        this.toastrService.success(
          mensagem || 'Grupo de CPF duplicado processado com sucesso.',
          'Sucesso'
        );

        this.listar();
        return;
      }

      const nomeSaneamento =
        this.normalizeTextKey(pessoa?.nome);

      const nomeCadUnico =
        this.normalizeTextKey(resultado?.nome);

      const nomesIguais =
        nomeSaneamento.length > 0 &&
        nomeCadUnico.length > 0 &&
        nomeSaneamento === nomeCadUnico;

      /*
       * CPF e nome iguais:
       * vincula diretamente, sem abrir o modal.
       */
      if (nomesIguais) {
        const mensagem =
          await this.service.processarCpfDuplicadoJaExiste(pessoaId);

        this.toastrService.success(
          mensagem || 'Grupo vinculado ao Cadastro Único com sucesso.',
          'Já existe no Cadastro Único'
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
                tituloOrigem: 'Saneamento — CPF duplicado',
                pessoaOrigem: {
                  nome: pessoa?.nome ?? null,
                  cpfCnpj: pessoa?.cgcCpf ?? cpf,
                  dataNascimento: pessoa?.dataNascimento ?? null,
                },
                pessoaCadUnico: resultado,
              },
            }
          )
          .onClose
          .toPromise();

      if (!confirmou) {
        return;
      }

      const mensagem =
        await this.service.processarCpfDuplicadoJaExiste(pessoaId);

      this.toastrService.success(
        mensagem || 'Grupo vinculado ao Cadastro Único com sucesso.',
        'Sucesso'
      );

      this.listar();

    } catch (e: any) {
      console.error(
        `Erro ao processar o grupo SANE da pessoa ${pessoaId}`,
        e
      );

      this.toastrService.danger(
        this.obterMensagemErro(
          e,
          `Erro ao processar o grupo da pessoa ${pessoaId}.`
        ),
        'Erro'
      );

    } finally {
      this.isLoading = false;
    }
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
    this.totalGruposLote = 0;
    this.grupoAtualLote = 0;
    this.pessoaAtualLote = null;
    this.mensagemErro = '';
    this.etapaLote = 'Carregando lote...';
    this.detalheLote = 'Buscando os grupos no backend.';

    try {
      const tamanhoLote = 100;
      const parametrosBase =
        this.filtro.params || this.buildBaseParams();

      /*
       * Uma única consulta por clique.
       * Não existe while nem busca automática do próximo lote.
       */
      const params = parametrosBase
        .set('page', '0')
        .set('size', String(tamanhoLote))
        .set('sort', 'pessoa');

      const filtroLote = new SanePessoaFilters();
      filtroLote.pagina = 0;
      filtroLote.itensPorPagina = tamanhoLote;
      filtroLote.params = params;

      const resposta =
        await this.service.pesquisarCpfDuplicado(filtroLote as any);

      const registros =
        (resposta?.sanePessoas ?? [])
          .map((pessoa: any) => this.normalizePessoaRow(pessoa));

      /*
       * A lista possui uma linha para cada pessoa da origem.
       * O backend processa todo o grupo do CPF de uma vez.
       * Portanto, mantemos somente uma pessoa representativa por CPF.
       */
      const grupos = this.obterGruposUnicos(registros);

      this.carregandoRegistrosLote = false;
      this.totalGruposLote = grupos.length;

      if (!grupos.length) {
        this.etapaLote = 'Nenhum grupo encontrado.';
        this.detalheLote =
          'Não há grupos de CPF duplicado disponíveis para processamento.';

        this.toastrService.warning(
          'Não há grupos para processar.',
          'Aviso'
        );
        return;
      }

      this.etapaLote = 'Processando lote...';
      this.detalheLote =
        `Foram encontrados ${grupos.length} grupos neste lote.`;

      for (let indice = 0; indice < grupos.length; indice++) {
        const pessoa = grupos[indice];
        const pessoaId = Number(pessoa?.pessoa);
        const cpf = this.obterCpf(pessoa);

        this.grupoAtualLote = indice + 1;
        this.pessoaAtualLote = pessoaId || null;
        this.progressoLote = Math.round(
          (this.grupoAtualLote / this.totalGruposLote) * 100
        );

        this.detalheLote =
          `Grupo ${this.grupoAtualLote} de ${this.totalGruposLote}. ` +
          `Pessoa representativa: ${pessoaId || 'não identificada'}.`;

        try {
          if (!pessoaId) {
            throw new Error('Código da pessoa não encontrado.');
          }

          if (!cpf) {
            throw new Error(
              `CPF não encontrado para a pessoa ${pessoaId}.`
            );
          }

          const resultado =
            await this.service.existeCpfCnpjNoCadUnico(cpf, 'F');

          /*
           * CPF não existe:
           * processa normalmente o grupo duplicado.
           */
          if (!resultado?.existe) {
            await this.service.processarCpfDuplicado(pessoaId);
            this.totalProcessados++;
            continue;
          }

          const nomeSaneamento =
            this.normalizeTextKey(pessoa?.nome);

          const nomeCadUnico =
            this.normalizeTextKey(resultado?.nome);

          const nomesIguais =
            nomeSaneamento.length > 0 &&
            nomeCadUnico.length > 0 &&
            nomeSaneamento === nomeCadUnico;

          /*
           * CPF e nome iguais:
           * vincula automaticamente, sem modal.
           */
          if (nomesIguais) {
            await this.service.processarCpfDuplicadoJaExiste(pessoaId);
            this.totalVinculados++;
            continue;
          }

          /*
           * CPF igual e nome diferente:
           * no individual abriria o modal;
           * no lote é apenas ignorado.
           */
          this.totalIgnorados++;

        } catch (e: any) {
          this.totalErros++;

          console.error(
            `Erro ao processar o grupo SANE da pessoa ${pessoaId}`,
            e
          );

          this.mensagemErro =
            `Pessoa ${pessoaId || 'não identificada'}: ` +
            this.obterMensagemErro(
              e,
              'Não foi possível processar o grupo.'
            );
        }
      }

      this.progressoLote = 100;
      this.etapaLote = 'Lote finalizado.';
      this.detalheLote =
        `Grupos analisados: ${this.totalGruposLote}. ` +
        `Novos: ${this.totalProcessados}. ` +
        `Vinculados: ${this.totalVinculados}. ` +
        `Ignorados: ${this.totalIgnorados}. ` +
        `Erros: ${this.totalErros}.`;

      const resumo =
        `Lote finalizado. Novos: ${this.totalProcessados}. ` +
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

      this.listar();

    } catch (e: any) {
      console.error(
        'Erro ao executar o lote de CPF duplicado do Saneamento.',
        e
      );

      const detalhe = this.obterMensagemErro(
        e,
        'Erro ao executar o processamento em lote.'
      );

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

private obterGruposUnicos(
    registros: any[]
  ): any[] {

    const grupos = new Map<string, any>();

    for (const pessoa of registros ?? []) {

      const cpf =
        this.obterCpf(
          pessoa
        );

      const nome =
        this.normalizeTextKey(
          pessoa?.nome
        );

      if (!cpf || !nome) {
        continue;
      }

      /*
      * No Saneamento, um grupo duplicado é definido por:
      *
      * CPF igual + nome normalizado igual.
      */
      const chaveGrupo =
        `${cpf}::${nome}`;

      if (!grupos.has(chaveGrupo)) {
        grupos.set(
          chaveGrupo,
          pessoa
        );
      }
    }

    return Array.from(
      grupos.values()
    );
  }

  private obterCpf(pessoa: any): string {
    return String(
      pessoa?.cgcCpfDigits ??
      pessoa?.cgcCpf ??
      ''
    ).replace(/\D/g, '');
  }

  private normalizeTextKey(value: any): string {
    return String(value ?? '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .toUpperCase();
  }

  private obterMensagemErro(
    erro: any,
    mensagemPadrao: string
  ): string {
    if (
      typeof erro?.error === 'string' &&
      erro.error.trim()
    ) {
      return erro.error.trim();
    }

    if (
      typeof erro?.message === 'string' &&
      erro.message.trim()
    ) {
      return erro.message.trim();
    }

    return mensagemPadrao;
  }
}
