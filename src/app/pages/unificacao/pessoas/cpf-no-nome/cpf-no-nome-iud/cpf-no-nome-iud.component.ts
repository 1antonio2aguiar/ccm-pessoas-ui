import { Component, OnDestroy, OnInit } from '@angular/core';
import { LocalDataSource } from 'ng2-smart-table';
import { NbToastrService } from '@nebular/theme';
import { HttpParams } from '@angular/common/http';

import { CpfNoNomeService, CpfNoNomeFilters } from '../cpf-no-nome.service';

@Component({
  selector: 'ngx-cpf-no-nome-iud',
  templateUrl: './cpf-no-nome-iud.component.html',
  styleUrls: ['./cpf-no-nome-iud.component.scss'],
})
export class CpfNoNomeIudComponent implements OnInit, OnDestroy {

  source: LocalDataSource = new LocalDataSource();
  isLoading = false;

  filtro: CpfNoNomeFilters = new CpfNoNomeFilters();

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
        filter: false,
        width: '90px',
      },

      nome: {
        title: 'Nome',
        type: 'string',
        filter: true,
        width: '500px',
        filterFunction: (_cell?: any, _search?: string) => true,
      },

      cpfNoNome: {
        title: 'CPF',
        type: 'string',
        filter: false,
        width: '150px',
        valuePrepareFunction: (value: any) => this.formatCpf(value),
      },

      cgcCpf: {
        title: 'CNPJ',
        type: 'string',
        filter: false,
        width: '180px',
        valuePrepareFunction: (value: any) => this.formatCnpj(value),
      },

      nomeSemCpf: {
        title: 'Nome sem CPF',
        type: 'string',
        filter: false,
        width: '500px',
      },

      /*posicaoCpf: {
        title: 'Posição',
        type: 'string',
        filter: false,
        width: '120px',
      },*/
    },
  };

  constructor(
    private service: CpfNoNomeService,
    private toastrService: NbToastrService,
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
    this.filtro = new CpfNoNomeFilters();
    this.filtro.pagina = 0;
    this.filtro.itensPorPagina = 1000;

    this.execSearch(this.buildBaseParams());
  }

  private buildBaseParams(): HttpParams {
    return new HttpParams()
      .set('sort', 'nome');
  }

  onTableFilter(change: any): void {
    let params = this.buildBaseParams();

    const filtersArray = change?.filters ?? [];
    const nomeFilter = filtersArray.find((f: any) => f.field === 'nome');

    const nome = String(nomeFilter?.search ?? '').trim();

    if (nome.length > 0) {
      params = params.set('nome', nome);
    }

    this.execSearch(params);
  }

  private execSearch(params: HttpParams): void {
    this.filtro.params = params;

    this.isLoading = true;

    this.service.pesquisar({ ...this.filtro, params } as any)
      .then(({ registros, total }) => {
        this.filtro.totalRegistros = total ?? 0;
        this.source.load(registros ?? []);
      })
      .catch((e) => {
        console.error(e);
        this.source.load([]);
        this.toastrService.danger('Erro ao carregar a lista.', 'Erro');
      })
      .finally(() => {
        this.isLoading = false;
      });
  }

  private formatCpf(value: any): string {
    if (!value) {
      return '';
    }

    const cpf = String(value).replace(/\D/g, '').padStart(11, '0');

    if (cpf.length !== 11) {
      return String(value);
    }

    return cpf.replace(
      /(\d{3})(\d{3})(\d{3})(\d{2})/,
      '$1.$2.$3-$4',
    );
  }

  private formatCnpj(value: any): string {
    if (!value) {
      return '';
    }

    const cnpj = String(value).replace(/\D/g, '').padStart(14, '0');

    if (cnpj.length !== 14) {
      return String(value);
    }

    return cnpj.replace(
      /(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/,
      '$1.$2.$3/$4-$5',
    );
  }
}