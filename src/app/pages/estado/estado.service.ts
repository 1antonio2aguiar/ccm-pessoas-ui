import { Injectable, Injector, EventEmitter } from '@angular/core';
import { Observable, from } from 'rxjs';
import { HttpParams } from '@angular/common/http';
import { map } from 'rxjs/operators';

import { environment } from '../../../environments/environment';
import { BaseResourceService } from '../../shared/services/base-resource.service';
import { Estado } from '../../shared/models/estado';
import { FiltroPaginado } from '../../shared/filters/filtro-paginado';
 
@Injectable({
  providedIn: 'root'
})

export class EstadoService extends BaseResourceService<Estado> {

  private estadoEventHendlerId: EventEmitter<Estado>;

  constructor(protected injector: Injector) {
    // Ajuste o endpoint se o seu backend for diferente (ex: 'estados')
    super(environment.apiUrl + 'estados', injector, Estado.fromJson);
    this.estadoEventHendlerId = new EventEmitter<Estado>();
  }

  pesquisar(filtro: FiltroPaginado): Promise<any> {
  let params = filtro.params;

  if (filtro.params) {
    filtro.params.keys().forEach(key => {
      params = params.set(key, filtro.params.get(key));
    });
  }

  return this.http
    .get<any>(this.apiPath + '/list', { params })
    .toPromise()
    .then((response) => {
      // Se vier paginado (Page): usa response.content
      // Se vier lista pura (array): usa o próprio response
      const estados = Array.isArray(response) ? response : response?.content;

      const resultado = { estados };
      return resultado;
    });
  }

  filtrarPorNome(nome: string, page = 0, size = 10): Observable<Estado[]> {

    const params = new HttpParams()
      .set('nome', nome ?? '')
      .set('page', String(page))
      .set('size', String(size));

      console.log('PARAMS ', params)

    return this.http
    .get<any>(`${this.apiPath}/list`, { params })
    .pipe(
      map((resp) => {
        const lista = Array.isArray(resp) ? resp : (resp?.content ?? []);
        return (lista ?? [])
          .filter((x: any) => x && typeof x === 'object')   // <<<<< evita undefined/null
          .map((x: any) => Estado.fromJson(x));
      })
    );
  }

  create(estado: Estado): Observable<Estado> {
    return from(this.http
      .post<Estado>(this.apiPath, estado)
      .toPromise()
      .then(response => response));
  }

  update(estado: Estado): Observable<Estado> {
    return from(this.http
      .put<Estado>(`${this.apiPath}/${estado.id}`, estado)
      .toPromise()
      .then(response => response));
  }

  delete(id: number): Observable<any> {
    return from(this.http
      .delete<any>(`${this.apiPath}/${id}`)
      .toPromise()
      .then(response => response));
  }
} 
