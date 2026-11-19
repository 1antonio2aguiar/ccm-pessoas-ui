import { Component, OnInit } from '@angular/core';
import { LocalDataSource } from 'ng2-smart-table';
import { NbDialogService, NbToastrService } from '@nebular/theme';
import { HttpParams } from '@angular/common/http';

import {
  CidadeBaseCorreiosResumoDTO,
  CidadeOrigemDTO,
  CidadeUnificadoFilters,
  CidadeUnificadoLoteDTO,
  CidadeUnificadoResumoDTO,
  CidadeUnificadoService,
  OrigemCidadeDTO,
} from '../cidade-unificado.service';
import {
  CidadeCandidatosDialogComponent,
  DecisaoCidade,
} from '../cidade-candidatos-dialog/cidade-candidatos-dialog.component';
import {
  DecisaoZerarBase,
  ZerarBaseDialogComponent,
} from '../zerar-base-dialog/zerar-base-dialog.component';

@Component({
  selector: 'ngx-cidade-unificado-iud',
  templateUrl: './cidade-unificado-iud.component.html',
  styleUrls: ['./cidade-unificado-iud.component.scss'],
})
export class CidadeUnificadoIudComponent implements OnInit {

  source: LocalDataSource = new LocalDataSource();
  isLoading = false;
  carregandoResumo = false;

  origens: OrigemCidadeDTO[] = [];
  origemSelecionada = 'PES';

  /*
   * Filtro por situação. Vazio = todas.
   */
  situacaoSelecionada = '';

  resumo: CidadeUnificadoResumoDTO | null = null;

  /*
   * Base dos Correios em CIDADES_UNIFICADO.
   */
  resumoBase: CidadeBaseCorreiosResumoDTO | null = null;
  processandoBase = false;
  mensagemBase = '';

  processandoLote = false;
  resultadoLote: CidadeUnificadoLoteDTO | null = null;
  mensagemErro = '';

  filtro: CidadeUnificadoFilters = new CidadeUnificadoFilters();

  readonly situacoes = [
    { valor: '', descricao: 'Todas' },
    { valor: 'UNICA', descricao: 'Única' },
    { valor: 'DUPLICADA', descricao: 'Duplicada' },
    { valor: 'AMBIGUA', descricao: 'Ambígua' },
    { valor: 'SEM_CORRESPONDENCIA', descricao: 'Sem correspondência' },
  ];

  settings = {
    mode: 'external',

    pager: {
      perPage: this.filtro.itensPorPagina,
      display: true,
    },

    actions: {
      add: false,
      edit: true,
      delete: false,
      position: 'right',
      columnTitle: 'Unificar',
    },

    edit: {
      editButtonContent: '<i class="nb-edit"></i>',
      saveButtonContent: '',
      cancelButtonContent: '',
      confirmSave: true,
    },

    rowClassFunction: (row: any) => {
      const situacao = row.data.situacao;

      if (situacao === 'UNICA') {
        return 'linha-verde';
      }

      if (situacao === 'DUPLICADA') {
        return 'linha-laranja';
      }

      if (situacao === 'SEM_CORRESPONDENCIA') {
        return 'linha-vermelha';
      }

      return '';
    },

    columns: {

      cidadeOrigem: {
        title: 'Código',
        type: 'number',
        filter: true,
        width: '100px',
        filterFunction: (_cell?: any, _search?: string) => true,
      },

      nome: {
        title: 'Nome na origem',
        type: 'string',
        filter: true,
        width: '320px',
        filterFunction: (_cell?: any, _search?: string) => true,
      },

      uf: {
        title: 'UF',
        type: 'string',
        filter: true,
        width: '70px',
        filterFunction: (_cell?: any, _search?: string) => true,
      },

      situacaoDescricao: {
        title: 'Situação',
        type: 'string',
        filter: false,
        width: '180px',
      },

      sugestao: {
        title: 'Sugestão (Correios)',
        type: 'string',
        filter: false,
        width: '320px',
      },

      qtdCandidatos: {
        title: 'Candidatos',
        type: 'number',
        filter: false,
        width: '100px',
      },

    },
  };

  constructor(
    private service: CidadeUnificadoService,
    private toastrService: NbToastrService,
    private dialogService: NbDialogService,
  ) { }

  ngOnInit(): void {
    this.carregarOrigens();
    this.atualizar();

    this.source.onChanged().subscribe((change) => {
      if (change.action === 'filter') {
        this.onTableFilter(change.filter);
      }
    });
  }

  get origemDescricao(): string {
    return this.origens.find((o) => o.codigo === this.origemSelecionada)?.descricao
      ?? this.origemSelecionada;
  }

  private async carregarOrigens(): Promise<void> {
    try {
      this.origens = (await this.service.listarOrigens()) ?? [];
    } catch (e) {
      console.error(e);
      this.toastrService.danger('Erro ao carregar as origens.', 'Erro');
    }
  }

