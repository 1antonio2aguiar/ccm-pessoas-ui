import { Component, OnDestroy, OnInit } from '@angular/core';
import { LocalDataSource } from 'ng2-smart-table';
import { HttpParams } from '@angular/common/http';

import { RhPessoaService, RhPessoaFilters, PessoaCpfCnpjCadUnicoDTO } from '../rh-pessoa.service';
import { NbDialogService, NbToastrService, } from '@nebular/theme';

import { ConfirmarUnificacaoDialogComponent, } from '../../../../../shared/components/confirmar-unificacao-dialog/confirmar-unificacao-dialog.component';
import { UnificacaoAutomaticaService, } from '../../../../../shared/services/unificacao-automatica.service';
import { ControleMigracaoPessoaService } from '../../../../../shared/services/controle-migracao-pessoa.service';

@Component({
  selector: 'ngx-rh-pessoa-iud',
  templateUrl: './rh-pessoa-iud.component.html',
  styleUrls: ['./rh-pessoa-iud.component.scss'],
})

export class RhPessoaIudComponent implements OnInit, OnDestroy {

  source: LocalDataSource = new LocalDataSource();
  isLoading = false;

  processandoLote = false;
  progressoLote = 0;
  statusCarga = '';
  totalProcessado = 0;
  totalErros = 0;
  totalIgnorados = 0;
  mensagemErro = '';

  filtro: RhPessoaFilters = new RhPessoaFilters();

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
      const status = row?.data?.statusCadastro;

      if (status === 'JA_EXISTE_CAD_UNICO') {
        return 'linha-status-cad-unico';
      }

      if (status === 'UNICO_RH') {
        return 'linha-status-unico-rh';
      }

      if (status === 'DUPLICADO_RH') {
        return 'linha-status-duplicado-rh';
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
        width: '420px',
        filterFunction: (_cell?: any, _search?: string) => true,
      },

      /*fisicaJuridica: {
        title: 'F/J',
        type: 'string',
        width: '80px',
        filter: true,
        filterFunction: (_cell?: any, _search?: string) => true,
      },*/

      statusCadastro: {
        title: 'Status',
        type: 'string',
        width: '200px',
        filter: {
          type: 'list',
          config: {
            selectText: 'Todos',
            list: [
              { value: 'JA_EXISTE_CAD_UNICO', title: 'Já existe no Cad. Único' },
              { value: 'UNICO_RH', title: 'Único no RH' },
              { value: 'DUPLICADO_RH', title: 'Duplicado no RH' },
              { value: 'SEM_CPF_CNPJ', title: 'Sem CPF/CNPJ' },
            ],
          },
        },
        valuePrepareFunction: (value: string) => this.descreverStatusCadastro(value),
      },

      cgcCpf: {
        title: 'CPF/CNPJ',
        type: 'string',
        width: '180px',
        filter: true,
        valuePrepareFunction: (value: any) => this.formatDocumento(String(value ?? '').replace(/\D/g, '')),
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
    private service: RhPessoaService,
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
    this.filtro = new RhPessoaFilters();
    this.filtro.pagina = 0;
    this.filtro.itensPorPagina = 1000;

    this.execSearch(this.buildBaseParams());
  }

  onCreateConfirm(event: any): void {
    this.processarLoteTela();
  }

  onEditarLinha(event: any): void {
    const pessoa = event?.data;
    const pessoaId = pessoa?.pessoa;
    const status = pessoa?.statusCadastro;
    const fisicaJuridica = pessoa?.fisicaJuridica;

    if (!pessoaId) {
      this.toastrService.danger('Código da pessoa não encontrado.', 'Erro');
      return;
    }

    if (fisicaJuridica === 'F') {
      if (status === 'UNICO_RH') {
        this.processarCpfUnicoLinha(pessoa);
        return;
      }

      if (status === 'DUPLICADO_RH') {
        this.processarCpfDuplicadoLinha(pessoa);
        return;
      }

      if (status === 'JA_EXISTE_CAD_UNICO') {
        this.processarJaExisteCadUnicoLinha(pessoaId);
        return;
      }
    }

    if (fisicaJuridica === 'J') {
      if (status === 'UNICO_RH') {
        this.processarCnpjUnicoLinha(pessoa);
        return;
      }

      this.toastrService.warning('Processamento de CNPJ disponível somente para Único no RH.', 'Atenção');
      return;
    }

    this.toastrService.warning('Tipo de pessoa não suportado.', 'Atenção');
  }

