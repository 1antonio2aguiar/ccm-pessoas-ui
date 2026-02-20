import { Component, OnInit, Output, EventEmitter, OnDestroy, HostBinding } from '@angular/core';
import { LocalDataSource } from 'ng2-smart-table';
import { NbWindowService, NbWindowRef, NbDialogRef } from '@nebular/theme';
import { Subscription } from 'rxjs';
import { Observable, Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { HttpParams } from '@angular/common/http';

import { EquipesService } from '../equipes.service';
import { Filters } from '../../../../shared/filters/filters';
import { EquipesPorNomeComponent } from '../equipes-por-nome/equipes-por-nome.component';

@Component({
  selector: 'ngx-equipes-busca',
  templateUrl: './equipes-busca.component.html',
  styleUrls: ['./equipes-busca.component.scss']
})

export class EquipesBuscaComponent  {
  @HostBinding('class.custom-modal-card') customModalCard = true;

  private searchTerms = new Subject<string>();

  /*source: LocalDataSource = new LocalDataSource();
  filtro: Filters = new Filters();
  loading = false;

  nameFilterComponent = (cell: any, search: string) => {
    if (!search) return true;
    this.filtro.nome = search;
    this.searchTerms.next(search);
    return String(cell).toLowerCase().indexOf(String(search).toLowerCase()) !== -1;
  }

  settings = {
    mode: 'external',
    
    pager: {
      perPage: this.filtro.itensPorPagina,
      display: true,
    },
    columns: {
      id: { title: 'ID', type: 'number', editable: false, addable: false, width: '50px', filter: false },

      nome: { 
        title: 'Nome', 
        type: 'string',
        filter: {
          type: 'custom',
          component: EquipesPorNomeComponent,
        },
      },

    },

    actions: { add: false, edit: false, delete: false },
    selectMode: 'single',
  };

  constructor(
    private windowService: NbWindowService, 
    private equipesService: EquipesService,
    private ref: NbWindowRef, 
  ) {
    this.searchTerms.pipe(debounceTime(3000)).subscribe(term => {
      this.loading = true; // Mostrar indicador de carregamento
      this.pesquisar(term, 0) // Buscar dados filtrados
        .then(() => this.loading = false) // Ocultar indicador após o carregamento
        .catch(error => {
          this.loading = false; // Ocultar indicador em caso de erro
          console.error("Erro na busca:", error);
          // Tratar o erro adequadamente (exibir mensagem para o usuário)
        });
    });
  }

  ngOnInit(): void {
    this.loading = true;
    this.pesquisar('', 0) // Carregamento inicial com termo de busca vazio
      .then(() => this.loading = false)
      .catch(error => {
        this.loading = false; // Lidar com erros adequadamente
        console.error('Erro ao carregar dados iniciais:', error);
    });
  }

  selectItem(event) {
    console.log('cell 1', event)
    if(!event.isSelected){
      this.ref.close(event.data); // Fecha o modal filho
    }
  }

  pesquisar(search: string, pagina: number): Promise<any> {
    
    this.filtro.params = new HttpParams();
    this.filtro.params = this.filtro.params.append('nome', search);
    this.filtro.pagina = pagina;

    return this.equipesService.pesquisar(this.filtro)
      .then(resultado => {
        this.filtro.totalRegistros = resultado.total;
        this.source.load(resultado.equipes);
      })
      .catch(error => {
        console.error('Erro ao pesquisar equipes:', error);
        throw error; // Re-lança o erro para ser tratado pelo chamador (ngOnInit)
      });
  }

  ngOnDestroy() {
    this.searchTerms.unsubscribe(); // Important to prevent memory leaks!
  }*/

}
