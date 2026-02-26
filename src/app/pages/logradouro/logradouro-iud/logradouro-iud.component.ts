import { Component } from '@angular/core';
import { LocalDataSource } from 'ng2-smart-table';
import { NbDialogService, NbToastrService } from '@nebular/theme';
import { HttpParams } from '@angular/common/http';

import { LogradouroService } from '../logradouro.service';
import { FiltroPaginado } from '../../../shared/filters/filtro-paginado';
import { DistritoNomeEditorComponent } from '../distrito/DistritoNomeEditorComponent';
import { ConfirmationDialogComponent } from '../../components/base-resource-confirmation-delete/confirmation-dialog/confirmation-dialog.component';
import { TipoLogradouroEditorComponent } from '../tipo-logradouro/TipoLogradouroditorComponent';
import { TituloPatenteEditorComponent } from '../titulo-patente/TituloPatenteditorComponent';

@Component({
  selector: 'ngx-logradouro-iud',
  templateUrl: './logradouro-iud.component.html',
  styleUrls: ['./logradouro-iud.component.scss'],
})
export class LogradouroIudComponent {

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
        editable: false,
        filter: true,
        width: '90px',
        hide:true,
      },

      nomeCidade: {
        title: 'Cidade',
        type: 'string',
        filter: true,
        width: '250px',

        editor: {
          type: 'custom',
          component: DistritoNomeEditorComponent, // <<< busca por NOME CIDADE e lista distritos
        },
      },

      nomeDistrito: {
        title: 'Distrito',
        type: 'string',
        filter: false,
        width: '250px',
      },

      tipoLogradouroIdDescricao: {
        title: 'Tipo',
        type: 'string',
        filter: false,
        width: '200px',

        editor: {
          type: 'custom',
          component: TipoLogradouroEditorComponent, // <<< busca por descricao
        },
      },

      tituloPatente: {
        title: 'Título/Patente',
        type: 'string',
        filter: false,
        width: '200px',

        editor: {
          type: 'custom',
          component: TituloPatenteEditorComponent, // <<< busca por descricao
        },
      },

      nome: {
        title: 'Nome',
        type: 'string',
        filter: true,
        width: '420px',
      },
      
      nomeReduzido: {
        title: 'Nome Reduzido',
        type: 'string',
        filter: false,
        width: '300px',
      },

      /*complemento: {
        title: 'Complemento',
        type: 'string',
        filter: false,
        width: '240px',
      },*/
    },
  };

  constructor(
    private service: LogradouroService,
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
        const logradouros = response.logradouros ?? [];
        this.source.load(logradouros);
      })
      .catch((error) => {
        console.error('Erro ao listar logradouros:', error);
      });
  }

  onCreateConfirm(event) {
    if (!event.newData.distritoId) {
      this.toastrService.show(
        'Selecione um distrito na lista para preencher corretamente.',
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
          'Novo logradouro cadastrado com sucesso!',
          'Cadastro Realizado',
          { status: 'success', icon: 'checkmark-circle-outline' },
        );
      },
      error: (error) => {
        console.error('Erro ao criar logradouro:', error);
        event.confirm.reject();
      },
    });
  }

  onSaveConfirm(event) {
    // Nunca deixa alterar distrito no update
    event.newData.distritoId = event.data.distritoId;
    event.newData.distritoNome = event.data.distritoNome;

    this.service.update(event.newData).subscribe({
      next: () => {
        this.listar();
        event.confirm.resolve();
        this.toastrService.show(
          `Logradouro "${event.newData.nome}" foi atualizado com sucesso!`,
          'Atualização Realizada',
          { status: 'success', icon: 'edit-outline' },
        );
      },
      error: (error) => {
        console.error('Erro ao editar logradouro:', error);
        event.confirm.reject();
      },
    });
  }

  onDeleteConfirm(event): void {
    const item = event.data;

    this.dialogService.open(ConfirmationDialogComponent, {
      context: {
        title: 'Confirmar Exclusão',
        message: `Você tem certeza que deseja excluir o logradouro <strong>"${item.nome}"</strong>?`,
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
                `Logradouro "${item.nome}" foi excluído com sucesso.`,
                'Exclusão Realizada',
                { status: 'success', icon: 'trash-2-outline' },
              );
            },
            error: (error) => {
              console.error('Erro ao deletar logradouro:', error);
              event.confirm.reject();

              this.toastrService.show(
                'Não foi possível excluir o logradouro. Verifique se ele não está sendo usado em outras partes do sistema.',
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
    const cidadeFilter = filtersArray.find(f => f.field === 'nomeCidade');
    const nomeFilter = filtersArray.find(f => f.field === 'nome');

    if (idFilter?.search) params = params.set('id', idFilter.search);
    if (cidadeFilter?.search) params = params.set('cidadeNome', cidadeFilter.search); // <<< agora filtra por cidade
    if (nomeFilter?.search) params = params.set('nome', nomeFilter.search);


    this.filtro.params = params;

    this.service.pesquisar({ ...this.filtro, params } as any)
      .then((response) => {
        const logradouros = response.logradouros ?? [];
        this.source.load(logradouros);
      });
  }
}
