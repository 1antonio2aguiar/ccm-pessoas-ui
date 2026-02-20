import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { FormControl } from '@angular/forms';
import { HttpParams } from '@angular/common/http';
import { LocalDataSource } from 'ng2-smart-table';

import { PessoasService } from '../../pessoas.service';
import { FiltersPessoa } from '../FiltersPessoas';

@Component({
  selector: 'ngx-por-nome',
  templateUrl: './por-nome.component.html',
  styleUrls: ['./por-nome.component.scss']
})

export class PorNomeComponent implements OnInit, OnDestroy {
    @Input() query:string;
    inputControl = new FormControl();
    @Output() filterChange = new EventEmitter<string>();
    filtro: FiltersPessoa = new FiltersPessoa();
    source: LocalDataSource = new LocalDataSource();

    constructor(
        private pessoasService: PessoasService,
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

    return this.pessoasService.pesquisar(this.filtro)
      .then(resultado => {
        this.filtro.totalRegistros = resultado.total;
        this.source.load(resultado.pessoas);
      })
      .catch(error => {
        console.error('Erro ao pesquisar pessoas:', error);
        throw error; // Re-lança o erro para ser tratado pelo chamador (ngOnInit)
      });
  }
}