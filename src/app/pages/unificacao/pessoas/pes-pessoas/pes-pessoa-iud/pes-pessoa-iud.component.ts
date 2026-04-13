import { Component, OnDestroy, OnInit } from '@angular/core';
import { LocalDataSource } from 'ng2-smart-table';
import { NbToastrService } from '@nebular/theme';
import { HttpParams } from '@angular/common/http';

import { PesPessoaService, PessoaFilters } from '../pes-pessoa.service';

@Component({
  selector: 'ngx-pes-pessoa-iud',
  templateUrl: './pes-pessoa-iud.component.html',
  styleUrls: ['./pes-pessoa-iud.component.scss'],
})
export class PesPessoaIudComponent implements OnInit, OnDestroy {

  source: LocalDataSource = new LocalDataSource();
  isLoading = false;
  processandoLote = false;

  filtro: PessoaFilters = new PessoaFilters();

  idControleCarga: number | null = null;
  statusCarga = '';
  totalProcessado = 0;
  totalErros = 0;
  mensagemErro = '';

  private statusInterval: any;

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

    /*edit: {
      editButtonContent: '<i class="nb-checkmark"></i>',
      saveButtonContent: '',
      cancelButtonContent: '',
      confirmSave: true,
    },*/

    columns: {
      pessoa: {
        title: 'Pessoa',
        type: 'number',
        addable: false,
        filter: true,
        width: '90px',
      },

      nome: {
        title: 'Nome',
        type: 'string',
        filter: true,
        width: '600px',
      },

      cgcCpf: {
        title: 'CPF',
        type: 'string',
        width: '200px',
        filter: true,
      },

      dataNascimento: {
        title: 'Dt Nascimento',
        type: 'string',
        width: '140px',
        filter: true,
        valuePrepareFunction: (_: any, row: any) => row?.dataNascimento ?? '',
      },
    },
  };

  constructor(
    private service: PesPessoaService,
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
    this.pararPollingStatus();
  }

  listar(): void {
    this.filtro = new PessoaFilters();
    this.filtro.pagina = 0;
    this.filtro.itensPorPagina = 1000;

    this.execSearch(this.buildBaseParams());
  }

  onCreateConfirm(event: any): void {
    this.iniciarCargaLote();
  }

  onEditarLinha(event: any): void {
    const pessoaId = event?.data?.pessoa;

    if (!pessoaId) {
      this.toastrService.danger('Código da pessoa não encontrado.', 'Erro');
      return;
    }

    console.log('AQUI VEIO!!!!');
    this.processarPessoaLinha(pessoaId);
  }

  onDeleteConfirm(event: any): void {
    event.confirm.reject();
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

  private execSearch(params: HttpParams): void {
    this.filtro.params = params;

    this.isLoading = true;
    this.service.pesquisar({ ...this.filtro, params } as any)
      .then(({ pesPessoas, total }) => {
        this.filtro.totalRegistros = total ?? 0;

        const lista = (pesPessoas ?? []).map((p: any) => this.normalizePessoaRow(p));
        this.source.load(lista);
      })
      .catch((e) => {
        console.error(e);
        this.source.load([]);
        this.toastrService.danger('Erro ao carregar a lista.', 'Erro');
      })
      .finally(() => this.isLoading = false);
  }

  private iniciarCargaLote(): void {
    if (this.processandoLote) {
      this.toastrService.warning('Já existe uma carga em andamento.', 'Aviso');
      return;
    }

    this.processandoLote = true;
    this.statusCarga = 'INICIANDO';
    this.totalProcessado = 0;
    this.totalErros = 0;
    this.mensagemErro = '';

    this.service.iniciarCargaLote()
      .then((idControle) => {
        this.idControleCarga = idControle;
        this.toastrService.success(`Carga iniciada. Controle ${idControle}.`, 'Sucesso');
        this.iniciarPollingStatus();
      })
      .catch((e) => {
        console.error(e);
        this.processandoLote = false;
        this.toastrService.danger('Erro ao iniciar a carga.', 'Erro');
      });
  }

  private processarPessoaLinha(pessoaId: number): void {
    this.isLoading = true;

    this.service.processarPessoaUnica(pessoaId)
      .then((msg) => {
        this.toastrService.success(msg || `Pessoa ${pessoaId} processada com sucesso.`, 'Sucesso');
        this.listar();
      })
      .catch((e) => {
        console.error(e);
        this.toastrService.danger(`Erro ao processar a pessoa ${pessoaId}.`, 'Erro');
      })
      .finally(() => this.isLoading = false);
  }

  private iniciarPollingStatus(): void {
    this.pararPollingStatus();

    this.statusInterval = setInterval(() => {
      if (!this.idControleCarga) {
        return;
      }

      this.service.buscarStatusCarga(this.idControleCarga)
        .then((status) => {
          this.statusCarga = status.status ?? '';
          this.totalProcessado = status.totalProcessado ?? 0;
          this.totalErros = status.totalErros ?? 0;
          this.mensagemErro = status.mensagemErro ?? '';

          if (status.status === 'FINALIZADO') {
            this.pararPollingStatus();
            this.processandoLote = false;
            this.toastrService.success('Carga finalizada com sucesso.', 'Sucesso');
            this.listar();
          }

          if (status.status === 'ERRO') {
            this.pararPollingStatus();
            this.processandoLote = false;
            this.toastrService.danger(this.mensagemErro || 'Carga finalizada com erro.', 'Erro');
            this.listar();
          }
        })
        .catch((e) => {
          console.error(e);
          this.pararPollingStatus();
          this.processandoLote = false;
          this.toastrService.danger('Erro ao consultar status da carga.', 'Erro');
        });
    }, 2000);
  }

  private pararPollingStatus(): void {
    if (this.statusInterval) {
      clearInterval(this.statusInterval);
      this.statusInterval = null;
    }
  }

  private normalizePessoaRow(p: any): any {
    const digits =
      String(
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
      cgcCpf = String(p?.cgcCpf ?? '');
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