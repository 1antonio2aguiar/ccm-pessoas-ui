import { Component, OnInit } from '@angular/core';
import { LocalDataSource } from 'ng2-smart-table';
import { NbToastrService } from '@nebular/theme';
import { HttpParams } from '@angular/common/http';

import { SanePessoaFilters, SanePessoaService } from '../sane-pessoa.service';

@Component({
  selector: 'ngx-sane-cnpj-unico',
  templateUrl: './sane-cnpj-unico.component.html',
  styleUrls: ['./sane-cnpj-unico.component.scss'],
})
export class SaneCnpjUnicoComponent implements OnInit {

  source: LocalDataSource = new LocalDataSource();
  isLoading = false;

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
        title: 'CNPJ',
        type: 'string',
        width: '200px',
        filter: true,
        valuePrepareFunction: (value: any) => {
          if (!value) {
            return '';
          }

          const cnpj = value.toString().replace(/\D/g, '').padStart(14, '0');

          return cnpj.replace(
            /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
            '$1.$2.$3/$4-$5'
          );
        },
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
    const cnpjFilter = filtersArray.find((f: any) => f.field === 'cgcCpf');

    const pessoa = String(pessoaFilter?.search ?? '').trim();
    const nome = String(nomeFilter?.search ?? '').trim();

    const cnpjRaw = String(cnpjFilter?.search ?? '').trim();
    const cnpjDigits = cnpjRaw.replace(/\D/g, '');

    if (pessoa.length > 0) {
      params = params.set('pessoa', pessoa);
    }

    if (nome.length > 0) {
      params = params.set('nome', nome);
    }

    if (cnpjDigits.length >= 6) {
      params = params.set('cnpj', cnpjDigits);
    }

    this.execSearch(params);
  }

  private execSearch(params: HttpParams): void {
    this.filtro.params = params;
    this.isLoading = true;

    this.service.pesquisarCnpjUnico({ ...this.filtro, params } as any)
      .then(({ sanePessoas, total }) => {
        this.filtro.totalRegistros = total ?? 0;

        const lista = (sanePessoas ?? []).map((p: any) => this.normalizePessoaRow(p));

        this.source.load(lista);
      })
      .catch((e) => {
        console.error(e);
        this.source.load([]);
        this.toastrService.danger('Erro ao carregar a lista de CNPJ único do saneamento.', 'Erro');
      })
      .finally(() => {
        this.isLoading = false;
      });
  }

  private normalizePessoaRow(p: any): any {
    const digits = String(p?.cgcCpf ?? '').replace(/\D/g, '');

    let cgcCpf = '';

    if (digits.length === 14) {
      cgcCpf = this.formatCnpj(digits);
    } else {
      cgcCpf = String(p?.cgcCpf ?? '');
    }

    return {
      ...p,
      cgcCpfDigits: digits,
      cgcCpf,
    };
  }

  private formatCnpj(d: string): string {
    return d.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
  }

  onCreateConfirm(_event: any): void {
    this.toastrService.info(
      'Processamento em lote do CNPJ saneamento será implementado na próxima etapa.',
      'Aviso'
    );
  }

  onEditarLinha(event: any): void {
    const pessoa = event?.data;
    const status = pessoa?.statusCadastro;

    if (!pessoa?.pessoa) {
      this.toastrService.danger('Código da pessoa não encontrado.', 'Erro');
      return;
    }

    if (status === 'EXISTE NO CAD. ÚNICO') {
      this.processarCnpjJaExisteCadUnicoLinha(pessoa.pessoa);
      return;
    }

    this.processarPessoaLinha(pessoa);
  }

  private processarPessoaLinha(pessoa: any): void {
    const pessoaId = pessoa?.pessoa;
    const cnpj = pessoa?.cgcCpfDigits || String(pessoa?.cgcCpf ?? '').replace(/\D/g, '');

    if (!cnpj) {
      this.toastrService.danger('CNPJ não encontrado para validação.', 'Erro');
      return;
    }

    this.isLoading = true;

    this.service.existeCpfCnpjNoCadUnico(cnpj, 'J')
      .then((existe) => {
        if (existe) {
          this.toastrService.warning(
            'CNPJ já existe no Cadastro Único. Use a rotina de EXISTE NO CAD. ÚNICO.',
            'Atenção'
          );
          return;
        }

        return this.service.processarCnpjUnico(pessoaId)
          .then((msg) => {
            this.toastrService.success(
              msg || `Pessoa ${pessoaId} processada com sucesso.`,
              'Sucesso'
            );

            this.listar();
          });
      })
      .catch((e) => {
        console.error(e);

        const msgErro =
          e?.error ||
          e?.message ||
          `Erro ao processar a pessoa ${pessoaId}.`;

        this.toastrService.danger(msgErro, 'Erro');
      })
      .finally(() => {
        this.isLoading = false;
      });
  }

  private processarCnpjJaExisteCadUnicoLinha(pessoaId: number): void {
    this.isLoading = true;

    this.service.processarCnpjJaExisteCadUnico(pessoaId)
      .then((msg) => {
        this.toastrService.success(
          msg || `Pessoa ${pessoaId} vinculada ao Cadastro Único com sucesso.`,
          'Sucesso'
        );

        this.listar();
      })
      .catch((e) => {
        console.error(e);

        const msgErro =
          e?.error ||
          e?.message ||
          `Erro ao vincular a pessoa ${pessoaId} ao Cadastro Único.`;

        this.toastrService.danger(msgErro, 'Erro');
      })
      .finally(() => {
        this.isLoading = false;
      });
  }
}