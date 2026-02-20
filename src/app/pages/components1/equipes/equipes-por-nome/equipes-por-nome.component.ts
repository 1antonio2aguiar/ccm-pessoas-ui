import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { FormControl } from '@angular/forms';
import { HttpParams } from '@angular/common/http';
import { LocalDataSource } from 'ng2-smart-table';

import { EquipesService } from '../equipes.service';
import { FiltersEquipe } from '../FiltersEquipes';

@Component({
  selector: 'ngx-equipes-por-nome',
  templateUrl: './equipes-por-nome.component.html',
  styleUrls: ['./equipes-por-nome.component.scss']
})

export class EquipesPorNomeComponent implements OnInit, OnDestroy {
    @Input() query:string;
    inputControl = new FormControl();
    @Output() filterChange = new EventEmitter<string>();
    filtro: FiltersEquipe = new FiltersEquipe();
    source: LocalDataSource = new LocalDataSource();

    constructor(
        private equipesService: EquipesService,
      ) {
    }

    ngOnInit(): void {
        this.inputControl.valueChanges.subscribe(value => {
            this.filterChange.emit(value);
        })
        if(this.query){
            this.inputControl.setValue(this.query)
        }
    }
    ngOnDestroy(){
        this.inputControl.reset();
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
}