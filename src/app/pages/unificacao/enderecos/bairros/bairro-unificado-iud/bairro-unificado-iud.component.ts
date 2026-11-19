import { Component, OnInit } from '@angular/core';
import { LocalDataSource } from 'ng2-smart-table';
import { NbDialogService, NbToastrService } from '@nebular/theme';
import { HttpParams } from '@angular/common/http';

import {
  BairroBaseCorreiosResumoDTO,
  BairroOrigemDTO,
  BairroUnificadoFilters,
  BairroUnificadoLoteDTO,
  BairroUnificadoResumoDTO,
  BairroUnificadoService,
  OrigemBairroDTO,
} from '../bairro-unificado.service';
import {
  DecisaoBairro,
  BairroCandidatosDialogComponent,
} from '../bairro-candidatos-dialog/bairro-candidatos-dialog.component';
import {
  ZerarBaseBairrosDialogComponent,
} from '../zerar-base-bairros-dialog/zerar-base-bairros-dialog.component';

@Component({
  selector: 'ngx-bairro-unificado-iud',
  templateUrl: './bairro-unificado-iud.component.html',
  styleUrls: ['./bairro-unificado-iud.component.scss'],
})
export class BairroUnificadoIudComponent implements OnInit {

  source: LocalDataSource = new LocalDataSource();
  isLoading = false;
  carregandoResumo = false;

  origens: OrigemBairroDTO[] = [];
  origemSelecionada = 'PES';

  /*
   * Filtro por situação. Vazio = todas.
   */
  situacaoSelecionada = '';

  resumo: BairroUnificadoResumoDTO | null = null;

  /*
   * Base dos Correios em BAIRROS_UNIFICADO.
   */
  resumoBase: BairroBaseCorreiosResumoDTO | null = null;
  erroResumoBase = '';
  processandoBase = false;
  mensagemBase = '';

  processandoLote = false;
  resultadoLote: BairroUnificadoLoteDTO | null = null;
  mensagemErro = '';

  filtro: BairroUnificadoFilters = new BairroUnificadoFilters();

  readonly situacoes = [
    { valor: '', descricao: 'Todas' },
    { valor: 'UNICA', descricao: 'Único' },
    { valor: 'DUPLICADA', descricao: 'Duplicado' },
    { valor: 'AMBIGUA', descricao: 'Ambíguo' },
    { valor: 'SEM_CORRESPONDENCIA', descricao: 'Sem correspondência' },
    { valor: 'DISTRITO_NAO_UNIFICADO', descricao: 'Distrito não unificado' },
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

      if (situacao === 'DISTRITO_NAO_UNIFICADO') {
        return 'linha-cinza';
      }

      return '';
    },

