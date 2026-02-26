import { Injectable, Injector, EventEmitter } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable, from } from 'rxjs';
import { map } from 'rxjs/operators';

import { BaseResourceService } from '../../shared/services/base-resource.service';
import { environment } from '../../../environments/environment';
import { Filters } from '../../shared/filters/filters';
import { Cep } from '../../shared/models/cep';


@Injectable({
  providedIn: 'root'
})

export class CepService extends BaseResourceService<Cep> {

  // cep por id.
  private cepEventHendlerId: EventEmitter<Cep>

  constructor(
    protected injector: Injector,
  ) {
    super(environment.apiUrl + 'ceps', injector, Cep.fromJson);
    this.cepEventHendlerId = new EventEmitter<Cep>();
  }

  pesquisar(filtro: Filters): Promise<any> {
    let params = filtro.params;

    return this.http
      .get<any>(this.apiPath + '/filter', { params })
      .toPromise()
      .then((response) => {
        const ceps = response.content;
        const resultado = {
          ceps,
          total: response.totalElements,
        };
        return resultado;
      });
  }

  listAll(): Promise<Cep[]> {
    return this.http
      .get<Cep[]>(this.apiPath)
      .toPromise();
  }

  getCepById(cepId): Promise<Cep> {
    return this.http.get<Cep>(this.apiPath + '/' + cepId)
      .toPromise();
  }

  create(cep: Cep): Observable<Cep> {

    return from(this.http
      .post<Cep>(this.apiPath, cep)
      .toPromise()
      .then(response => {
        // Lidar com a resposta da API
        console.log('Cep criado com sucesso:', response); // Log para verificar a resposta
        return response; // Retorna a resposta para o Observable
      }));
  }

  update(cep: Cep): Observable<Cep> {
    return this.http.put<Cep>(`${this.apiPath}/${cep.id}`, cep);
  }

  delete(id: number): Observable<any> {
    return from(this.http
      .delete<any>(`${this.apiPath}/${id}`)
      .toPromise()
      .then(response => {
        // Lidar com a resposta da API
        console.log('Cep deletado com sucesso:', response); // Log para verificar a resposta
        return response;
      }));
  }

  filtrarPorCep(cep: string): Observable<Cep[]> {
    const params = new HttpParams().set('cep', (cep ?? '').replace(/\D/g, ''));
    return this.http.get<any>(`${this.apiPath}/filter`, { params }).pipe(
      map((resp) => {
        const lista = Array.isArray(resp) ? resp : (resp?.content ?? []);
        return (lista ?? []).map((x: any) => Cep.fromJson(x));
      }),
    );
  }
}
