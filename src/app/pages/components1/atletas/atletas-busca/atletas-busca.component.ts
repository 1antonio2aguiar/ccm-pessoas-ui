import { Component, OnInit, Output, EventEmitter, OnDestroy, HostBinding, Input } from '@angular/core';
import { LocalDataSource } from 'ng2-smart-table';
import { NbWindowService, NbWindowRef, NbDialogRef } from '@nebular/theme';
import { Subscription } from 'rxjs';
import { Observable, Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { HttpParams } from '@angular/common/http';

import { Filters } from '../../../../shared/filters/filters';
import { AtletasBuscaService } from '../atletas-busca.service';
//import { TelaOrigemService } from '../../../../shared/services/tela-origem.service';
import { AtletaPorNomeComponent } from './por-nome/atleta-por-nome.component';

@Component({
    selector: 'ngx-atletas-busca',
    templateUrl: './atletas-busca.component.html',
    styleUrls: ['./atletas-busca.component.scss']
}) 

export class AtletasBuscaComponent implements OnInit, OnDestroy{
    // talvez nao precise disso
    @HostBinding('class.custom-modal-card') customModalCard = true;
    @Input() telaOrigem;
    @Input() provaId;

      width = 700; // Define a largura do modal

    private searchTerms = new Subject<string>(); 

    source: LocalDataSource = new LocalDataSource();
    filtro: Filters = new Filters();
    loading = false;

    // talvez nao precise disso
    nameFilterComponent = (cell: any, search: string) => {
        if (!search) return true;
        //this.filtro.nome = search;
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
                    component: AtletaPorNomeComponent,
                    // A MÁGICA: 'this.provaId' é lido no momento certo.
                    config: {
                        provaId: 23
                    },
                },
            },

            equipeNome: { title: 'Equipe', type: 'string', editable: false, addable: false, filter: false },

        },
        actions: { add: false, edit: false, delete: false },
        selectMode: 'single'
    }   
    
    constructor(
        private windowService: NbWindowService, 
            private atletasBuscaService: AtletasBuscaService,
           // private telaOrigemService: TelaOrigemService,
            private ref: NbWindowRef
    ){
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
        this.atletasBuscaService.provaId = this.provaId;

        //this.telaOrigemService.setTelaOrigem(this.telaOrigem);
        
        this.loading = true;
        this.pesquisar('', 0) // Carregamento inicial com termo de busca vazio
          .then(() => this.loading = false)
          .catch(error => {
            this.loading = false; // Lidar com erros adequadamente
            console.error('Erro ao carregar dados iniciais:', error);
        });
    }

    selectItem(event) {
        if(!event.isSelected){
          this.ref.close(event.data); // Fecha o modal filho
        }
    }

    pesquisar(search: string, pagina: number): Promise<any> {
    
        this.filtro.params = new HttpParams();
        this.filtro.params = this.filtro.params.append('provaId', this.provaId);
        this.filtro.pagina = pagina;
    
        return this.atletasBuscaService.atletaNotInInscricoes(this.filtro)
          .then(resultado => {
            this.filtro.totalRegistros = resultado.total;
            this.source.load(resultado.atletas);
            //console.log('RESULTADO ', resultado)
          })
          .catch(error => {
            console.error('Erro ao pesquisar atletas:', error);
            throw error; // Re-lança o erro para ser tratado pelo chamador (ngOnInit)
        });
    }

    ngOnDestroy() {
        this.searchTerms.unsubscribe(); // Important to prevent memory leaks!
    }
} 