import { Component, OnDestroy, OnInit } from '@angular/core';
import { LocalDataSource } from 'ng2-smart-table';
import { NbToastrService } from '@nebular/theme';
import { HttpParams } from '@angular/common/http';

import { RhPessoaService, RhPessoaFilters } from '../rh-pessoa.service';

@Component({
  selector: 'ngx-rh-pessoa-iud',
  templateUrl: './rh-pessoa-iud.component.html',
  styleUrls: ['./rh-pessoa-iud.component.scss'],
})
export class RhPessoaIudComponent implements OnInit, OnDestroy {

  source: LocalDataSource = new LocalDataSource();
  isLoading = false;

  // Processamento será implementado na próxima etapa.
  processandoLote = false;
  progressoLote = 0;
  statusCarga = '';
  totalProcessado = 0;
  totalErros = 0;
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

      fisicaJuridica: {
        title: 'F/J',
        type: 'string',
        width: '80px',
        filter: true,
        filterFunction: (_cell?: any, _search?: string) => true,
      },

      statusCadastro: {
        title: 'Status',
        type: 'string',
        width: '200px',
        filter: {
          type: 'list',
          config: {
            selectText: 'Todos',
            list: [
              {
                value: 'JA_EXISTE_CAD_UNICO',
                title: 'Já existe no Cad. Único',
              },
              {
                value: 'UNICO_RH',
                title: 'Único no RH',
              },
              {
                value: 'DUPLICADO_RH',
                title: 'Duplicado no RH',
              },
              {
                value: 'SEM_CPF_CNPJ',
                title: 'Sem CPF/CNPJ',
              },
            ],
          },
        },
        valuePrepareFunction: (value: string) => {
          switch (value) {
            case 'JA_EXISTE_CAD_UNICO':
              return 'Já existe no Cad. Único';
            case 'UNICO_RH':
              return 'Único no RH';
            case 'DUPLICADO_RH':
              return 'Duplicado no RH';
            case 'SEM_CPF_CNPJ':
              return 'Sem CPF/CNPJ';
            default:
              return value ?? '';
          }
        },
      },

      cgcCpf: {
        title: 'CPF/CNPJ',
        type: 'string',
        width: '180px',
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
    private service: RhPessoaService,
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
    this.filtro = new RhPessoaFilters();
    this.filtro.pagina = 0;
    this.filtro.itensPorPagina = 1000;

    this.execSearch(this.buildBaseParams());
  }

  onCreateConfirm(event: any): void {
    // Processamento será implementado na próxima etapa.
    // this.processarLoteTela();
    this.toastrService.info('Processamento do RH será implementado na próxima etapa.', 'Aviso');
  }

  onEditarLinha(event: any): void {
    const pessoaId = event?.data?.pessoa;
    const status = event?.data?.statusCadastro;
    const fisicaJuridica = event?.data?.fisicaJuridica;

    if (!pessoaId) {
      this.toastrService.danger('Código da pessoa não encontrado.', 'Erro');
      return;
    }

    if (fisicaJuridica === 'F') {
      if (status === 'UNICO_RH') {
        this.processarCpfUnicoLinha(pessoaId);
        return;
      }

      if (status === 'DUPLICADO_RH') {
        this.processarCpfDuplicadoLinha(pessoaId);
        return;
      }

      if (status === 'JA_EXISTE_CAD_UNICO') {
        this.processarJaExisteCadUnicoLinha(pessoaId);
        return;
      }
    }

    if (fisicaJuridica === 'J') {
      if (status === 'UNICO_RH') {
        this.processarCnpjUnicoLinha(pessoaId);
        return;
      }

      this.toastrService.warning('Processamento de CNPJ disponível somente para Único no RH.', 'Atenção');
      return;
    }

    this.toastrService.warning('Tipo de pessoa não suportado.', 'Atenção');
  }

  private processarCnpjUnicoLinha(pessoaId: number): void {
    this.isLoading = true;

    this.service.processarCnpjUnico(pessoaId)
      .then((msg) => {
        this.toastrService.success(
          msg || `Pessoa jurídica ${pessoaId} processada com sucesso.`,
          'Sucesso'
        );

        this.execSearch(this.filtro.params || this.buildBaseParams());
      })
      .catch((e) => {
        console.error(e);

        this.toastrService.danger(
          e?.error || `Erro ao processar CNPJ único da pessoa ${pessoaId}.`,
          'Erro'
        );
      })
      .finally(() => {
        this.isLoading = false;
      });
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

  private processarCpfUnicoLinha(pessoaId: number): void {
  this.isLoading = true;

  this.service.processarCpfUnico(pessoaId)
    .then((msg) => {
      this.toastrService.success(
        msg || `Pessoa ${pessoaId} processada com sucesso.`,
        'Sucesso'
      );

      this.execSearch(this.filtro.params || this.buildBaseParams());
    })
    .catch((e) => {
      console.error(e);

      this.toastrService.danger(
        e?.error || `Erro ao processar CPF único da pessoa ${pessoaId}.`,
        'Erro'
      );
    })
    .finally(() => {
      this.isLoading = false;
    });
}

private processarCpfDuplicadoLinha(pessoaId: number): void {
  this.isLoading = true;

  this.service.processarCpfDuplicado(pessoaId)
    .then((msg) => {
      this.toastrService.success(
        msg || `Grupo duplicado da pessoa ${pessoaId} processado com sucesso.`,
        'Sucesso'
      );

      this.execSearch(this.filtro.params || this.buildBaseParams());
    })
    .catch((e) => {
      console.error(e);

      this.toastrService.danger(
        e?.error || `Erro ao processar CPF duplicado da pessoa ${pessoaId}.`,
        'Erro'
      );
    })
    .finally(() => {
      this.isLoading = false;
    });
  }

  private processarPessoaLinhaLote(pessoaId: number, statusCadastro: string): Promise<void> {
    if (statusCadastro === 'UNICO_RH') {
      return this.service.processarCpfUnico(pessoaId).then(() => undefined);
    }

    if (statusCadastro === 'DUPLICADO_RH') {
      return this.service.processarCpfDuplicado(pessoaId).then(() => undefined);
    }

    return Promise.resolve();
  }

  private async processarLoteTela(): Promise<void> {
    // implementar depois que a listagem estiver validada
  }
  

  private normalizePessoaRow(p: any): any {
    const digits =
      String(
        p?.cgcCpf ??
        p?.cpf ??
        p?.cnpj ??
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

  private processarJaExisteCadUnicoLinha(pessoaId: number): void {
    this.isLoading = true;

    this.service.processarJaExisteCadUnico(pessoaId)
      .then((msg) => {
        this.toastrService.success(
          msg || `Pessoa ${pessoaId} vinculada ao Cadastro Único com sucesso.`,
          'Sucesso'
        );

        this.execSearch(this.filtro.params || this.buildBaseParams());
      })
      .catch((e) => {
        console.error(e);

        this.toastrService.danger(
          e?.error || `Erro ao vincular a pessoa ${pessoaId} ao Cadastro Único.`,
          'Erro'
        );
      })
      .finally(() => {
        this.isLoading = false;
      });
  }
}
