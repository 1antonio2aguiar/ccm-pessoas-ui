import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { FormControl } from '@angular/forms';
import { HttpParams } from '@angular/common/http';
import { LocalDataSource } from 'ng2-smart-table';

import { AtletasBuscaService } from '../../atletas-busca.service';
import { FiltersAtleta } from './FiltersAtletas';

@Component({
  selector: 'ngx-atleta-por-nome',
  templateUrl: './atleta-por-nome.component.html',
  styleUrls: ['./atleta-por-nome.component.scss']
})

export class AtletaPorNomeComponent implements OnInit, OnDestroy {

  @Input() query:string;
  @Input() cell: any;
  inputControl = new FormControl();
  @Output() filterChange = new EventEmitter<string>();
  filtro: FiltersAtleta = new FiltersAtleta();
  source: LocalDataSource = new LocalDataSource();

  private provaId: number;

  constructor(
      private atletasBuscaService: AtletasBuscaService,
    ) {
  }

  ngOnInit(): void {
    this.provaId = this.atletasBuscaService.provaId;

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
    this.filtro.params = this.filtro.params.append('provaId', this.provaId);
    this.filtro.params = this.filtro.params.append('pessoaNome', search);

    this.filtro.pagina = pagina;

    //console.log('Parametro ', this.filtro.params)

    return this.atletasBuscaService.atletaNotInInscricoes(this.filtro)
      .then(resultado => {
        this.filtro.totalRegistros = resultado.total;
        this.source.load(resultado.atletas);
      })
      .catch(error => {
        console.error('Erro ao pesquisar pessoas:', error);
        throw error; // Re-lança o erro para ser tratado pelo chamador (ngOnInit)
    });
  }
}
