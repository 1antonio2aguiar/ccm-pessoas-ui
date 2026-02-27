import { Component } from '@angular/core';
import { LocalDataSource } from 'ng2-smart-table';
import { NbDialogService, NbToastrService } from '@nebular/theme';
import { HttpParams } from '@angular/common/http';

import { CidadeService } from '../cidade.service';
import { FiltroPaginado } from '../../../shared/filters/filtro-paginado';
import { EstadoNomeEditorComponent } from '../estado/EstadoNomeEditorComponent';
import { ConfirmationDialogComponent } from '../../components/base-resource-confirmation-delete/confirmation-dialog/confirmation-dialog.component';

@Component({
  selector: 'ngx-cidade-iud',
  templateUrl: './cidade-iud.component.html',
  styleUrls: ['./cidade-iud.component.scss']
})

export class CidadeIudComponent {

  source: LocalDataSource = new LocalDataSource();
  filtro: FiltroPaginado = new FiltroPaginado();

  settings = {
    pager: {
      perPage: this.filtro.itensPorPagina,
      display: true,
    },

    actions: {
      add: true,
      edit: true,
      delete: true,
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

      estadoNome: {
        title: 'Estado',
        type: 'string',
        width: '200px',

        editor: {
          type: 'custom',
          component: EstadoNomeEditorComponent,
        },
      },

      nome: {
        title: 'Nome',
        type: 'string',
        width: '600px',
        filter: true,
      },

     sigla: {
        title: 'Sigla',
        type: 'string',
        filter: false,
        width: '80px',
      },
    },
  };

  constructor(
    private service: CidadeService,
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
        const cidades = response.cidades ?? [];
        this.source.load(cidades);
      })
      .catch(error => {
        console.error('Erro ao listar cidades:', error);
      });
  }

  onCreateConfirm(event) {
    if (!event.newData.estadoId) {
      this.toastrService.show(
        'Selecione um estado na lista para preencher corretamente.',
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
        this.toastrService.show('Nova cidade cadastrado com sucesso!', 'Cadastro Realizado',
          { status: 'success', icon: 'checkmark-circle-outline' });
      },
      error: (error) => {
        console.error('Erro ao criar cidade:', error);
        event.confirm.reject();
      }
    });
  }

  onSaveConfirm(event) {
    // Nunca deixa alterar pais no update
    event.newData.estadoId = event.data.estadoId;
    event.newData.estadoNome = event.data.estadoNome;

    this.service.update(event.newData).subscribe({
      next: () => {
        this.listar();
        event.confirm.resolve();
        this.toastrService.show(
          `Cidade "${event.newData.nome}" foi atualizada com sucesso!`,
          'Atualização Realizada',
          { status: 'success', icon: 'edit-outline' }
        );
      },
      error: (error) => {
        console.error('Erro ao editar cidade:', error);
        event.confirm.reject();
      }
    });
  }

  onDeleteConfirm(event): void {
    const item = event.data;

    this.dialogService.open(ConfirmationDialogComponent, {
      context: {
        title: 'Confirmar Exclusão',
        message: `Você tem certeza que deseja excluir a cidade <strong>"${item.nome}"</strong>?`,
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
                `Cidade "${item.nome}" foi excluída com sucesso.`,
                'Exclusão Realizada',
                { status: 'success', icon: 'trash-2-outline' }
              );
            },
            error: (error) => {
              console.error('Erro ao deletar cidade:', error);
              event.confirm.reject();

              this.toastrService.show(
                'Não foi possível excluir a cdiade. Verifique se ele não está sendo usado em outras partes do sistema.',
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
          const cidades = response.cidades;
          this.source.load(cidades);
        });
    }
  
    onSearch(query: string = '') {
      let params = new HttpParams();
  
      const isId = !isNaN(Number(query));
      if (isId) params = params.append('id', query);
  
      const isString = isNaN(Number(query)) && query.length > 0;
      if (isString) {
        params = params.append('nome', query);
        params = params.append('estado', query);
      }
  
      this.filtro.params = params;
  
      this.service.pesquisar({
        ...this.filtro, params,
        resetParams: function (): void {
          throw new Error('Function not implemented.');
        }
      })
        .then(response => {
          const cidades = response.cidades;
          this.source.load(cidades);
        });
    }
}