  private buildBaseParams(): HttpParams {
    return new HttpParams().set('sort', 'pessoa');
  }

  onTableFilter(change: any): void {
    let params = this.buildBaseParams();

    const filtersArray = change?.filters ?? [];

    const pessoaFilter = filtersArray.find((f: any) => f.field === 'pessoa');
    const nomeFilter = filtersArray.find((f: any) => f.field === 'nome');
    const fisicaJuridicaFilter = filtersArray.find((f: any) => f.field === 'fisicaJuridica');
    const statusFilter = filtersArray.find((f: any) => f.field === 'statusCadastro');
    const cpfCnpjFilter = filtersArray.find((f: any) => f.field === 'cgcCpf');
    const nascimentoFilter = filtersArray.find((f: any) => f.field === 'dataNascimento');

    const pessoa = String(pessoaFilter?.search ?? '').trim();
    const nome = String(nomeFilter?.search ?? '').trim();
    const fisicaJuridica = String(fisicaJuridicaFilter?.search ?? '').trim().toUpperCase();
    const statusCadastro = this.normalizarStatusCadastro(String(statusFilter?.search ?? '').trim());

    const cpfCnpjRaw = String(cpfCnpjFilter?.search ?? '').trim();
    const cpfCnpjDigits = cpfCnpjRaw.replace(/\D/g, '');

    const nascRaw = String(nascimentoFilter?.search ?? '').trim();

    if (pessoa.length > 0) {
      params = params.set('pessoa', pessoa);
    }

    if (nome.length > 0) {
      params = params.set('nome', nome);
    }

    if (fisicaJuridica.length > 0) {
      params = params.set('fisicaJuridica', fisicaJuridica.substring(0, 1));
    }

    if (statusCadastro.length > 0) {
      params = params.set('statusCadastro', statusCadastro);
    }

    if (cpfCnpjDigits.length >= 6) {
      if (cpfCnpjDigits.length <= 11) {
        params = params.set('cpf', cpfCnpjDigits);
      } else {
        params = params.set('cnpj', cpfCnpjDigits);
      }
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
    this.service.pesquisar({ ...this.filtro, params } as any)
      .then(({ rhPessoas, total }) => {
        this.filtro.totalRegistros = total ?? 0;

        const lista = (rhPessoas ?? []).map((p: any) => this.normalizePessoaRow(p));
        this.source.load(lista);
      })
      .catch((e) => {
        console.error(e);
        this.source.load([]);
        this.toastrService.danger('Erro ao carregar a lista do RH.', 'Erro');
      })
      .finally(() => {
        this.isLoading = false;
      });
  }

  private async processarCpfUnicoLinha(pessoa: any): Promise<void> {
    const pessoaId = pessoa?.pessoa;

    if (!(await this.validarDocumentoAntesProcessar(pessoa))) {
      return;
    }

    this.isLoading = true;
    this.service.processarCpfUnico(pessoaId)
      .then((msg) => {
        this.toastrService.success(msg || `Pessoa ${pessoaId} processada com sucesso.`, 'Sucesso');
        this.execSearch(this.filtro.params || this.buildBaseParams());
      })
      .catch((e) => {
        console.error(e);
        this.toastrService.danger(e?.error || `Erro ao processar CPF único da pessoa ${pessoaId}.`, 'Erro');
      })
      .finally(() => {
        this.isLoading = false;
      });
  }

  private async processarCpfDuplicadoLinha(pessoa: any): Promise<void> {
    const pessoaId = pessoa?.pessoa;

    if (!(await this.validarDocumentoAntesProcessar(pessoa))) {
      return;
    }

    this.isLoading = true;
    this.service.processarCpfDuplicado(pessoaId)
      .then((msg) => {
        this.toastrService.success(msg || `Grupo duplicado da pessoa ${pessoaId} processado com sucesso.`, 'Sucesso');
        this.execSearch(this.filtro.params || this.buildBaseParams());
      })
      .catch((e) => {
        console.error(e);
        this.toastrService.danger(e?.error || `Erro ao processar CPF duplicado da pessoa ${pessoaId}.`, 'Erro');
      })
      .finally(() => {
        this.isLoading = false;
      });
  }

  private async processarCnpjUnicoLinha(pessoa: any): Promise<void> {
    const pessoaId = pessoa?.pessoa;

    if (!(await this.validarDocumentoAntesProcessar(pessoa))) {
      return;
    }

    this.isLoading = true;
    this.service.processarCnpjUnico(pessoaId)
      .then((msg) => {
        this.toastrService.success(msg || `Pessoa jurídica ${pessoaId} processada com sucesso.`, 'Sucesso');
        this.execSearch(this.filtro.params || this.buildBaseParams());
      })
      .catch((e) => {
        console.error(e);
        this.toastrService.danger(e?.error || `Erro ao processar CNPJ único da pessoa ${pessoaId}.`, 'Erro');
      })
      .finally(() => {
        this.isLoading = false;
      });
  }

  private processarJaExisteCadUnicoLinha(pessoaId: number): void {
    this.isLoading = true;

    this.service.processarJaExisteCadUnico(pessoaId)
      .then((msg) => {
        this.toastrService.success(msg || `Pessoa ${pessoaId} vinculada ao Cadastro Único com sucesso.`, 'Sucesso');
        this.execSearch(this.filtro.params || this.buildBaseParams());
      })
      .catch((e) => {
        console.error(e);
        this.toastrService.danger(e?.error || `Erro ao vincular a pessoa ${pessoaId} ao Cadastro Único.`, 'Erro');
      })
      .finally(() => {
        this.isLoading = false;
      });
  }

  private async processarPessoaLinhaLote(pessoa: any): Promise<'PROCESSADO' | 'IGNORADO'> {
    const pessoaId = pessoa?.pessoa;
    const statusCadastro = pessoa?.statusCadastro;
    const fisicaJuridica = pessoa?.fisicaJuridica;

    if (!pessoaId) {
      throw new Error('Código da pessoa não encontrado.');
    }

    if (statusCadastro === 'JA_EXISTE_CAD_UNICO') {
      await this.service.processarJaExisteCadUnico(pessoaId);
      return 'PROCESSADO';
    }

    if (statusCadastro !== 'UNICO_RH' && statusCadastro !== 'DUPLICADO_RH') {
      return 'IGNORADO';
    }

    const podeProcessar = await this.validarDocumentoAntesProcessar(pessoa, false);
    if (!podeProcessar) {
      return 'IGNORADO';
    }

    if (fisicaJuridica === 'F') {
      if (statusCadastro === 'UNICO_RH') {
        await this.service.processarCpfUnico(pessoaId);
        return 'PROCESSADO';
      }

      if (statusCadastro === 'DUPLICADO_RH') {
        await this.service.processarCpfDuplicado(pessoaId);
        return 'PROCESSADO';
      }
    }

    if (fisicaJuridica === 'J' && statusCadastro === 'UNICO_RH') {
      await this.service.processarCnpjUnico(pessoaId);
      return 'PROCESSADO';
    }

    return 'IGNORADO';
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
    this.totalIgnorados = 0;
    this.mensagemErro = '';
    this.progressoLote = 0;

    try {
      const paramsLote = (this.filtro.params || this.buildBaseParams())
        .set('page', '0')
        .set('size', '1000')
        .set('sort', 'pessoa');

      const filtroLote = new RhPessoaFilters();
      filtroLote.pagina = 0;
      filtroLote.itensPorPagina = 1000;
      filtroLote.params = paramsLote;

      const { rhPessoas } = await this.service.pesquisar(filtroLote as any);
      const listaLote = (rhPessoas ?? []).map((p: any) => this.normalizePessoaRow(p));

      if (!listaLote || listaLote.length === 0) {
        this.toastrService.warning('Não há registros para processar.', 'Aviso');
        this.statusCarga = 'SEM_REGISTROS';
        return;
      }

      const totalItens = listaLote.length;
      let concluidos = 0;

      for (const item of listaLote) {
        try {
          const resultado = await this.processarPessoaLinhaLote(item);

          if (resultado === 'PROCESSADO') {
            this.totalProcessado++;
          } else {
            this.totalIgnorados++;
          }
        } catch (e) {
          console.error(`Erro ao processar a pessoa ${item?.pessoa}`, e);
          this.totalErros++;
          this.mensagemErro = `Erro ao processar a pessoa ${item?.pessoa}.`;
        } finally {
          concluidos++;
          this.progressoLote = Math.round((concluidos / totalItens) * 100);
        }
      }

      this.statusCarga = 'FINALIZADO';
      this.toastrService.success(
        `Lote finalizado. Processados: ${this.totalProcessado}. Ignorados: ${this.totalIgnorados}. Erros: ${this.totalErros}.`,
        'Sucesso'
      );

      this.execSearch(this.filtro.params || this.buildBaseParams());

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

  private async validarDocumentoAntesProcessar(
    pessoa: any,
    mostrarMensagem = true
  ): Promise<boolean> {

    const pessoaId =
      pessoa?.pessoa;

    const fisicaJuridica =
      pessoa?.fisicaJuridica;

    const documento =
      this.obterDocumentoDigits(
        pessoa
      );

    if (!documento) {

      if (mostrarMensagem) {
        this.toastrService.danger(
          'CPF/CNPJ não encontrado para validação.',
          'Erro'
        );
      }

      return false;
    }

    if (
      fisicaJuridica !== 'F' &&
      fisicaJuridica !== 'J'
    ) {

      if (mostrarMensagem) {
        this.toastrService.warning(
          'Tipo de pessoa não suportado para validação.',
          'Atenção'
        );
      }

      return false;
    }

    const resultado:
      PessoaCpfCnpjCadUnicoDTO =
      await this.service
        .existeCpfCnpjNoCadUnico(
          documento,
          fisicaJuridica
        );

    /*
    * Documento ainda não existe:
    * permite continuar no processamento normal.
    */
    if (!resultado?.existe) {
      return true;
    }

    /*
    * Nesta primeira etapa, o lote permanece
    * com o comportamento anterior.
    *
    * Depois aplicaremos o motor especificamente
    * no processamento em lote.
    */
    if (!mostrarMensagem) {
      return false;
    }

    /*
    * Compara os dados da origem RH com os dados
    * encontrados no Cadastro Único.
    */
    const avaliacao =
      this.unificacaoAutomaticaService
        .avaliar(
          {
            nome:
              pessoa?.nome ?? null,

            cpfCnpj:
              documento,

            dataNascimento:
              pessoa?.dataNascimento ?? null,
          },
          {
            nome:
              resultado?.nome ?? null,

            cpfCnpj:
              resultado?.cpfCnpj ?? documento,

            dataNascimento:
              resultado?.dataNascimento ?? null,
          }
        );

    /*
    * Dados incompatíveis:
    * não permite vincular nem abrir o modal.
    */
    if (
      avaliacao.decisao ===
      'INVALIDA'
    ) {

      this.toastrService.danger(
        avaliacao.motivo,
        'Dados incompatíveis'
      );

      return false;
    }

    /*
    * O motor considerou a comparação segura:
    *
    * - nomes normalizados iguais; ou
    * - documento e nascimento iguais,
    *   com diferença de apenas uma letra.
    *
    * Vincula automaticamente, sem modal.
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

      this.execSearch(
        this.filtro.params ||
        this.buildBaseParams()
      );

      /*
      * Retorna false porque a vinculação já foi
      * realizada. O processamento de CPF único
      * ou duplicado não deve continuar.
      */
      return false;
    }

    /*
    * O documento existe, mas os dados não atendem
    * à regra automática. O usuário precisa decidir.
    */
    const confirmou =
      await this.dialogService
        .open(
          ConfirmarUnificacaoDialogComponent,
          {
            closeOnBackdropClick: false,

            context: {
              tituloOrigem:
                'Recursos Humanos',

              pessoaOrigem: {
                nome:
                  pessoa?.nome ?? null,

                cpfCnpj:
                  documento,

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

      const statusCadastro =
        this.normalizarStatusCadastro(
          pessoa?.statusCadastro
        );

    /*
    * CPF duplicado:
    * o backend recupera e marca todos os
    * integrantes do grupo como não migrar.
    */
    if (
      statusCadastro ===
      'DUPLICADO_RH'
    ) {

      const mensagem =
        await this.service
          .registrarGrupoCpfDuplicadoNaoMigrar(
            pessoaId
          );

      this.toastrService.info(
        mensagem ||
          'Grupo retirado da lista de migração.',
        'Não unificar'
      );

      this.execSearch(
        this.filtro.params ||
        this.buildBaseParams()
      );

      return false;
    }

      /*
      * CPF único:
      * registra somente a pessoa selecionada.
      */
      await this.controleMigracaoPessoaService
        .registrarNaoMigrar(
          'RH',
          pessoaId
        );

      this.toastrService.info(
        'Pessoa retirada da lista de migração.',
        'Não unificar'
      );

      this.execSearch(
        this.filtro.params ||
        this.buildBaseParams()
      );

      return false;
    }

    /*
     * Qualquer encerramento sem uma resposta
     * explícita não grava decisão.
     */
    if (confirmou !== true) {
      return false;
    }

    /*
    * O usuário confirmou manualmente.
    */
    const mensagem =
      await this.service
        .processarJaExisteCadUnico(
          pessoaId
        );

    this.toastrService.success(
      mensagem ||
      `Pessoa ${pessoaId} vinculada ao Cadastro Único com sucesso.`,
      'Sucesso'
    );

    this.execSearch(
      this.filtro.params ||
      this.buildBaseParams()
    );

    /*
    * A vinculação já foi realizada.
    * Impede que o processamento normal continue.
    */
    return false;
  }

  private obterDocumentoDigits(p: any): string {
    return String(
      p?.cgcCpfDigits ??
      p?.cgcCpf ??
      p?.cpf ??
      p?.cnpj ??
      ''
    ).replace(/\D/g, '');
  }

  private normalizePessoaRow(p: any): any {
    const digits = this.obterDocumentoDigits(p);

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
      cgcCpf: this.formatDocumento(digits) || String(p?.cgcCpf ?? ''),
      dataNascimento,
      statusCadastroDescricao: this.descreverStatusCadastro(p?.statusCadastro),
    };
  }

  private normalizarStatusCadastro(valor: string): string {
    const v = valor
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[\s-]+/g, '_')
      .toUpperCase();

    if (v === 'SEM_CPF' || v === 'SEM_CNPJ' || v === 'SEM_CPF_CNPJ') {
      return 'SEM_CPF_CNPJ';
    }

    if (v === 'JA_EXISTE' || v === 'EXISTE' || v === 'JA_EXISTE_CAD_UNICO') {
      return 'JA_EXISTE_CAD_UNICO';
    }

    if (v === 'DUPLICADO' || v === 'DUPLICADO_RH') {
      return 'DUPLICADO_RH';
    }

    if (v === 'UNICO' || v === 'UNICO_RH') {
      return 'UNICO_RH';
    }

    return v;
  }

  private descreverStatusCadastro(status: string): string {
    switch (status) {
      case 'SEM_CPF_CNPJ':
        return 'Sem CPF/CNPJ';
      case 'JA_EXISTE_CAD_UNICO':
        return 'Já existe no Cad. Único';
      case 'DUPLICADO_RH':
        return 'Duplicado no RH';
      case 'UNICO_RH':
        return 'Único no RH';
      default:
        return status ?? '';
    }
  }

  private formatDocumento(d: string): string {
    if (!d) {
      return '';
    }

    if (d.length <= 11) {
      return this.formatCpf(d.padStart(11, '0'));
    }

    return this.formatCnpj(d.padStart(14, '0'));
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
