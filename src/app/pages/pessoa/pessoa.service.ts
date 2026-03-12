import { Injectable, Injector, EventEmitter } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';

import { environment } from '../../../environments/environment';
import { BaseResourceService } from '../../shared/services/base-resource.service';
import { PessoaIn,  } from '../../shared/models/pessoaIn';
import { PessoaOut } from '../../shared/models/pessoaOut';
import { TipoPessoa } from '../../shared/models/tipoPessoa';
import { Filters } from '../../shared/filters/filters';

export class PessoaFilters {
  pagina = 0;
  itensPorPagina = 40;
  totalRegistros = 0;

  id: number | null = null;
  nome = '';
  cpf: string | null = null;
  cnpj: string | null = null;

  params = new HttpParams();
}

@Injectable({ providedIn: 'root' })

export class PessoaService extends BaseResourceService<PessoaOut> {

  // pessoa por id.
    private pessoaEventHendlerId: EventEmitter<PessoaIn>

  constructor(
      protected injector: Injector,
    ) {
      super(environment.apiUrl + 'pessoas', injector, PessoaOut.fromJson);
      this.pessoaEventHendlerId = new EventEmitter<PessoaIn>();
  }

  
  pesquisar(filtro: Filters): Promise<any> {
    let params = filtro.params;

    return this.http
    .get<any>(this.apiPath + '/filter', { params })
    .toPromise()
    .then((response) => {
      const pessoas = response.content;
      const resultado = {
        pessoas,
        total: response.totalElements,
      };
      //console.log('LISTA ', resultado)
      return resultado;
    });
  }

  getPessoaById(pessoaId: number): Promise<PessoaOut> {
    // padrão REST: GET /pessoas/{id}
    const url = `${this.apiPath}/${pessoaId}`;
    return this.http.get<PessoaOut>(url).toPromise();
  }

  public createPessoa(pessoa: any): Observable<PessoaOut> {
    return this.http.post<PessoaOut>(this.apiPath, pessoa);
  }
  
  public updatePessoa(id: number, pessoa: any): Observable<PessoaOut> {
    return this.http.put<PessoaOut>(`${this.apiPath}/${id}`, pessoa);
  }

}
