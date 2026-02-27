import { Component, OnInit } from '@angular/core';
import { LocalDataSource } from 'ng2-smart-table';
import { NbDialogService, NbToastrService } from '@nebular/theme';
import { HttpParams } from '@angular/common/http';

import { FiltroPaginado } from '../../../shared/filters/filtro-paginado';
import { EstadoService } from '../estado.service';

import { ConfirmationDialogComponent } from '../../components/base-resource-confirmation-delete/confirmation-dialog/confirmation-dialog.component';
import { PaisNomeEditorComponent } from '../pais/PaisNomeEditorComponent';

@Component({
  selector: 'ngx-estado-iud',
  templateUrl: './estado-iud.component.html',
  styleUrls: ['./estado-iud.component.scss']
})
export class EstadoIudComponent implements OnInit {
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
        //editable: false, eata bloqueando no css acho melhor.
        addable: false,
        filter: true,
        width: '90px',
      },

      paisNome: {
        title: 'País',
        type: 'string',
        filter: false,
        width: '280px',
        
        editor: {
          type: 'custom',
          component: PaisNomeEditorComponent,
        },
      },

      nome: {
        title: 'Nome',
        type: 'string',
        filter: true,
        width: '520px',
      },

      uf: {
        title: 'UF',
        type: 'string',
        filter: false,
        width: '80px',
      },
    },
  };

  constructor(
    private service: EstadoService,
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
        const estados = response.estados ?? [];
        this.source.load(estados);
      })
      .catch(error => {
        console.error('Erro ao listar estados:', error);
      });
  }

  onSaveConfirm(event) {
    // Nunca deixa alterar pais no update
    event.newData.paisId = event.data.paisId;
    event.newData.paisNome = event.data.paisNome;

    this.service.update(event.newData).subscribe({
      next: () => {
        this.listar();
        event.confirm.resolve();
        this.toastrService.show(
          `Estado "${event.newData.nome}" foi atualizado com sucesso!`,
          'Atualização Realizada',
          { status: 'success', icon: 'edit-outline' }
        );
      },
      error: (error) => {
        console.error('Erro ao editar estado:', error);
        event.confirm.reject();
      }
    });
  }

  onCreateConfirm(event) {
    if (!event.newData.paisId) {
      this.toastrService.show(
        'Selecione um país na lista para preencher o país corretamente.',
        'Atenção',
        { status: 'warning' }
      );
      event.confirm.reject();
      return;
    }

    // opcional: se backend não quer paisNome no create, você pode remover
    // delete event.newData.paisNome;

    this.service.create(event.newData).subscribe({
      next: () => {
        this.listar();
        event.confirm.resolve();
        this.toastrService.show('Novo estado cadastrado com sucesso!', 'Cadastro Realizado',
          { status: 'success', icon: 'checkmark-circle-outline' });
      },
      error: (error) => {
        console.error('Erro ao criar estado:', error);
        event.confirm.reject();
      }
    });
  }

  onDeleteConfirm(event): void {
    const item = event.data;

    this.dialogService.open(ConfirmationDialogComponent, {
      context: {
        title: 'Confirmar Exclusão',
        message: `Você tem certeza que deseja excluir o estado <strong>"${item.nome}"</strong>?`,
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
                `Estado "${item.nome}" foi excluído com sucesso.`,
                'Exclusão Realizada',
                { status: 'success', icon: 'trash-2-outline' }
              );
            },
            error: (error) => {
              console.error('Erro ao deletar estado:', error);
              event.confirm.reject();

              this.toastrService.show(
                'Não foi possível excluir o estado. Verifique se ele não está sendo usado em outras partes do sistema.',
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

  onTableFilter(filters: any) {
    let params = new HttpParams();

    const filtersArray = (filters && filters.filters && Array.isArray(filters.filters)) ? filters.filters : [];
    const idFilter = filtersArray.find(f => f.field === 'id');
    const paisFilter = filtersArray.find(f => f.field === 'pais');
    const nomeFilter = filtersArray.find(f => f.field === 'nome');
    const siglaFilter = filtersArray.find(f => f.field === 'sigla');

    if (idFilter?.search) params = params.set('id', idFilter.search);
    if (paisFilter?.search) params = params.set('pais', paisFilter.search);
    if (nomeFilter?.search) params = params.set('nome', nomeFilter.search);
    if (siglaFilter?.search) params = params.set('sigla', siglaFilter.search);

    this.filtro.params = params;

    this.service.pesquisar({
      ...this.filtro, params,
      resetParams: function (): void {
        throw new Error('Function not implemented.');
      }
    })
      .then(response => {
        const estados = response.estados;
        this.source.load(estados);
      });
  }

  onSearch(query: string = '') {
    let params = new HttpParams();

    const isId = !isNaN(Number(query));
    if (isId) params = params.append('id', query);

    const isString = isNaN(Number(query)) && query.length > 0;
    if (isString) {
      params = params.append('nome', query);
      params = params.append('sigla', query);
      params = params.append('pais', query);
    }

    this.filtro.params = params;

    this.service.pesquisar({
      ...this.filtro, params,
      resetParams: function (): void {
        throw new Error('Function not implemented.');
      }
    })
      .then(response => {
        const estados = response.estados;
        this.source.load(estados);
      });
  }
}
