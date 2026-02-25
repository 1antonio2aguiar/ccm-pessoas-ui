import { Injectable, Injector, EventEmitter } from '@angular/core';
import { Observable, from } from 'rxjs';
import { environment } from '../../../environments/environment';
import { HttpParams } from '@angular/common/http';
import { map } from 'rxjs/operators';
import { BaseResourceService } from '../../shared/services/base-resource.service';

import { Cidade } from '../../shared/models/cidade';
import { FiltroPaginado } from '../../shared/filters/filtro-paginado';

@Injectable({ providedIn: 'root' })
export class CidadeService extends BaseResourceService<Cidade> {

  private cidadeEventHendlerId: EventEmitter<Cidade>;

  constructor(protected injector: Injector) {
    super(environment.apiUrl + 'cidades', injector, Cidade.fromJson);
    this.cidadeEventHendlerId = new EventEmitter<Cidade>();
  }

  pesquisar(filtro: FiltroPaginado): Promise<any> {
    let params = filtro.params;

    if (filtro.params) {
      filtro.params.keys().forEach(key => {
        params = params.set(key, filtro.params.get(key));
      });
    }

    return this.http
      .get<any>(this.apiPath + '/filter', { params })
      .toPromise()
      .then((response) => {
        // Se vier paginado (Page): usa response.content
        // Se vier lista pura (array): usa o próprio response
        const cidades = Array.isArray(response) ? response : response?.content;
        //console.log('Resultado ', cidades)
        const resultado = { cidades };
        return resultado;
      });
  }

  create(cidade: Cidade): Observable<Cidade> {
    return this.http.post<Cidade>(this.apiPath, cidade);
  }

  update(cidade: Cidade): Observable<Cidade> {
    return from(this.http
      .put<Cidade>(`${this.apiPath}/${cidade.id}`, cidade)
      .toPromise()
      .then(response => response));
  }

  delete(id: number): Observable<any> {
    return from(this.http
      .delete<any>(`${this.apiPath}/${id}`)
      .toPromise()
      .then(response => response));
  }

  filtrarPorNome(nome: string, page = 0, size = 10): Observable<Cidade[]> {
      const params = new HttpParams()
        .set('nome', nome ?? '')
        .set('page', String(page))
        .set('size', String(size));
  
      return this.http
        .get<any>(`${this.apiPath}/filter`, { params })
        .pipe(
          map((resp) => {
            const lista = Array.isArray(resp) ? resp : (resp?.content ?? []);
            return (lista ?? [])
              .filter((x: any) => x && typeof x === 'object')
              .map((x: any) => Cidade.fromJson(x));
          }),
        );
    }
}
