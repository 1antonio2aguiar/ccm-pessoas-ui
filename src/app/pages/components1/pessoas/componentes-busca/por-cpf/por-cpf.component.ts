import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { FormControl } from '@angular/forms';
import { HttpParams } from '@angular/common/http';
import { LocalDataSource } from 'ng2-smart-table';

import { PessoasService } from '../../pessoas.service';
import { FiltersPessoa } from '../FiltersPessoas';
//import { CpfPipe } from '../../../../../shared/pipes/cpf.pipe';

@Component({
  selector: 'ngx-por-cpf',
  templateUrl: './por-cpf.component.html',
  styleUrls: ['./por-cpf.component.scss']
})

export class PorCpfComponent implements OnInit, OnDestroy {
  @Input() query: string;
  inputControl = new FormControl();
  @Output() filterChange = new EventEmitter<string>();
  filtro: FiltersPessoa = new FiltersPessoa();
  source: LocalDataSource = new LocalDataSource();
  //private cpfPipe = new CpfPipe(); // Instancia o CpfPipe

  constructor(
    private pessoasService: PessoasService,
  ) {
  }

  ngOnInit(): void {
    this.inputControl.valueChanges.subscribe(value => {
      this.filterChange.emit(value);
    })
    if (this.query) {
      this.inputControl.setValue(this.query)
    }
    
  }
  
  ngOnDestroy() {
    this.inputControl.reset();
  }

  pesquisarPorCpf(search: string, pagina: number): Promise<any> {

    this.filtro.params = new HttpParams();
    this.filtro.params = this.filtro.params.append('dadosPessoaFisicaFilter.cpf', search);
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