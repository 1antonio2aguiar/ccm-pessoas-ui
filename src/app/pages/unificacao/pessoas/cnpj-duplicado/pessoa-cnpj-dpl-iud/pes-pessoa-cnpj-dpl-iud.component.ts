import { Component, OnDestroy, OnInit } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { LocalDataSource } from 'ng2-smart-table';
import { NbToastrService } from '@nebular/theme';

import { PesPessoaCnpjDplService, PessoaCnpjDplFilters } from '../pes-pessoa-cnpj-dpl.service';

@Component({
  selector: 'ngx-pes-pessoa-cnpj-dpl-iud',
  templateUrl: './pes-pessoa-cnpj-dpl-iud.component.html',
  styleUrls: ['./pes-pessoa-cnpj-dpl-iud.component.scss'],
})
export class PesPessoaCnpjDplIudComponent implements OnInit, OnDestroy {

  source: LocalDataSource = new LocalDataSource();
  processandoLote = false;
  isLoading = false;
  progressoLote = 0;

  filtro: PessoaCnpjDplFilters = new PessoaCnpjDplFilters();
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
        width: '650px',
        filterFunction: (_cell?: any, _search?: string) => true,
      },

      cgcCpf: {
        title: 'CNPJ',
        type: 'string',
        width: '220px',
        filter: true,
        filterFunction: (_cell?: any, _search?: string) => true,
      },
    },
  };

  constructor(
    private service: PesPessoaCnpjDplService,
    private toastrService: NbToastrService,
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
    this.filtro = new PessoaCnpjDplFilters();
    this.filtro.pagina = 0;
    this.filtro.itensPorPagina = 1000;

    this.execSearch(this.buildBaseParams());
  }

  onEditarLinha(event: any): void {
    const pessoaId = event?.data?.pessoa;

    console.log('BATEU AQUI ', pessoaId)

    if (!pessoaId) {
      this.toastrService.danger('Código da pessoa não encontrado.', 'Erro');
      return;
    }

    this.service.processarPessoaCnpjDpl(pessoaId)
      .then(() => {
        this.toastrService.success('Processado com sucesso', 'Sucesso');
        this.listar();
      })
      .catch((e) => {
        console.error(e);
        this.toastrService.danger('Erro ao processar', 'Erro');
      });
  }

  async onCreateConfirm(_event: any): Promise<void> {
    if (this.processandoLote) {
      return;
    }

    this.mensagemErro = '';
    this.progressoLote = 0;

    const gruposUnicos = this.getGruposUnicosParaLote();

    if (!gruposUnicos.length) {
      this.toastrService.warning('Nenhum registro disponível para processar.', 'Aviso');
      return;
    }

    this.processandoLote = true;

    let processados = 0;

    try {
      for (const item of gruposUnicos) {
        await this.service.processarPessoaCnpjDpl(item.pessoa);

        processados++;
        this.progressoLote = Math.round((processados / gruposUnicos.length) * 100);
      }

      this.toastrService.success(`${processados} grupo(s) processado(s) com sucesso.`, 'Sucesso');
      this.listar();
    } catch (e: any) {
      console.error(e);
      this.mensagemErro = 'Erro ao processar o lote.';
      this.toastrService.danger(this.mensagemErro, 'Erro');
    } finally {
      this.processandoLote = false;
    }
  }

  private buildBaseParams(): HttpParams {
    return new HttpParams()
      .set('fisicaJuridica', 'J')
      .set('somenteCpfUnico', 'false')
      .set('somenteNaoMigradas', 'true')
      .set('sort', 'pessoa');
  }

  onTableFilter(change: any): void {
    let params = this.buildBaseParams();

    const filtersArray = change?.filters ?? [];

    const pessoaFilter = filtersArray.find((f: any) => f.field === 'pessoa');
    const nomeFilter = filtersArray.find((f: any) => f.field === 'nome');
    const cnpjFilter = filtersArray.find((f: any) => f.field === 'cgcCpf');

    const pessoa = String(pessoaFilter?.search ?? '').trim();
    const nome = String(nomeFilter?.search ?? '').trim();
    const cnpjRaw = String(cnpjFilter?.search ?? '').trim();
    const cnpjDigits = cnpjRaw.replace(/\D/g, '');

    if (cnpjDigits.length >= 6) {
      params = params.set('cnpj', cnpjDigits);
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
      const chave = this.buildCnpjDuplicadoKey(row);

      if (!chave) {
        continue;
      }

      if (!mapa.has(chave)) {
        mapa.set(chave, row);
      }
    }

    return Array.from(mapa.values());
  }

  private buildCnpjDuplicadoKey(row: any): string {
    const cnpj = String(row?.cgcCpfDigits ?? '').trim();
    const nome = this.normalizeTextKey(row?.nome);

    if (!cnpj || !nome) {
      return '';
    }

    return `${cnpj}::${nome}`;
  }

  private normalizeTextKey(value: any): string {
    return String(value ?? '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .toUpperCase();
  }

  private normalizePessoaRow(p: any): any {
    const digits = String(
      p?.cgcCpf ??
      p?.cnpj ??
      p?.dadosPessoaJuridica?.cnpj ??
      ''
    ).replace(/\D/g, '');

    let cgcCpf = '';

    if (digits.length === 14) {
      cgcCpf = this.formatCnpj(digits);
    } else {
      cgcCpf = String(p?.cgcCpf ?? p?.cnpj ?? '');
    }

    return {
      ...p,
      cgcCpfDigits: digits,
      cgcCpf,
    };
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
