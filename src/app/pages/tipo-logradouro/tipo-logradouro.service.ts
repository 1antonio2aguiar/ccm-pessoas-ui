import { Injectable, Injector, EventEmitter } from '@angular/core';
import { Observable, from } from 'rxjs';
import { HttpParams } from '@angular/common/http';
import { map } from 'rxjs/operators';

import { environment } from '../../../environments/environment';
import { BaseResourceService } from '../../shared/services/base-resource.service';
import { TipoLogradouro } from '../../shared/models/tipoLogradouro';
import { FiltroPaginado } from '../../shared/filters/filtro-paginado';

@Injectable({
  providedIn: 'root'
})
export class TipoLogradouroService extends BaseResourceService<TipoLogradouro> {

  // Mantido por compatibilidade com o padrão do projeto (se você usar eventos no componente)
  private tipoLogradouroEventHendlerId: EventEmitter<TipoLogradouro>;

  constructor(protected injector: Injector) {
    // Ajuste o endpoint se o seu backend for diferente (ex: 'tipos-logradouros')
    super(environment.apiUrl + 'tipoLogradouro', injector, TipoLogradouro.fromJson);
    this.tipoLogradouroEventHendlerId = new EventEmitter<TipoLogradouro>();
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
        const tiposLogradouro = response.content;
        const resultado = { tiposLogradouro };
        return resultado;
      });
  }

  create(tipoLogradouro: TipoLogradouro): Observable<TipoLogradouro> {
    return from(this.http
      .post<TipoLogradouro>(this.apiPath, tipoLogradouro)
      .toPromise()
      .then(response => response));
  }

  update(tipoLogradouro: TipoLogradouro): Observable<TipoLogradouro> {
    return from(this.http
      .put<TipoLogradouro>(`${this.apiPath}/${tipoLogradouro.id}`, tipoLogradouro)
      .toPromise()
      .then(response => response));
  }

  delete(id: number): Observable<any> {
    return from(this.http
      .delete<any>(`${this.apiPath}/${id}`)
      .toPromise()
      .then(response => response));
  }

  filtrarPorDEscricao(descricao: string, page = 0, size = 10): Observable<TipoLogradouro[]> {
    const params = new HttpParams()
      .set('descricao', descricao ?? '')
      .set('page', String(page))
      .set('size', String(size));

    return this.http
      .get<any>(`${this.apiPath}/filter`, { params })
      .pipe(
        map((resp) => {
          const lista = Array.isArray(resp) ? resp : (resp?.content ?? []);
          return (lista ?? [])
            .filter((x: any) => x && typeof x === 'object')
            .map((x: any) => TipoLogradouro.fromJson(x));
        }),
      );
  }
}
