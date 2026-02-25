import { Injectable, Injector, EventEmitter } from '@angular/core';
import { Observable, from } from 'rxjs';
import { HttpParams } from '@angular/common/http';
import { map } from 'rxjs/operators';


import { environment } from '../../../environments/environment';
import { BaseResourceService } from '../../shared/services/base-resource.service';
import { FiltroPaginado } from '../../shared/filters/filtro-paginado';
import { Distrito } from '../../shared/models/distrito';

@Injectable({ providedIn: 'root' })
export class DistritoService extends BaseResourceService<Distrito> {

  private distritoEventHendlerId: EventEmitter<Distrito>;

  constructor(protected injector: Injector) {
    super(environment.apiUrl + 'distritos', injector, Distrito.fromJson);
    this.distritoEventHendlerId = new EventEmitter<Distrito>();
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
        const distritos = Array.isArray(response) ? response : response?.content;
        return { distritos };
      });
  }

  create(distrito: Distrito): Observable<Distrito> {
    return this.http.post<Distrito>(this.apiPath, distrito);
  }

  update(distrito: Distrito): Observable<Distrito> {
    return from(this.http
      .put<Distrito>(`${this.apiPath}/${distrito.id}`, distrito)
      .toPromise()
      .then(response => response));
  }

  delete(id: number): Observable<any> {
    return from(this.http
      .delete<any>(`${this.apiPath}/${id}`)
      .toPromise()
      .then(response => response));
  }

  /**
   * Autocomplete: usuário digita o NOME DA CIDADE,
   * e o backend retorna os distritos daquela cidade.
   *
   * Ex: /distritos/filter?cidadeNome=ubera
   */
  filtrarPorCidadeNome(cidadeNome: string, page = 0, size = 10): Observable<Distrito[]> {
    const params = new HttpParams()
      .set('cidadeNome', cidadeNome ?? '')
      .set('page', String(page))
      .set('size', String(size));

    return this.http
      .get<any>(`${this.apiPath}/filter`, { params })
      .pipe(
        map((resp) => {
          const lista = Array.isArray(resp) ? resp : (resp?.content ?? []);
          return (lista ?? [])
            .filter((x: any) => x && typeof x === 'object')
            .map((x: any) => Distrito.fromJson(x));
        }),
      );
  }
}
