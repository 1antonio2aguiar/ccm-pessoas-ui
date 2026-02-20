import { Injectable, Injector, EventEmitter } from '@angular/core';
import { Observable, of } from 'rxjs';
import { HttpParams } from '@angular/common/http';

import { BaseResourceService } from '../../../shared/services/base-resource.service';
import { environment } from '../../../../environments/environment';
//import { Pessoa } from '../../../shared/models/pessoa';
//import { AuthService } from '../../../shared/services/auth.service';

export class Filters {
  pagina = 0;
  itensPorPagina = 5;
  totalRegistros = 0;
  nome = '';
  cpf: string | null = null; 
  params = new HttpParams(); 
}


@Injectable({
  providedIn: 'root'
})

export class PessoasService  {

  // pessoa por id.
  //private pessoaEventHendlerId: EventEmitter<Any>

  /*constructor(
    protected injector: Injector,
    private authService: AuthService,
  ) {
    super(environment.apiUrl + 'pessoas', injector, Pessoa.fromJson);
    this.pessoaEventHendlerId = new EventEmitter<Pessoa>();
  } 

  getPessoas(): Observable<Pessoa[]> {
    return this.http.get<Pessoa[]>(this.apiPath + '/filter');
  }

  pesquisar(filtro: Filters): Promise<any> {
    let termo = filtro.nome?.trim() || filtro.cpf?.trim() || '';

    const params = new HttpParams().set('termo', termo);

    const url = environment.apiUrl + 'pessoas/pesquisar';

    return this.http
      .get<any>(url, { params })
      .toPromise()
      .then((response) => {
        return {
          pessoas: response,
          total: response.length
        };
      })
      .catch(error => {
        console.error('Erro na requisição:', error);
        throw error;
      });
  }

  pessoaDisponiveisParaCadastro(filtro: Filters): Promise<any> {
    const empresaId = this.authService.getEmpresaId();

    let params = new HttpParams()
      .set('empresaId', empresaId!.toString());

    if (filtro.params) {
      filtro.params.keys().forEach(key => {
        params = params.set(key, filtro.params.get(key)!);
      });
    }

    const url = environment.apiUrl + 'atleta/disponiveis-para-cadastro';

    return this.http
      .get<any>(url, { params })
      .toPromise()
      .then(response => {
        const pessoas = response.content;
        return {
          pessoas,
          total: response.totalElements
        };
      })
      .catch(error => {
        console.error('Erro na requisição:', error);
        throw error;
      });
  }*/

}
