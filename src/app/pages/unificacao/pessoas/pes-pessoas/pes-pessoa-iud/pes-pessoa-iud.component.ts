import { Component, OnDestroy, OnInit } from '@angular/core';
import { LocalDataSource } from 'ng2-smart-table';
import { NbDialogService, NbToastrService, } from '@nebular/theme';
import { HttpParams } from '@angular/common/http';

import { PesPessoaService, PessoaFilters } from '../pes-pessoa.service';
import {
  ConfirmarUnificacaoDialogComponent,
} from '../../../../../shared/components/confirmar-unificacao-dialog/confirmar-unificacao-dialog.component';
import {
  UnificacaoAutomaticaService,
} from '../../../../../shared/services/unificacao-automatica.service';
import {
  ControleMigracaoPessoaService,
} from '../../../../../shared/services/controle-migracao-pessoa.service';

@Component({
  selector: 'ngx-pes-pessoa-iud',
  templateUrl: './pes-pessoa-iud.component.html',
  styleUrls: ['./pes-pessoa-iud.component.scss'],
})
export class PesPessoaIudComponent implements OnInit, OnDestroy {

  source: LocalDataSource = new LocalDataSource();
  isLoading = false;
  processandoLote = false;
  progressoLote = 0;

  filtro: PessoaFilters = new PessoaFilters();

  statusCarga = '';
  totalProcessado = 0;
  totalErros = 0;
  private ultimaPesquisaId = 0;
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
        filterFunction: (_cell?: any, _search?: string) => true,
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
    private pesPessoaService: PesPessoaService,
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

  ngOnDestroy(): void {
  }

  listar(): void {
    this.filtro = new PessoaFilters();
    this.filtro.pagina = 0;
    this.filtro.itensPorPagina = 1000;

    this.execSearch(this.buildBaseParams());
  }

  onCreateConfirm(event: any): void {
    this.processarLoteTela();
  }

  onEditarLinha(event: any): void {
    const pessoa = event?.data;

    if (!pessoa?.pessoa) {
      this.toastrService.danger('Código da pessoa não encontrado.', 'Erro');
      return;
    }

    this.processarPessoaLinha(pessoa);
  }

  private buildBaseParams(): HttpParams {
    return new HttpParams()
      .set('fisicaJuridica', 'F')
      .set('somenteCpfUnico', 'true')
      .set('somenteNaoMigradas', 'true')
      .set('sort', 'pessoa');
  }

