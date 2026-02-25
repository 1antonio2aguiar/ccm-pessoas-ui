import { Component } from '@angular/core';
import { LocalDataSource } from 'ng2-smart-table';
import { NbDialogService, NbToastrService } from '@nebular/theme';
import { HttpParams } from '@angular/common/http';

import { DistritoService } from '../distrito.service';
import { FiltroPaginado } from '../../../shared/filters/filtro-paginado';
import { CidadeNomeEditorComponent } from '../cidade/CidadeNomeEditorComponent';
import { ConfirmationDialogComponent } from '../../components/base-resource-confirmation-delete/confirmation-dialog/confirmation-dialog.component';

@Component({
  selector: 'ngx-distrito-iud',
  templateUrl: './distrito-iud.component.html',
  styleUrls: ['./distrito-iud.component.scss'],
})
export class DistritoIudComponent {

  source: LocalDataSource = new LocalDataSource();
  filtro: FiltroPaginado = new FiltroPaginado();

  settings = {
    pager: {
      perPage: this.filtro.itensPorPagina,
      display: true,
    },

    add: {
      addButtonContent: '<i class="nb-plus"></i>',
      createButtonContent: '<i class="nb-checkmark"></i>',
      cancelButtonContent: '<i class="nb-close"></i>',
      confirmCreate: true,
      width: '40px',
      addMode: 'edit',
    },

    edit: {
      editButtonContent: '<i class="nb-edit"></i>',
      saveButtonContent: '<i class="nb-checkmark"></i>',
      cancelButtonContent: '<i class="nb-close"></i>',
      confirmSave: true,
      addMode: 'edit',
      mode: 'edit',
    },

    delete: {
      deleteButtonContent: '<i class="nb-trash"></i>',
      confirmDelete: true,
    },

    columns: {
      id: {
        title: 'ID',
        type: 'number',
        addable: false,
        filter: true,
        width: '90px',
      },

      cidadeNome: {
        title: 'Cidade',
        type: 'string',
        filter: true,
        width: '320px',
        editor: {
          type: 'custom',
          component: CidadeNomeEditorComponent,
        },
      },

      nome: {
        title: 'Nome',
        type: 'string',
        filter: true,
        width: '520px',
      },
    },
  };

  constructor(
    private service: DistritoService,
    private toastrService: NbToastrService,
    private dialogService: NbDialogService,
  ) {}

  ngOnInit(): void {
    this.listar();

    this.source.onChanged().subscribe((change) => {
      if (change.action === 'filter') {
        this.onTableFilter(change.filter);
      }
    });
  }

  listar() {
    this.service.pesquisar(this.filtro)
      .then((response) => {
        const distritos = response.distritos ?? [];
        this.source.load(distritos);
      })
      .catch((error) => {
        console.error('Erro ao listar distritos:', error);
      });
  }

  onCreateConfirm(event) {
    if (!event.newData.cidadeId) {
      this.toastrService.show(
        'Selecione uma cidade na lista para preencher corretamente.',
        'Atenção',
        { status: 'warning' },
      );
      event.confirm.reject();
      return;
    }

    this.service.create(event.newData).subscribe({
      next: () => {
        this.listar();
        event.confirm.resolve();
        this.toastrService.show(
          'Novo distrito cadastrado com sucesso!',
          'Cadastro Realizado',
          { status: 'success', icon: 'checkmark-circle-outline' },
        );
      },
      error: (error) => {
        console.error('Erro ao criar distrito:', error);
        event.confirm.reject();
      },
    });
  }

  onSaveConfirm(event) {
    // Nunca deixa alterar cidade no update
    event.newData.cidadeId = event.data.cidadeId;
    event.newData.cidadeNome = event.data.cidadeNome;

    this.service.update(event.newData).subscribe({
      next: () => {
        this.listar();
        event.confirm.resolve();
        this.toastrService.show(
          `Distrito "${event.newData.nome}" foi atualizado com sucesso!`,
          'Atualização Realizada',
          { status: 'success', icon: 'edit-outline' },
        );
      },
      error: (error) => {
        console.error('Erro ao editar distrito:', error);
        event.confirm.reject();
      },
    });
  }

  onDeleteConfirm(event): void {
    const item = event.data;

    this.dialogService.open(ConfirmationDialogComponent, {
      context: {
        title: 'Confirmar Exclusão',
        message: `Você tem certeza que deseja excluir o distrito <strong>"${item.nome}"</strong>?`,
        confirmButtonText: 'Sim, Excluir',
        cancelButtonText: 'Cancelar',
        status: 'danger',
        icon: 'trash-2-outline',
      },
      closeOnBackdropClick: false,
    }).onClose.subscribe((confirmado) => {
      if (confirmado) {
        this.service.delete(item.id)
          .subscribe({
            next: () => {
              this.listar();
              event.confirm.resolve();

              this.toastrService.show(
                `Distrito "${item.nome}" foi excluído com sucesso.`,
                'Exclusão Realizada',
                { status: 'success', icon: 'trash-2-outline' },
              );
            },
            error: (error) => {
              console.error('Erro ao deletar distrito:', error);
              event.confirm.reject();

              this.toastrService.show(
                'Não foi possível excluir o distrito. Verifique se ele não está sendo usado em outras partes do sistema.',
                'Erro na Exclusão',
                { status: 'danger', icon: 'alert-circle-outline' },
              );
            },
          });
      } else {
        event.confirm.reject();
      }
    });
  }

  onTableFilter(filters: any) {
    let params = new HttpParams();

    const filtersArray = (filters && filters.filters && Array.isArray(filters.filters)) ? filters.filters : [];
    const idFilter = filtersArray.find(f => f.field === 'id');
    const cidadeNomeFilter = filtersArray.find(f => f.field === 'cidadeNome');
    const nomeFilter = filtersArray.find(f => f.field === 'nome');

    if (idFilter?.search) params = params.set('id', idFilter.search);
    if (cidadeNomeFilter?.search) params = params.set('cidadeNome', cidadeNomeFilter.search);
    if (nomeFilter?.search) params = params.set('nome', nomeFilter.search);

    this.filtro.params = params;

    this.service.pesquisar({ ...this.filtro, params } as any)
      .then((response) => {
        const distritos = response.distritos ?? [];
        this.source.load(distritos);
      });
  }
}
