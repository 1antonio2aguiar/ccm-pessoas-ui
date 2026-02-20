import { Injectable, Injector, EventEmitter } from '@angular/core';
import { HttpParams, HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { BaseResourceService } from '../../../shared/services/base-resource.service';
import { Filters } from '../../../shared/filters/filters';
import { environment } from '../../../../environments/environment';
//import { Atleta } from '../../../shared/models/atleta';

@Injectable({
    providedIn: 'root'
})

export class AtletasBuscaService {
  public provaId: number;

  /*private atletaEventHendlerId: EventEmitter<Atleta>

  constructor(protected injector: Injector) {
    super(environment.apiUrl + 'atleta', injector, Atleta.fromJson);
    this.atletaEventHendlerId = new EventEmitter<Atleta>();
  }

  getPessoas(): Observable<Atleta[]> {
    return this.http.get<Atleta[]>(this.apiPath + '/filter');
  }

  pesquisar(filtro: Filters): Promise<any> {
      let params = filtro.params
    
        if (filtro.params) {
          filtro.params.keys().forEach(key => {
            params = params.set(key, filtro.params.get(key));
          });
        }
    
        return this.http
          .get<any>(this.apiPath + '/filter', { params }) // Use the declared params
          .toPromise()
          .then((response) => {
            // Ajuste conforme a estrutura da sua resposta da API
            const atletas = response.content
            const resultado = {
                atletas,
              total: response.totalElements
            };
            return resultado;
          })
          .catch(error => {
            console.error('Erro na requisição:', error);
            throw error; // Re-lance o erro para ser tratado em outro lugar
          }
      );
  }


    // Aqui recupera somente pessoas que não estão em inscricoes(tabela)
  atletaNotInInscricoes(filtro: Filters): Promise<any> {
    let params = filtro.params

    if (filtro.params) {
      filtro.params.keys().forEach(key => {
        params = params.set(key, filtro.params.get(key));
      });
    }

    return this.http
      .get<any>(this.apiPath + '/disponiveis-para-inscricao', { params }) // Use the declared params
      .toPromise()
      .then((response) => {
        // Ajuste conforme a estrutura da sua resposta da API
        const atletas = response.content
        const resultado = {
          atletas,
          total: response.totalElements
        };
        console.log('Resultado disponiveis-para-inscricao ', resultado)
        return resultado;
      })
      .catch(error => {
        console.error('Erro na requisição:', error);
        throw error; // Re-lance o erro para ser tratado em outro lugar
      }
    );
  }*/
}