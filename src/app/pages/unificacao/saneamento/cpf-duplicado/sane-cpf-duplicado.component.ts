import { Component, OnInit } from '@angular/core';
import { LocalDataSource } from 'ng2-smart-table';
import { NbToastrService } from '@nebular/theme';
import { HttpParams } from '@angular/common/http';

import { SanePessoaFilters, SanePessoaService } from '../sane-pessoa.service';

@Component({
  selector: 'ngx-sane-cpf-duplicado',
  templateUrl: './sane-cpf-duplicado.component.html',
  styleUrls: ['./sane-cpf-duplicado.component.scss'],
})

export class SaneCpfDuplicadoComponent implements OnInit {

  source: LocalDataSource = new LocalDataSource();
  isLoading = false;

  processandoLote = false;
  mensagemErro = '';

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

      if (status === 'DUPLICADO') {
        return 'linha-vermelha';
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
        width: '130px',
        filter: true,
        valuePrepareFunction: (_: any, row: any) =>
          row?.dataNascimento ?? '',
        filterFunction: (_cell?: any, _search?: string) => true,
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
    const cpfFilter = filtersArray.find((f: any) => f.field === 'cgcCpf');
    const nascimentoFilter = filtersArray.find((f: any) => f.field === 'dataNascimento');

    const pessoa = String(pessoaFilter?.search ?? '').trim();
    const nome = String(nomeFilter?.search ?? '').trim();

    const cpfRaw = String(cpfFilter?.search ?? '').trim();
    const cpfDigits = cpfRaw.replace(/\D/g, '');

    const nascRaw = String(nascimentoFilter?.search ?? '').trim();

    if (pessoa.length > 0) {
      params = params.set('pessoa', pessoa);
    }

    if (nome.length > 0) {
      params = params.set('nome', nome);
    }

    if (cpfDigits.length >= 6) {
      params = params.set('cpf', cpfDigits);
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

    this.service.pesquisarCpfDuplicado({ ...this.filtro, params } as any)
      .then(({ sanePessoas, total }) => {
        this.filtro.totalRegistros = total ?? 0;

        const lista = (sanePessoas ?? []).map((p: any) => this.normalizePessoaRow(p));

        this.source.load(lista);
      })
      .catch((e) => {
        console.error(e);
        this.source.load([]);
        this.toastrService.danger('Erro ao carregar a lista de CPF duplicado do saneamento.', 'Erro');
      })
      .finally(() => {
        this.isLoading = false;
      });
  }

  private normalizePessoaRow(p: any): any {
    const digits = String(p?.cgcCpf ?? '').replace(/\D/g, '');

    let cgcCpf = '';

    if (digits.length === 11) {
      cgcCpf = this.formatCpf(digits);
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

  onCreateConfirm(_event: any): void {
    // Processamento em lote será implementado depois.
    // this.processarLoteTela();

    this.toastrService.info(
      'Processamento em lote de CPF duplicado do saneamento será implementado na próxima etapa.',
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
      this.processarJaExisteCadUnicoLinha(pessoa.pessoa);
      return;
    }

    this.processarPessoaLinha(pessoa);
  }

  private processarJaExisteCadUnicoLinha(pessoaId: number): void {
    this.isLoading = true;

    this.service.processarJaExisteCadUnico(pessoaId)
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

  private processarPessoaLinha(pessoa: any): void {
    const pessoaId = pessoa?.pessoa;
    const cpf = pessoa?.cgcCpfDigits || String(pessoa?.cgcCpf ?? '').replace(/\D/g, '');

    if (!cpf) {
      this.toastrService.danger('CPF não encontrado para validação.', 'Erro');
      return;
    }

    this.isLoading = true;

    this.service.existeCpfCnpjNoCadUnico(cpf, 'F')
      .then((existe) => {
        if (existe) {
          this.toastrService.warning(
            'CPF já existe no Cadastro Único. Use a rotina de EXISTE NO CAD. ÚNICO.',
            'Atenção'
          );
          return;
        }

        return this.service.processarCpfDuplicado(pessoaId)
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

  private processarPessoaLinhaLote(_pessoaId: number): Promise<void> {
    // Backend ainda não implementado.
    return Promise.resolve();
  }

  private async processarLoteTela(): Promise<void> {
    // Implementar depois que o backend de carga CPF único SANE estiver pronto.
  }
}