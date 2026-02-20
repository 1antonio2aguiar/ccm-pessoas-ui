import { Component, OnInit } from '@angular/core';
import { LocalDataSource } from 'ng2-smart-table';
import { ActivatedRoute, Router } from '@angular/router';
import { LocaisCompeticoesService } from '../locais-competicoes.service';
import { Filters } from '../../../shared/filters/filters';

@Component({
  selector: 'ngx-locais-competicoes-iud',
  templateUrl: './locais-competicoes-iud.component.html',
  styleUrls: ['./locais-competicoes-iud.component.scss']
})

export class LocaisCompeticoesIudComponent {
  source: LocalDataSource = new LocalDataSource();
  filtro: Filters = new Filters();

  settings = {
    pager: {
      perPage: this.filtro.itensPorPagina, // Define o número de linhas por página
      display: true, // Exibe o paginador
    },

    add: {
      addButtonContent: '<i class="nb-plus"></i>',
      createButtonContent: '<i class="nb-checkmark"></i>',
      cancelButtonContent: '<i class="nb-close"></i>',
      confirmCreate: true,
      addMode: 'edit'
    },
    edit: {
      editButtonContent: '<i class="nb-edit"></i>',
      saveButtonContent: '<i class="nb-checkmark"></i>',
      cancelButtonContent: '<i class="nb-close"></i>',
      confirmSave: true,
      addMode: 'edit'
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
      },
      empresa: {
        title: 'Empresa',
        type: 'number',
        hide: true,
        valuePrepareFunction: (empresa) => {
          return empresa.value = 1;
        },
      },
      nome: {
        title: 'Nome',
        type: 'string',
      },
      endereco: {
        title: 'Endereço',
        type: 'string',
      },
    }
  }

  ngOnInit(): void {
    this.listar();

    this.source.onChanged().subscribe((change) => {
      if (change.action === 'page') {
        this.aoMudarPagina(change.paging.page);
      }
    });
  };

  constructor(private service: LocaisCompeticoesService,
    private router: Router,
    private routeActive: ActivatedRoute) {
    // Inicializar o filtro com valores padrões
    this.filtro.pagina = 1;
    this.filtro.itensPorPagina = 10;
  }

  listar() {
    this.service.pesquisar(this.filtro)
      .then(response => {
        const locaisCompeticoes = response.locaisCompeticoes;
        this.source.load(locaisCompeticoes);
      });
  };

  onCreateConfirm(event) {
    event.newData.empresa = 1;
    this.service.create(event.newData)
    .subscribe(
      () => {
        // Atualiza a tabela com os dados mais recentes
        this.listar();
        event.confirm.resolve();
        // O ng2-smart-table gerencia a atualização do estado de edição
      },
      error => console.error('Erro ao criar local competicao:', error)
    );
  };

  onSaveConfirm(event) {
    this.service.update(event.newData)
    .subscribe(
      () => {
        // Atualiza a tabela e fecha o modal de edição
        this.listar();
        event.confirm.resolve();
        // O ng2-smart-table gerencia a atualização do estado de edição
      },
      error => console.error('Erro ao editar local competicao:', error)
    );
  };

  onDeleteConfirm(event): void {
    if (window.confirm('Voce deseja deletar este item?')) {
      const id = event.data.id; // Obter o ID da modalidade a ser deletada

      this.service.delete(id)
        .subscribe(
          () => {
            // Atualiza a tabela com os dados mais recentes
            this.listar();
            event.confirm.resolve();
          },
          error => console.error('Erro ao deletar local competicao:', error)
        );
    } else {
      event.confirm.reject();
    }
  };

  aoMudarPagina(pageIndex) {
    const loadedRecordCount = this.filtro.totalRegistros
    const lastRequestedRecordIndex = pageIndex * this.filtro.itensPorPagina;

    if (loadedRecordCount <= lastRequestedRecordIndex) {
      let myFilter; 
      myFilter.startIndex = loadedRecordCount + 1;

      this.service.pesquisar(myFilter) //.toPromise()
        .then(data => {
          if (this.source.count() > 0) {
            data.forEach(d => this.source.add(d));
            this.source.getAll()
              .then(d => this.source.load(d))
          }
          else
            this.source.load(data);
      })
    }
  };
}
