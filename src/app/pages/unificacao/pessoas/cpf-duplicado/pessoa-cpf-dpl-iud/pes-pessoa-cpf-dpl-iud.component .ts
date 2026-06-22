import { Component, OnDestroy, OnInit } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { LocalDataSource } from 'ng2-smart-table';
import { NbToastrService } from '@nebular/theme';

import { PesPessoaCpfDplService, PessoaFilters } from '../pes-pessoa-cpf-dpl.service';

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

  onEditarLinha(event: any): void {
    const pessoaId = event?.data?.pessoa;

    if (!pessoaId) {
      this.toastrService.danger('Código da pessoa não encontrado.', 'Erro');
      return;
    }

    this.service.processarPessoaCpfDpl(pessoaId)
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
      await this.service.processarPessoaCpfDpl(item.pessoa);

      processados++;
      this.progressoLote = Math.round((processados / gruposUnicos.length) * 100);
    }

    this.toastrService.success(
      `${processados} grupo(s) processado(s) com sucesso.`,
      'Sucesso',
    );

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
    const cpfCnpjFilter = filtersArray.find((f: any) => f.field === 'cgcCpf');
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

  /*private execSearch(params: HttpParams): void {
    this.filtro.pagina = 0;
    this.filtro.itensPorPagina = 1000;
    this.filtro.params = params;

    this.isLoading = true;

    this.service.pesquisar({ ...this.filtro, params } as any)
      .then(({ pesPessoas, total }) => {
        this.filtro.totalRegistros = total ?? 0;

        const lista = (pesPessoas ?? []).map((p: any) => this.normalizePessoaRow(p));
        //console.log('LISTA ' , lista)
        this.source.load(lista);
      })
      .catch((e) => {
        console.error(e);
        this.source.load([]);
        this.toastrService.danger('Erro ao carregar a lista.', 'Erro');
      })
      .finally(() => {
        this.isLoading = false;
      });
  }*/

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

  private buildCpfDuplicadoKey(row: any): string {
    const cpf = String(row?.cgcCpfDigits ?? '').trim();
    const nome = this.normalizeTextKey(row?.nome);

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

  private normalizePessoaRow(p: any): any {
    const digits = String(
      p?.cgcCpf ??
      p?.cpf ??
      p?.cnpj ??
      p?.dadosPessoaFisica?.cpf ??
      p?.dadosPessoaJuridica?.cnpj ??
      ''
    ).replace(/\D/g, '');

    let cgcCpf = '';

    if (digits.length === 11) {
      cgcCpf = this.formatCpf(digits);
    } else if (digits.length === 14) {
      cgcCpf = this.formatCnpj(digits);
    } else {
      cgcCpf = String(
        p?.cgcCpf ??
        p?.cpf ??
        p?.cnpj ??
        ''
      );
    }

    const dnRaw =
      p?.dataNascimento ??
      p?.dadosPessoaFisica?.dataNascimento ??
      '';

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