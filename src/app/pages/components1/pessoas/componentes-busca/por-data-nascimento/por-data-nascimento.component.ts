import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { FormControl } from '@angular/forms';
import { HttpParams } from '@angular/common/http';
import { LocalDataSource } from 'ng2-smart-table';

import { PessoasService } from '../../pessoas.service';
import { FiltersPessoa } from '../FiltersPessoas';

@Component({
  selector: 'ngx-por-data-nascimento',
  templateUrl: './por-data-nascimento.component.html',
  styleUrls: ['./por-data-nascimento.component.scss']
})

export class PorDataNascimentoComponent implements OnInit, OnDestroy, OnDestroy {
  @Input() query: string;
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
    if (this.query) {
      this.inputControl.setValue(this.query)
    }
  }
  ngOnDestroy() {
    this.inputControl.reset();
  }

  pesquisarPorDataNascimento(search: string, pagina: number): Promise<any> {

    const data = this.formatDate(search)
    this.filtro.params = new HttpParams();
    this.filtro.params = this.filtro.params.append('dadosPessoaFisicaFilter.dataNascimento', data);
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

  // Função para formatar a data para mm/dd/yyyy
  private formatDate(dateString: string): string {
    if (!dateString) {
      return '';
    }
    const date = new Date(dateString);
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${month}/${day}/${year}`;
  }

}