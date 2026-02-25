import { Component, OnInit } from '@angular/core';
import { LocalDataSource } from 'ng2-smart-table';
import { NbDialogService, NbToastrService } from '@nebular/theme';
import { HttpParams } from '@angular/common/http';

import { FiltroPaginado } from '../../../shared/filters/filtro-paginado';
import { TipoLogradouroService } from '../tipo-logradouro.service';

import { ConfirmationDialogComponent } from '../../components/base-resource-confirmation-delete/confirmation-dialog/confirmation-dialog.component';

@Component({
  selector: 'ngx-tipo-logradouro-iud',
  templateUrl: './tipo-logradouro-iud.component.html',
  styleUrls: ['./tipo-logradouro-iud.component.scss']
})
export class TipoLogradouroIudComponent implements OnInit {
  source: LocalDataSource = new LocalDataSource();
  filtro: FiltroPaginado = new FiltroPaginado();

  public settings = {
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
      mode: 'edit'
    },
    delete: {
      deleteButtonContent: '<i class="nb-trash"></i>',
      confirmDelete: true,
    },
    columns: {
      id: {
        title: 'ID',
        type: 'number',
        editable: false,
        addable: false,
        filter: true,
        width: '80px',
      },
      descricao: {
        title: 'Descrição',
        type: 'string',
        width: '800px',
        filter: true,
      },
      sigla: {
        title: 'Sigla',
        type: 'string',
        filter: false,
        width: '120px',
      },
    },
  };

  constructor(
    private service: TipoLogradouroService,
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
      .then(response => {
        const tiposLogradouro = response.tiposLogradouro;
        this.source.load(tiposLogradouro);
      })
      .catch(error => {
        console.error('Erro ao listar tipos de logradouro:', error);
      });
  }

  onSaveConfirm(event) {
    this.service.update(event.newData)
      .subscribe({
        next: () => {
          this.listar();
          event.confirm.resolve();

          this.toastrService.show(
            `Tipo de Logradouro "${event.newData.descricao}" foi atualizado com sucesso!`,
            'Atualização Realizada',
            { status: 'success', icon: 'edit-outline' }
          );
        },
        error: (error) => {
          console.error('Erro ao editar tipo de logradouro:', error);
          event.confirm.reject();
        }
      });
  }

  onCreateConfirm(event) {
    this.service.create(event.newData)
      .subscribe({
        next: () => {
          this.listar();
          event.confirm.resolve();

          this.toastrService.show(
            'Novo tipo de logradouro cadastrado com sucesso!',
            'Cadastro Realizado',
            { status: 'success', icon: 'checkmark-circle-outline' }
          );
        },
        error: (error) => {
          console.error('Erro ao criar tipo de logradouro:', error);
          event.confirm.reject();
        }
      });
  }

  onDeleteConfirm(event): void {
    const item = event.data;

    this.dialogService.open(ConfirmationDialogComponent, {
      context: {
        title: 'Confirmar Exclusão',
        message: `Você tem certeza que deseja excluir o tipo de logradouro <strong>"${item.descricao}"</strong>?`,
        confirmButtonText: 'Sim, Excluir',
        cancelButtonText: 'Cancelar',
        status: 'danger',
        icon: 'trash-2-outline'
      },
      closeOnBackdropClick: false
    }).onClose.subscribe(confirmado => {
      if (confirmado) {
        this.service.delete(item.id)
          .subscribe({
            next: () => {
              this.listar();
              event.confirm.resolve();

              this.toastrService.show(
                `Tipo de Logradouro "${item.descricao}" foi excluído com sucesso.`,
                'Exclusão Realizada',
                { status: 'success', icon: 'trash-2-outline' }
              );
            },
            error: (error) => {
              console.error('Erro ao deletar tipo de logradouro:', error);
              event.confirm.reject();

              this.toastrService.show(
                'Não foi possível excluir o tipo de logradouro. Verifique se ele não está sendo usado em outras partes do sistema.',
                'Erro na Exclusão',
                { status: 'danger', icon: 'alert-circle-outline' }
              );
            }
          });
      } else {
        event.confirm.reject();
      }
    });
  }

  // Filtro pelo campo de busca do ng2-smart-table (colunas com filter=true)
  onTableFilter(filters: any) {
    let params = new HttpParams();

    const filtersArray = (filters && filters.filters && Array.isArray(filters.filters)) ? filters.filters : [];
    const idFilter = filtersArray.find(f => f.field === 'id');
    const descricaoFilter = filtersArray.find(f => f.field === 'descricao');

    if (idFilter && idFilter.search) {
      params = params.set('id', idFilter.search);
    }
    if (descricaoFilter && descricaoFilter.search) {
      params = params.set('descricao', descricaoFilter.search);
    }

    this.filtro.params = params;

    this.service.pesquisar({
      ...this.filtro, params,
      resetParams: function (): void {
        throw new Error('Function not implemented.');
      }
    })
      .then(response => {
        const tiposLogradouro = response.tiposLogradouro;
        this.source.load(tiposLogradouro);
      });
  }

  // Pesquisa "rápida" (se você tiver um input externo, opcional)
  onSearch(query: string = '') {
    let params = new HttpParams();

    const isId = !isNaN(Number(query));
    if (isId) {
      params = params.append('id', query);
    }

    const isString = isNaN(Number(query)) && query.length > 0;
    if (isString) {
      params = params.append('descricao', query);
    }

    this.filtro.params = params;

    this.service.pesquisar({
      ...this.filtro, params,
      resetParams: function (): void {
        throw new Error('Function not implemented.');
      }
    })
      .then(response => {
        const tiposLogradouro = response.tiposLogradouro;
        this.source.load(tiposLogradouro);
      });
  }
}
