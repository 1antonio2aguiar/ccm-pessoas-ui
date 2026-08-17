import {  AfterViewInit,  Component,  ElementRef,  OnDestroy,  OnInit,} from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { LocalDataSource } from 'ng2-smart-table';
import { Subject } from 'rxjs';
import {  debounceTime,  filter,  takeUntil,} from 'rxjs/operators';
import {  EstabelecimentoFilters,  EstabelecimentoService,} from '../estabelecimento.service';
import {  NbDialogService,  NbToastrService,} from '@nebular/theme';
import {  ActivatedRoute,  Router,} from '@angular/router';

import {
  ConfirmationDialogComponent,
} from '../../components/base-resource-confirmation-delete/confirmation-dialog/confirmation-dialog.component';


@Component({
  selector: 'ngx-estabelecimento-pesquisa-geral',
  templateUrl: './estabelecimento-pesquisa.component.html',
  styleUrls: ['./estabelecimento-pesquisa.component.scss'],
})

export class EstabelecimentoPesquisaComponent
  implements OnInit, AfterViewInit, OnDestroy {

  source: LocalDataSource = new LocalDataSource();

  filtro: EstabelecimentoFilters =
    new EstabelecimentoFilters();

  isLoading = false;

  private filterSubject = new Subject<any>();
  private destroy$ = new Subject<void>();

  settings = {

    mode: 'external',

    actions: {
      columnTitle: 'Actions',
      add: true,
      edit: true,
      delete: true,
      position: 'left',
    },

    add: {
      addButtonContent: '<i class="nb-plus"></i>',
      createButtonContent: '<i class="nb-checkmark"></i>',
      cancelButtonContent: '<i class="nb-close"></i>',
    },

    edit: {
      editButtonContent: '<i class="nb-edit"></i>',
      saveButtonContent: '<i class="nb-checkmark"></i>',
      cancelButtonContent: '<i class="nb-close"></i>',
    },

    delete: {
      deleteButtonContent: '<i class="nb-trash"></i>',
      confirmDelete: true,
    },

    pager: {
      perPage: 8,
      display: true,
    },

    columns: {

      id: {
        title: 'ID',
        type: 'number',
        width: '80px',
        filter: true,
        filterFunction: false,
      },

      cnpj: {
        title: 'CNPJ',
        type: 'string',
        width: '170px',
        filter: true,
        filterFunction: false,
        valuePrepareFunction: (cell: any) =>
          this.formatCnpj(String(cell ?? '')),
      },

      nome: {
        title: 'Nome do Estabelecimento',
        type: 'string',
        filter: true,
        filterFunction: false,
      },


      pessoaNome: {
        title: 'Proprietário',
        type: 'string',
        filter: true,
      },

      pessoaCpf: {
        title: 'CPF',
        type: 'string',
        width: '170px',
        filter: true,
        filterFunction: false,
        valuePrepareFunction: (cell: any) =>
          this.formatCpf(String(cell ?? '')),
      },

      /*microEmpresa: {
        title: 'Microempresa',
        type: 'string',
        width: '120px',
        filter: false,
        valuePrepareFunction: (cell: any) => {
          if (cell === 'S') {
            return 'SIM';
          }

          if (cell === 'N') {
            return 'NÃO';
          }

          return cell ?? '';
        },
      },*/

      /*tipoEmpresa: {
        title: 'Tipo Empresa',
        type: 'number',
        width: '120px',
        filter: false,
      },*/
    },
  };

  constructor(
    private estabelecimentoService: EstabelecimentoService,
    private elementRef: ElementRef,
    private dialogService: NbDialogService,
    private toastrService: NbToastrService,
    private router: Router,
    private route: ActivatedRoute,
  ) {
  }

  ngOnInit(): void {
    this.listarEstabelecimentos();

    this.source.onChanged()
      .pipe(takeUntil(this.destroy$))
      .subscribe(change => {

        if (change.action === 'filter') {
          this.filterSubject.next(change.filter);
        }
      });

    this.filterSubject
      .pipe(
        debounceTime(400),
        filter(filters => this.devePesquisar(filters)),
        takeUntil(this.destroy$),
      )
      .subscribe(filters => {
        this.aplicarFiltros(filters);
      });
  }

  ngAfterViewInit(): void {
    setTimeout(
      () => this.aplicarMascarasNosFiltros(),
      0,
    );
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  listarEstabelecimentos(): void {

    this.filtro = new EstabelecimentoFilters();
    this.filtro.pagina = 0;
    this.filtro.itensPorPagina = 1000;

    const params = new HttpParams()
      .set('page', '0')
      .set('size', '1000')
      .set('sort', 'nome,asc');

    this.executarPesquisa(params);
  }

  private devePesquisar(filters: any): boolean {

    const filtersArray = filters?.filters ?? [];

    const cnpjFilter = filtersArray.find(
      (item: any) => item.field === 'cnpj',
    );

    const cpfFilter = filtersArray.find(
      (item: any) => item.field === 'pessoaCpf',
    );

    if (!this.documentoPodeSerPesquisado(cnpjFilter)) {
      return false;
    }

    return this.documentoPodeSerPesquisado(cpfFilter);
  }

  private documentoPodeSerPesquisado(
    documentoFilter: any,
  ): boolean {

    if (!documentoFilter) {
      return true;
    }

    const valor = String(
      documentoFilter.search ?? '',
    ).replace(/\D/g, '');

    return valor.length === 0 || valor.length >= 4;
  }

  private aplicarFiltros(filters: any): void {

    let params = new HttpParams();

    const filtersArray = filters?.filters ?? [];

    const idFilter = filtersArray.find(
      (item: any) => item.field === 'id',
    );

    const cnpjFilter = filtersArray.find(
      (item: any) => item.field === 'cnpj',
    );

    const nomeFilter = filtersArray.find(
      (item: any) => item.field === 'nome',
    );

    const nomeProprietarioFilter = filtersArray.find(
      (item: any) => item.field === 'pessoaNome',
    );

    const cpfFilter = filtersArray.find(
      (item: any) => item.field === 'pessoaCpf',
    );

    const id = String(
      idFilter?.search ?? '',
    ).trim();

    const nome = String(
      nomeFilter?.search ?? '',
    ).trim();

    const nomeProprietario = String(
      nomeProprietarioFilter?.search ?? '',
    ).trim();

    const cnpj = String(
      cnpjFilter?.search ?? '',
    ).replace(/\D/g, '');

    const cpf = String(
      cpfFilter?.search ?? '',
    ).replace(/\D/g, '');

    /*
     * Filtros exclusivos por prioridade:
     * 1 - CNPJ
     * 2 - CPF do proprietário
     * 3 - ID do estabelecimento
     * 4 - Nome do estabelecimento
     */

    if (cnpj.length > 0) {
      params = params.set('cnpj', cnpj);
      this.executarPesquisa(params);
      return;
    }

    if (cpf.length > 0) {
      params = params.set('cpf', cpf);
      this.executarPesquisa(params);
      return;
    }

    if (nomeProprietario.length > 0) {
      params = params.set(
        'nomeProprietario',
        nomeProprietario,
      );

      this.executarPesquisa(params);
      return;
    }

    if (id.length > 0) {
      params = params.set('id', id);
      this.executarPesquisa(params);
      return;
    }

    if (nome.length > 0) {
      params = params.set('nome', nome);
      this.executarPesquisa(params);
      return;
    }

    this.executarPesquisa(params);
  }

  private executarPesquisa(params: HttpParams): void {

    params = params
      .set('page', '0')
      .set('size', '1000')
      .set('sort', 'nome,asc');

    this.filtro.params = params;
    this.isLoading = true;

    this.estabelecimentoService
      .pesquisar(this.filtro)
      .then(({ estabelecimentos, total }) => {

        this.filtro.totalRegistros = total ?? 0;

        const lista = (estabelecimentos ?? []).map(
          (item: any) => ({
            ...item,
            cnpj: this.formatCnpj(item.cnpj),
            pessoaCpf: this.formatCpf(item.pessoaCpf),
          }),
        );

        this.source.load(lista);
      })
      .catch(error => {

        console.error(
          'Erro ao listar estabelecimentos:',
          error,
        );

        this.source.load([]);
      })
      .finally(() => {
        this.isLoading = false;
      });
  }

  private aplicarMascarasNosFiltros(): void {

    const host: HTMLElement =
      this.elementRef.nativeElement;

    const inputs = Array.from(
      host.querySelectorAll(
        'ng2-smart-table thead input',
      ),
    ) as HTMLInputElement[];

    const cnpjInput = inputs.find(input =>
      (input.getAttribute('placeholder') || '')
        .toLowerCase()
        .includes('cnpj'),
    );

    const cpfInput = inputs.find(input =>
      (input.getAttribute('placeholder') || '')
        .toLowerCase()
        .includes('cpf'),
    );

    if (cnpjInput) {
      this.adicionarMascaraCnpj(cnpjInput);
    }

    if (cpfInput) {
      this.adicionarMascaraCpf(cpfInput);
    }
  }

  private adicionarMascaraCnpj(
    input: HTMLInputElement,
  ): void {

    input.addEventListener('input', () => {

      const digits = String(input.value ?? '')
        .replace(/\D/g, '')
        .substring(0, 14);

      input.value = this.formatCnpj(digits);
    });
  }

  private adicionarMascaraCpf(
    input: HTMLInputElement,
  ): void {

    input.addEventListener('input', () => {

      const digits = String(input.value ?? '')
        .replace(/\D/g, '')
        .substring(0, 11);

      input.value = this.formatCpf(digits);
    });
  }

  private formatCpf(value: string): string {

    const digits = String(value ?? '')
      .replace(/\D/g, '')
      .substring(0, 11);

    const parte1 = digits.substring(0, 3);
    const parte2 = digits.substring(3, 6);
    const parte3 = digits.substring(6, 9);
    const parte4 = digits.substring(9, 11);

    let resultado = parte1;

    if (parte2) {
      resultado += '.' + parte2;
    }

    if (parte3) {
      resultado += '.' + parte3;
    }

    if (parte4) {
      resultado += '-' + parte4;
    }

    return resultado;
  }

  private formatCnpj(value: string): string {

    const digits = String(value ?? '')
      .replace(/\D/g, '')
      .substring(0, 14);

    const parte1 = digits.substring(0, 2);
    const parte2 = digits.substring(2, 5);
    const parte3 = digits.substring(5, 8);
    const parte4 = digits.substring(8, 12);
    const parte5 = digits.substring(12, 14);

    let resultado = parte1;

    if (parte2) {
      resultado += '.' + parte2;
    }

    if (parte3) {
      resultado += '.' + parte3;
    }

    if (parte4) {
      resultado += '/' + parte4;
    }

    if (parte5) {
      resultado += '-' + parte5;
    }

    return resultado;
  }

  onAdd(): void {

    this.router.navigate(
      ['cadastrar'],
      {
        relativeTo: this.route.parent,
      },
    );
  }

  onEdit(
    event: any,
  ): void {

    const estabelecimento =
      event?.data;

    const estabelecimentoId =
      Number(estabelecimento?.id);

    if (!Number.isFinite(estabelecimentoId)) {

      this.toastrService.show(
        'Não foi possível identificar o estabelecimento selecionado.',
        'Edição',
        {
          status: 'warning',
          icon: 'alert-circle-outline',
        },
      );

      return;
    }

    this.router.navigate(
      [
        'editar',
        estabelecimentoId,
      ],
      {
        relativeTo: this.route.parent,

        /*
        * O nome agiliza a identificação visual durante a navegação.
        * Mesmo assim, o IUD buscará os dados novamente pelo ID,
        * inclusive após atualizar o navegador.
        */
        state: {
          estabelecimentoNome:
            estabelecimento.nome,
        },
      },
    );
  }

  onDelete(event: any): void {

    const estabelecimento = event.data;

    this.dialogService.open(
      ConfirmationDialogComponent,
      {
        context: {
          title: 'Confirmar Exclusão',
          message: `
            Você tem certeza que deseja excluir o estabelecimento
            <strong>"${estabelecimento.nome}"</strong>?
            <br><br>
            Esta ação também excluirá os endereços, contatos e
            documentos vinculados exclusivamente a este estabelecimento.
          `,
          confirmButtonText: 'Sim, Excluir',
          cancelButtonText: 'Cancelar',
          status: 'danger',
          icon: 'trash-2-outline',
        },
        closeOnBackdropClick: false,
      },
    ).onClose.subscribe((confirmado: boolean) => {

      if (!confirmado) {
        event.confirm?.reject();
        return;
      }

      this.isLoading = true;

      this.estabelecimentoService
        .deleteEstabelecimento(estabelecimento.id)
        .subscribe({
          next: () => {

            event.confirm?.resolve();

            this.toastrService.show(
              `Estabelecimento "${estabelecimento.nome}" excluído com sucesso.`,
              'Exclusão realizada',
              {
                status: 'success',
                icon: 'trash-2-outline',
              },
            );

            this.listarEstabelecimentos();
          },

          error: (error) => {

            console.error(
              'Erro ao excluir estabelecimento:',
              error,
            );

            event.confirm?.reject();

            const mensagem =
              error?.error?.message ||
              error?.error?.detail ||
              error?.message ||
              'Não foi possível excluir o estabelecimento.';

            this.toastrService.show(
              mensagem,
              'Erro na exclusão',
              {
                status: 'danger',
                icon: 'alert-circle-outline',
              },
            );

            this.isLoading = false;
          },
        });
    });
  }
}