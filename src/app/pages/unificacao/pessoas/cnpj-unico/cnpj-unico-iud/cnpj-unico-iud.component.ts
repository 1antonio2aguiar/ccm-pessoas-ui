import { Component, OnDestroy, OnInit } from '@angular/core';
import { LocalDataSource } from 'ng2-smart-table';
import { NbToastrService } from '@nebular/theme';
import { HttpParams } from '@angular/common/http';

import { CnpjUnicoService, PessoaFilters } from '../cnpj-unico.service';

@Component({
  selector: 'ngx-cnpj-unico-iud',
  templateUrl: './cnpj-unico-iud.component.html',
  styleUrls: ['./cnpj-unico-iud.component.scss'],
})
export class CnpjUnicoIudComponent implements OnInit, OnDestroy {

  source: LocalDataSource = new LocalDataSource();
  isLoading = false;
  processandoLote = false;
  progressoLote = 0;

  filtro: PessoaFilters = new PessoaFilters();

  statusCarga = '';
  totalProcessado = 0;
  totalErros = 0;
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
        width: '700px',
        filterFunction: (_cell?: any, _search?: string) => true,
      },

      cgcCpf: {
        title: 'CNPJ',
        type: 'string',
        width: '200px',
        filter: true,
        filterFunction: (_cell?: any, _search?: string) => true,
      },
    },
  };

  constructor(
    private service: CnpjUnicoService,
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
    this.filtro = new PessoaFilters();
    this.filtro.pagina = 0;
    this.filtro.itensPorPagina = 1000;

    this.execSearch(this.buildBaseParams());
  }

  onCreateConfirm(_event: any): void {
    this.processarLoteTela();
  }

  onEditarLinha(event: any): void {
    const pessoa = event?.data;

    if (!pessoa?.pessoa) {
      this.toastrService.danger('Código da pessoa não encontrado.', 'Erro');
      return;
    }

    this.processarPessoaLinha(pessoa);
  }

  private buildBaseParams(): HttpParams {
    return new HttpParams()
      .set('fisicaJuridica', 'J')
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

    const pessoa = String(pessoaFilter?.search ?? '').trim();
    const nome = String(nomeFilter?.search ?? '').trim();
    const cpfCnpjRaw = String(cpfCnpjFilter?.search ?? '').trim();
    const cpfCnpjDigits = cpfCnpjRaw.replace(/\D/g, '');

    if (cpfCnpjDigits.length >= 6) {
      params = params.set('cnpj', cpfCnpjDigits);
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
      .finally(() => {
        this.isLoading = false;
      });
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

        return this.service.processarPessoaUnica(pessoaId)
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
        this.toastrService.danger(`Erro ao processar a pessoa ${pessoaId}.`, 'Erro');
      })
      .finally(() => {
        this.isLoading = false;
    });
  }

  private processarPessoaLinhaLote(pessoaId: number): Promise<void> {
    return this.service.processarPessoaUnica(pessoaId)
      .then(() => undefined);
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
    this.mensagemErro = '';
    this.progressoLote = 0;

    try {
      const listaTela = await this.source.getAll();

      if (!listaTela || listaTela.length === 0) {
        this.toastrService.warning('Não há registros na tela para processar.', 'Aviso');
        this.statusCarga = 'SEM_REGISTROS';
        return;
      }

      const totalItens = listaTela.length;
      let concluidos = 0;

      for (const item of listaTela) {
        const pessoaId = item?.pessoa;

        if (!pessoaId) {
          this.totalErros++;
          concluidos++;
          this.progressoLote = Math.round((concluidos / totalItens) * 100);
          continue;
        }

        try {
          await this.processarPessoaLinhaLote(pessoaId);
          this.totalProcessado++;
        } catch (e) {
          console.error(`Erro ao processar a pessoa ${pessoaId}`, e);
          this.totalErros++;
          this.mensagemErro = `Erro ao processar a pessoa ${pessoaId}.`;
        } finally {
          concluidos++;
          this.progressoLote = Math.round((concluidos / totalItens) * 100);
        }
      }

      this.statusCarga = 'FINALIZADO';

      this.toastrService.success(
        `Lote finalizado. Processados: ${this.totalProcessado}. Erros: ${this.totalErros}.`,
        'Sucesso'
      );

      this.listar();

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

    if (digits.length === 14) {
      cgcCpf = this.formatCnpj(digits);
    } else if (digits.length === 11) {
      cgcCpf = this.formatCpf(digits);
    } else {
      cgcCpf = String(p?.cgcCpf ?? p?.cnpj ?? '');
    }

    return {
      ...p,
      cgcCpfDigits: digits,
      cgcCpf,
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