  onOrigemChange(origem: string): void {
    this.origemSelecionada = origem;
    this.situacaoSelecionada = '';
    this.resultadoLote = null;
    this.mensagemErro = '';
    this.atualizar();
  }

  onSituacaoChange(situacao: string): void {
    this.situacaoSelecionada = situacao ?? '';
    this.listar();
  }

  atualizar(): void {
    this.listar();
    this.carregarResumo();
    this.carregarResumoBase();
  }

  get baseVazia(): boolean {
    return this.resumoBase !== null
      && Number(this.resumoBase.totalUnificado ?? 0) === 0;
  }

  get bloqueado(): boolean {
    return this.processandoLote || this.processandoBase;
  }

  /**********************************************************************
   * BASE DOS CORREIOS
   **********************************************************************/

  erroResumoBase = '';

  private carregarResumoBase(): void {
    this.erroResumoBase = '';

    this.service.buscarResumoBaseCorreios()
      .then((resumo) => {
        this.resumoBase = resumo;
      })
      .catch((e) => {
        console.error('Erro ao carregar o resumo da base dos Correios.', e);
        this.resumoBase = null;
        this.erroResumoBase = this.extrairMensagem(
          e,
          'Não foi possível carregar o resumo da base dos Correios.'
        );
      });
  }

  /*
   * Incremental: só acrescenta as cidades dos Correios que faltam.
   */
  async gerarBase(): Promise<void> {

    if (this.bloqueado) {
      return;
    }

    this.processandoBase = true;
    this.mensagemBase = '';

    try {

      const resultado = await this.service.gerarBaseCorreios();

      this.mensagemBase = resultado?.mensagem ?? '';

      this.toastrService.success(
        resultado?.mensagem || 'Base dos Correios atualizada.',
        'Base dos Correios'
      );

      this.atualizar();

    } catch (e: any) {

      console.error('Erro ao gerar a base dos Correios.', e);

      this.mensagemBase =
        this.extrairMensagem(e, 'Erro ao gerar a base dos Correios.');

      this.toastrService.danger(this.mensagemBase, 'Erro');

    } finally {
      this.processandoBase = false;
    }
  }

  /*
   * Apaga CIDADES_UNIFICADO e CIDADES_UNIFICADO_CTRL
   * e gera a base novamente. Exige digitar ZERAR.
   */
  async recomecarDoZero(): Promise<void> {

    if (this.bloqueado) {
      return;
    }

    const decisao: DecisaoZerarBase =
      await this.dialogService
        .open(ZerarBaseDialogComponent, {
          closeOnBackdropClick: false,
        })
        .onClose
        .toPromise();

    if (!decisao?.confirmacao) {
      return;
    }

    this.processandoBase = true;
    this.mensagemBase = '';
    this.resultadoLote = null;
    this.mensagemErro = '';

    try {

      const resultado =
        await this.service.zerarBaseCorreios(
          decisao.confirmacao,
          decisao.apagarFicticias
        );

      this.mensagemBase = resultado?.mensagem ?? '';

      this.toastrService.success(
        resultado?.mensagem || 'Base recomeçada do zero.',
        'Recomeçar do zero'
      );

      this.situacaoSelecionada = '';
      this.atualizar();

    } catch (e: any) {

      console.error('Erro ao recomeçar do zero.', e);

      this.mensagemBase =
        this.extrairMensagem(e, 'Erro ao recomeçar do zero.');

      this.toastrService.danger(this.mensagemBase, 'Erro');

    } finally {
      this.processandoBase = false;
    }
  }

  listar(): void {
    this.filtro = new CidadeUnificadoFilters();
    this.execSearch(this.buildBaseParams());
  }

  private buildBaseParams(): HttpParams {

    let params = new HttpParams()
      .set('page', '0')
      .set('size', String(this.filtro.tamanhoConsulta));

    if (this.situacaoSelecionada) {
      params = params.set('situacao', this.situacaoSelecionada);
    }

    return params;
  }

  onTableFilter(change: any): void {
    let params = this.buildBaseParams();

    const filtersArray = change?.filters ?? [];

    const cidadeFilter = filtersArray.find((f: any) => f.field === 'cidadeOrigem');
    const nomeFilter = filtersArray.find((f: any) => f.field === 'nome');
    const ufFilter = filtersArray.find((f: any) => f.field === 'uf');

    const cidade = String(cidadeFilter?.search ?? '').replace(/\D/g, '');
    const nome = String(nomeFilter?.search ?? '').trim();
    const uf = String(ufFilter?.search ?? '').trim();

    if (cidade.length > 0) {
      params = params.set('cidade', cidade);
    }

    if (nome.length > 0) {
      params = params.set('nome', nome);
    }

    if (uf.length === 2) {
      params = params.set('uf', uf.toUpperCase());
    }

    this.execSearch(params);
  }