  onTableFilter(change: any): void {
    let params = this.buildBaseParams();

    const filtersArray = change?.filters ?? [];

    const pessoaFilter = filtersArray.find((f: any) => f.field === 'pessoa');
    const nomeFilter = filtersArray.find((f: any) => f.field === 'nome');
    const cpfCnpjFilter = filtersArray.find((f: any) => f.field === 'cnpjCpf');
    const nascimentoFilter = filtersArray.find(
      (f: any) => f.field === 'dataNascimento'
    );

    const pessoa = String(pessoaFilter?.search ?? '').trim();
    const nome = String(nomeFilter?.search ?? '').trim();

    const cpfCnpjRaw = String(cpfCnpjFilter?.search ?? '').trim();
    const cpfCnpjDigits = cpfCnpjRaw.replace(/\D/g, '');

    const nascRaw = String(nascimentoFilter?.search ?? '').trim();

    /*
     * DATA DE NASCIMENTO:
     * Se começou a digitar, somente pesquisa quando estiver completa.
     */
    if (nascRaw.length > 0) {
      const dataCompleta = nascRaw.match(
        /^(\d{2})\/(\d{2})\/(\d{4})$/
      );

      if (!dataCompleta) {
        return;
      }

      const dia = Number(dataCompleta[1]);
      const mes = Number(dataCompleta[2]);
      const ano = Number(dataCompleta[3]);

      const dataValida =
        dia >= 1 &&
        dia <= 31 &&
        mes >= 1 &&
        mes <= 12 &&
        ano >= 1900;

      if (!dataValida) {
        return;
      }

      const yyyyMMdd =
        `${dataCompleta[3]}-${dataCompleta[2]}-${dataCompleta[1]}`;

      params = params.set('dataNascimento', yyyyMMdd);

      this.execSearch(params);
      return;
    }

    if (cpfCnpjDigits.length >= 6) {
      if (cpfCnpjDigits.length <= 11) {
        params = params.set('cpf', cpfCnpjDigits);
      } else {
        params = params.set('cnpj', cpfCnpjDigits);
      }

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

    /*
     * Só volta para a lista inicial quando todos os filtros
     * estiverem realmente vazios.
     */
    const todosVazios =
      !pessoa &&
      !nome &&
      !cpfCnpjRaw &&
      !nascRaw;

    if (todosVazios) {
      this.execSearch(params);
    }
  }

  private execSearch(params: HttpParams): void {
    this.filtro.params = params;

    /*
    * Cada pesquisa recebe um número.
    * Uma resposta antiga não poderá sobrescrever a mais recente.
    */
    const pesquisaId = ++this.ultimaPesquisaId;

    this.isLoading = true;

    this.pesPessoaService
      .pesquisar({ ...this.filtro, params } as any)
      .then(({ pesPessoas, total }) => {

        if (pesquisaId !== this.ultimaPesquisaId) {
          return;
        }

        this.filtro.totalRegistros = total ?? 0;

        const lista = (pesPessoas ?? []).map(
          (p: any) => this.normalizePessoaRow(p)
        );

        this.source.load(lista);
      })
      .catch((e) => {

        if (pesquisaId !== this.ultimaPesquisaId) {
          return;
        }

        console.error(e);
        this.source.load([]);
        this.toastrService.danger(
          'Erro ao carregar a lista.',
          'Erro'
        );
      })
      .finally(() => {

        if (pesquisaId === this.ultimaPesquisaId) {
          this.isLoading = false;
        }
      });
  }

  private async processarPessoaLinha(pessoa: any): Promise<void> {

    const pessoaId =
      pessoa?.pessoa;

    const cpfCnpj =
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

    if (!cpfCnpj) {
      this.toastrService.danger(
        'CPF não encontrado para validação.',
        'Erro'
      );
      return;
    }

    this.isLoading = true;

    try {

      const resultado =
        await this.pesPessoaService
          .existeCpfCnpjNoCadUnico(
            cpfCnpj,
            fisicaJuridica
          );

      /*
       * CPF ainda não existe:
       * segue o processamento normal.
       */
      if (!resultado?.existe) {

        const mensagem =
          await this.pesPessoaService
            .processarPessoaUnica(
              pessoaId
            );

        this.toastrService.success(
          mensagem,
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
                cpfCnpj,

              dataNascimento:
                pessoa?.dataNascimento ?? null,
            },
            {
              nome:
                resultado?.nome ?? null,

              cpfCnpj:
                resultado?.cpfCnpj ?? cpfCnpj,

              dataNascimento:
                resultado?.dataNascimento ?? null,
            }
          );

      /*
      * Os dados não permitem uma unificação segura.
      * Não processa e não abre o modal.
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
      * O motor aprovou a unificação automática.
      *
      * Isso contempla as regras já implantadas:
      *
      * - nomes normalizados iguais;
      * - diferença de uma letra com datas iguais;
      * - diferença causada por ESPÓLIO;
      * - diferença apenas por partículas de ligação.
      */
      if (
        avaliacao.decisao ===
        'AUTOMATICA'
      ) {
        const mensagem =
          await this.pesPessoaService
            .processarPessoaJaExisteCadUnico(
              pessoaId
            );

        this.toastrService.success(
          mensagem ||
            'Pessoa vinculada automaticamente ao Cadastro Único.',
          'Unificação automática'
        );

        this.listar();
        return;
      }

      /*
       * CPF já existe:
       * solicita a confirmação do usuário.
       */
      const confirmou =
        await this.dialogService
          .open(
            ConfirmarUnificacaoDialogComponent,
            {
              closeOnBackdropClick: false,

              context: {
                tituloOrigem:
                  'Cadastro de Pessoas',

                pessoaOrigem: {
                  nome:
                    pessoa?.nome ?? null,

                  cpfCnpj:
                    pessoa?.cnpjCpf ?? cpfCnpj,

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
      * Registra a decisão e atualiza a lista.
      */
      if (confirmou === false) {

        await this.controleMigracaoPessoaService
          .registrarNaoMigrar(
            'PESSOAS',
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
      * Proteção para algum encerramento inesperado
      * do modal sem uma resposta explícita.
      *
      * Nesse caso não grava nenhuma decisão.
      */
      if (confirmou !== true) {
        return;
      }

      /*
       * Confirmou: chama o endpoint específico
       * para vincular ao cadastro já existente.
       */
      const mensagem =
        await this.pesPessoaService
          .processarPessoaJaExisteCadUnico(
            pessoaId
          );

      this.toastrService.success(
        mensagem ||
        'Pessoa vinculada ao Cadastro Único com sucesso.',
        'Sucesso'
      );

      this.listar();

    } catch (e: any) {

      console.error(
        `Erro ao processar a pessoa ${pessoaId}`,
        e
      );

      const detalhe =
        typeof e?.error === 'string' &&
          e.error.trim()
          ? e.error.trim()
          : 'Não foi possível concluir o processamento.';

      this.toastrService.danger(
        detalhe,
        'Erro'
      );

    } finally {
      this.isLoading = false;
    }
  }

  private async processarLoteTela(): Promise<void> {
    if (this.processandoLote) {
      this.toastrService.warning('Já existe um processamento em andamento.', 'Aviso');
      return;
    }

    this.processandoLote = true;
    this.isLoading = true;
    this.statusCarga = 'PROCESSANDO';
    this.totalProcessado = 0;
    this.totalErros = 0;
    this.mensagemErro = '';
    this.progressoLote = 0;

    try {
      const paramsLote = this.buildBaseParams()
        .set('page', '0')
        .set('size', '1000')
        .set('sort', 'pessoa');

      const filtroLote = new PessoaFilters();
      filtroLote.pagina = 0;
      filtroLote.itensPorPagina = 1000;
      filtroLote.params = paramsLote;

      const { pesPessoas } = await this.pesPessoaService.pesquisar(filtroLote as any);

      const listaLote = pesPessoas ?? [];

      if (!listaLote || listaLote.length === 0) {
        this.toastrService.warning('Não há registros para processar.', 'Aviso');
        this.statusCarga = 'SEM_REGISTROS';
        return;
      }

      const totalItens = listaLote.length;
      let concluidos = 0;

      for (const item of listaLote) {
        const pessoaId = item?.pessoa;

        if (!pessoaId) {
          this.totalErros++;
          concluidos++;
          this.progressoLote = Math.round((concluidos / totalItens) * 100);
          continue;
        }

        try {
          const processado =
            await this.processarPessoaLinhaLote(
              item
            );

          if (processado) {
            this.totalProcessado++;
          }
        } catch (e: any) {
          console.error(
            `Erro ao processar a pessoa ${pessoaId}`,
            e
          );

          this.totalErros++;

          const detalhe =
            typeof e?.error === 'string' && e.error.trim()
              ? e.error.trim()
              : 'Não foi possível concluir o processamento.';

          this.mensagemErro =
            `Pessoa ${pessoaId}: ${detalhe}`;

          this.toastrService.danger(
            this.mensagemErro,
            'Erro no processamento'
          );
        } finally {
          concluidos++;
          this.progressoLote = Math.round((concluidos / totalItens) * 100);
        }
      }

      this.statusCarga = 'FINALIZADO';

      const resumo =
        `Lote finalizado. Processados: ${this.totalProcessado}. Erros: ${this.totalErros}.`;

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

    } catch (e) {
      console.error(e);
      this.statusCarga = 'ERRO';
      this.mensagemErro = 'Erro ao executar o processamento em lote.';
      this.toastrService.danger(this.mensagemErro, 'Erro');
    } finally {
      this.processandoLote = false;
      this.isLoading = false;
    }
  }

  private async processarPessoaLinhaLote(pessoa: any): Promise<boolean> {

    const pessoaId =
      pessoa?.pessoa;

    const cpfCnpj =
      pessoa?.cnpjCpfDigits ||
      String(
        pessoa?.cnpjCpf ?? ''
      ).replace(/\D/g, '');

    const fisicaJuridica =
      pessoa?.fisicaJuridica || 'F';

    if (!pessoaId) {
      throw new Error(
        'Código da pessoa não encontrado.'
      );
    }

    if (!cpfCnpj) {
      throw new Error(
        `CPF não encontrado para a pessoa ${pessoaId}.`
      );
    }

    const resultado =
      await this.pesPessoaService
        .existeCpfCnpjNoCadUnico(
          cpfCnpj,
          fisicaJuridica
        );

    /*
    * No lote, se o CPF já existir:
    *
    * - não abre modal;
    * - não chama o processamento confirmado;
    * - não gera erro;
    * - apenas ignora o registro.
    */

    /*
    * No lote nunca abre modal.
    *
    * Se o CPF existir, consulta o motor para
    * decidir se pode vincular automaticamente.
    */
    if (resultado?.existe) {

      const avaliacao =
        this.unificacaoAutomaticaService
          .avaliar(
            {
              nome:
                pessoa?.nome ?? null,

              cpfCnpj:
                cpfCnpj,

              dataNascimento:
                pessoa?.dataNascimento ?? null,
            },
            {
              nome:
                resultado?.nome ?? null,

              cpfCnpj:
                resultado?.cpfCnpj ?? cpfCnpj,

              dataNascimento:
                resultado?.dataNascimento ?? null,
            }
          );

      /*
      * O motor aprovou:
      * vincula automaticamente ao Cadastro Único.
      */
      if (
        avaliacao.decisao ===
        'AUTOMATICA'
      ) {
        await this.pesPessoaService
          .processarPessoaJaExisteCadUnico(
            pessoaId
          );

        return true;
      }

      /*
      * EXIGIR_CONFIRMACAO ou INVALIDA:
      *
      * O lote não abre modal.
      * Mantém a pessoa para tratamento individual.
      */
      return false;
    }
    

    await this.pesPessoaService
      .processarPessoaUnica(
        pessoaId
      );

    return true;
  }

  private normalizePessoaRow(p: any): any {
    const digits =
      String(
        p?.cnpjCpf ??
        p?.cpf ??
        p?.cnpj ??
        p?.dadosPessoaFisica?.cpf ??
        p?.dadosPessoaJuridica?.cnpj ??
        ''
      ).replace(/\D/g, '');

    let cnpjCpf = '';

    if (digits.length === 11) {
      cnpjCpf = this.formatCpf(digits);
    } else if (digits.length === 14) {
      cnpjCpf = this.formatCnpj(digits);
    } else {
      cnpjCpf = String(p?.cnpjCpf ?? '');
    }

    const dnRaw =
      (p?.dataNascimento ??
        p?.dadosPessoaFisica?.dataNascimento ??
        '');

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