    columns: {

      cidadeOrigem: {
        title: 'Cidade',
        type: 'number',
        filter: true,
        width: '90px',
        filterFunction: (_cell?: any, _search?: string) => true,
      },

      distritoOrigem: {
        title: 'Distrito',
        type: 'number',
        filter: true,
        width: '80px',
        filterFunction: (_cell?: any, _search?: string) => true,
      },

      bairroOrigem: {
        title: 'Bairro',
        type: 'number',
        filter: true,
        width: '90px',
        filterFunction: (_cell?: any, _search?: string) => true,
      },

      nome: {
        title: 'Bairro na origem',
        type: 'string',
        filter: true,
        width: '240px',
        filterFunction: (_cell?: any, _search?: string) => true,
      },

      nomeCidade: {
        title: 'Cidade na origem',
        type: 'string',
        filter: true,
        width: '200px',
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
        width: '170px',
      },

      sugestao: {
        title: 'Sugestão (Correios)',
        type: 'string',
        filter: false,
        width: '240px',
      },

      qtdCandidatos: {
        title: 'Candidatos',
        type: 'number',
        filter: false,
        width: '90px',
      },

    },
  };

  constructor(
    private service: BairroUnificadoService,
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

  get baseVazia(): boolean {
    return this.resumoBase !== null
      && Number(this.resumoBase.totalUnificado ?? 0) === 0;
  }

  get bloqueado(): boolean {
    return this.processandoLote || this.processandoBase;
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

  listar(): void {
    this.filtro = new BairroUnificadoFilters();
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

    const valor = (campo: string): string =>
      String(filtersArray.find((f: any) => f.field === campo)?.search ?? '').trim();

    const cidade = valor('cidadeOrigem').replace(/\D/g, '');
    const distrito = valor('distritoOrigem').replace(/\D/g, '');
    const bairro = valor('bairroOrigem').replace(/\D/g, '');
    const nome = valor('nome');
    const nomeCidade = valor('nomeCidade');
    const uf = valor('uf');

    if (cidade.length > 0) {
      params = params.set('cidade', cidade);
    }

    if (distrito.length > 0) {
      params = params.set('distrito', distrito);
    }

    if (bairro.length > 0) {
      params = params.set('bairro', bairro);
    }

    if (nome.length > 0) {
      params = params.set('nome', nome);
    }

    if (nomeCidade.length > 0) {
      params = params.set('nomeCidade', nomeCidade);
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
      .then(({ bairros, total }) => {
        this.filtro.totalRegistros = total ?? 0;

        const lista = (bairros ?? []).map((d: BairroOrigemDTO) => this.normalizeRow(d));

        this.source.load(lista);
      })
      .catch((e) => {
        console.error(e);
        this.source.load([]);
        this.toastrService.danger(
          this.extrairMensagem(e, 'Erro ao carregar os bairros pendentes.'),
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

  private normalizeRow(d: BairroOrigemDTO): any {

    let sugestao = '';

    if (d?.idSugerido) {
      sugestao = `${d.nomeSugerido ?? ''} (${d.bairroCorreiosSugerido ?? '-'})`;
    }

    return {
      ...d,
      situacaoDescricao: this.descricaoSituacao(d?.situacao),
      sugestao,
    };
  }

  descricaoSituacao(situacao: string): string {
    return this.situacoes.find((s) => s.valor === situacao)?.descricao ?? situacao ?? '';
  }

  /**********************************************************************
   * BASE DOS CORREIOS
   **********************************************************************/

  private carregarResumoBase(): void {
    this.erroResumoBase = '';

    this.service.buscarResumoBaseCorreios()
      .then((resumo) => {
        this.resumoBase = resumo;
      })
      .catch((e) => {
        console.error('Erro ao carregar o resumo da base de bairros.', e);
        this.resumoBase = null;
        this.erroResumoBase = this.extrairMensagem(
          e,
          'Não foi possível carregar o resumo da base de bairros.'
        );
      });
  }

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
        resultado?.mensagem || 'Base de bairros atualizada.',
        'Base dos Correios'
      );

      this.atualizar();

    } catch (e: any) {

      console.error('Erro ao gerar a base de bairros.', e);

      this.mensagemBase = this.extrairMensagem(e, 'Erro ao gerar a base de bairros.');

      this.toastrService.danger(this.mensagemBase, 'Erro');

    } finally {
      this.processandoBase = false;
    }
  }

  async recomecarDoZero(): Promise<void> {

    if (this.bloqueado) {
      return;
    }

    const confirmacao: string =
      await this.dialogService
        .open(ZerarBaseBairrosDialogComponent, {
          closeOnBackdropClick: false,
        })
        .onClose
        .toPromise();

    if (!confirmacao) {
      return;
    }

    this.processandoBase = true;
    this.mensagemBase = '';
    this.resultadoLote = null;
    this.mensagemErro = '';

    try {

      const resultado = await this.service.zerarBaseCorreios(confirmacao);

      this.mensagemBase = resultado?.mensagem ?? '';

      this.toastrService.success(
        resultado?.mensagem || 'Base de bairros recomeçada do zero.',
        'Recomeçar do zero'
      );

      this.situacaoSelecionada = '';
      this.atualizar();

    } catch (e: any) {

      console.error('Erro ao recomeçar os bairros do zero.', e);

      this.mensagemBase = this.extrairMensagem(e, 'Erro ao recomeçar do zero.');

      this.toastrService.danger(this.mensagemBase, 'Erro');

    } finally {
      this.processandoBase = false;
    }
  }

  /**********************************************************************
   * UNIFICAÇÃO
   **********************************************************************/

  async onEditarLinha(event: any): Promise<void> {

    const bairro: BairroOrigemDTO = event?.data;

    if (!bairro?.cidadeOrigem || !bairro?.bairroOrigem) {
      this.toastrService.danger('Código do bairro não encontrado.', 'Erro');
      return;
    }

    const chave = `${bairro.cidadeOrigem}/${bairro.distritoOrigem}/${bairro.bairroOrigem}`;

    const decisao: DecisaoBairro =
      await this.dialogService
        .open(BairroCandidatosDialogComponent, {
          closeOnBackdropClick: false,
          context: {
            origem: this.origemSelecionada,
            origemDescricao: this.origemDescricao,
            bairro,
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
          bairro,
          decisao.idUnificado
        );
      }

      if (decisao.acao === 'CRIAR') {
        mensagem = await this.service.criar(
          this.origemSelecionada,
          bairro
        );
      }

      if (decisao.acao === 'NAO_VINCULAR') {
        mensagem = await this.service.naoVincular(
          this.origemSelecionada,
          bairro,
          decisao.motivo
        );
      }

      this.toastrService.success(mensagem || `Bairro ${chave} processado.`, 'Sucesso');

      this.atualizar();

    } catch (e: any) {

      console.error(`Erro ao processar o bairro ${chave}`, e);

      this.toastrService.danger(
        this.extrairMensagem(e, `Erro ao processar o bairro ${chave}.`),
        'Erro'
      );

    } finally {
      this.isLoading = false;
    }
  }

  async vincularUnicos(): Promise<void> {

    if (this.processandoLote) {
      this.toastrService.warning('Já existe um processamento em andamento.', 'Aviso');
      return;
    }

    const total = this.resumo?.totalUnicos ?? 0;

    if (total === 0) {
      this.toastrService.warning('Não há bairros com situação Único.', 'Aviso');
      return;
    }

    this.processandoLote = true;
    this.resultadoLote = null;
    this.mensagemErro = '';

    try {

      this.resultadoLote = await this.service.vincularUnicos(this.origemSelecionada);

      const r = this.resultadoLote;

      const resumo =
        `Analisados: ${r.totalAnalisados}. ` +
        `Vinculados: ${r.totalVinculados}. ` +
        `Duplicados: ${r.totalDuplicados}. ` +
        `Erros: ${r.totalErros}.`;

      if (r.totalErros > 0) {
        this.toastrService.warning(resumo, 'Finalizado com erros');
      } else {
        this.toastrService.success(resumo, 'Sucesso');
      }

      this.atualizar();

    } catch (e: any) {

      console.error('Erro na vinculação em lote de bairros.', e);

      this.mensagemErro = this.extrairMensagem(e, 'Erro ao executar a vinculação em lote.');

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