  private execSearch(params: HttpParams): void {
    this.filtro.params = params;

    this.isLoading = true;

    this.service.pesquisarPendentes(this.origemSelecionada, params)
      .then(({ cidades, total }) => {
        this.filtro.totalRegistros = total ?? 0;

        const lista = (cidades ?? []).map((c: CidadeOrigemDTO) => this.normalizeRow(c));

        this.source.load(lista);
      })
      .catch((e) => {
        console.error(e);
        this.source.load([]);
        this.toastrService.danger(
          this.extrairMensagem(e, 'Erro ao carregar as cidades pendentes.'),
          'Erro'
        );
      })
      .finally(() => {
        this.isLoading = false;
      });
  }

  private carregarResumo(): void {
    this.carregandoResumo = true;

    this.service.buscarResumo(this.origemSelecionada)
      .then((resumo) => {
        this.resumo = resumo;
      })
      .catch((e) => {
        console.error(e);
        this.resumo = null;
      })
      .finally(() => {
        this.carregandoResumo = false;
      });
  }

  private normalizeRow(c: CidadeOrigemDTO): any {

    let sugestao = '';

    if (c?.idSugerido) {
      sugestao = `${c.nomeSugerido ?? ''} (${c.cidadeCorreiosSugerida ?? '-'})`;
    }

    return {
      ...c,
      situacaoDescricao: this.descricaoSituacao(c?.situacao),
      sugestao,
    };
  }

  descricaoSituacao(situacao: string): string {
    return this.situacoes.find((s) => s.valor === situacao)?.descricao ?? situacao ?? '';
  }

  /*
   * Abre o diálogo de análise da cidade.
   */
  async onEditarLinha(event: any): Promise<void> {

    const cidade: CidadeOrigemDTO = event?.data;

    if (!cidade?.cidadeOrigem) {
      this.toastrService.danger('Código da cidade não encontrado.', 'Erro');
      return;
    }

    const decisao: DecisaoCidade =
      await this.dialogService
        .open(CidadeCandidatosDialogComponent, {
          closeOnBackdropClick: false,
          context: {
            origem: this.origemSelecionada,
            origemDescricao: this.origemDescricao,
            cidade,
          },
        })
        .onClose
        .toPromise();

    if (!decisao?.acao) {
      return;
    }

    this.isLoading = true;

    try {

      let mensagem = '';

      if (decisao.acao === 'VINCULAR') {
        mensagem = await this.service.vincular(
          this.origemSelecionada,
          cidade.cidadeOrigem,
          decisao.idUnificado
        );
      }

      if (decisao.acao === 'CRIAR') {
        mensagem = await this.service.criar(
          this.origemSelecionada,
          cidade.cidadeOrigem
        );
      }

      if (decisao.acao === 'NAO_VINCULAR') {
        mensagem = await this.service.naoVincular(
          this.origemSelecionada,
          cidade.cidadeOrigem,
          decisao.motivo
        );
      }

      this.toastrService.success(
        mensagem || `Cidade ${cidade.cidadeOrigem} processada.`,
        'Sucesso'
      );

      this.atualizar();

    } catch (e: any) {

      console.error(`Erro ao processar a cidade ${cidade.cidadeOrigem}`, e);

      this.toastrService.danger(
        this.extrairMensagem(e, `Erro ao processar a cidade ${cidade.cidadeOrigem}.`),
        'Erro'
      );

    } finally {
      this.isLoading = false;
    }
  }

  /*
   * Vincula de uma vez todas as cidades com situação ÚNICA.
   * O processamento é feito no backend, cada cidade em sua transação.
   */
  async vincularUnicas(): Promise<void> {

    if (this.processandoLote) {
      this.toastrService.warning('Já existe um processamento em andamento.', 'Aviso');
      return;
    }

    const total = this.resumo?.totalUnicas ?? 0;

    if (total === 0) {
      this.toastrService.warning('Não há cidades com situação Única.', 'Aviso');
      return;
    }

    this.processandoLote = true;
    this.resultadoLote = null;
    this.mensagemErro = '';

    try {

      this.resultadoLote =
        await this.service.vincularUnicas(this.origemSelecionada);

      const r = this.resultadoLote;

      const resumo =
        `Analisadas: ${r.totalAnalisados}. ` +
        `Vinculadas: ${r.totalVinculados}. ` +
        `Duplicadas: ${r.totalDuplicados}. ` +
        `Erros: ${r.totalErros}.`;

      if (r.totalErros > 0) {
        this.toastrService.warning(resumo, 'Finalizado com erros');
      } else {
        this.toastrService.success(resumo, 'Sucesso');
      }

      this.atualizar();

    } catch (e: any) {

      console.error('Erro na vinculação em lote de cidades.', e);

      this.mensagemErro =
        this.extrairMensagem(e, 'Erro ao executar a vinculação em lote.');

      this.toastrService.danger(this.mensagemErro, 'Erro');

    } finally {
      this.processandoLote = false;
    }
  }

  private extrairMensagem(e: any, padrao: string): string {

    if (typeof e?.error === 'string' && e.error.trim()) {
      return e.error.trim();
    }

    if (e?.error?.message) {
      return e.error.message;
    }

    return e?.message || padrao;
  }
}
