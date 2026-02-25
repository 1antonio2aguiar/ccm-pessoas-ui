import { Injectable, Injector, EventEmitter } from '@angular/core';
import { Observable, from } from 'rxjs';

import { environment } from '../../../environments/environment';
import { BaseResourceService } from '../../shared/services/base-resource.service';
import { FiltroPaginado } from '../../shared/filters/filtro-paginado';
import { Logradouro } from '../../shared/models/logradouro';

@Injectable({ providedIn: 'root' })
export class LogradouroService extends BaseResourceService<Logradouro> {

  private logradouroEventHendlerId: EventEmitter<Logradouro>;

  constructor(protected injector: Injector) {
    // Ajuste o endpoint se seu backend usar outro (ex.: 'logradouros')
    super(environment.apiUrl + 'logradouros', injector, Logradouro.fromJson);
    this.logradouroEventHendlerId = new EventEmitter<Logradouro>();
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
        const logradouros = Array.isArray(response) ? response : response?.content;
        return { logradouros };
      });
  }

  create(logradouro: Logradouro): Observable<Logradouro> {
    return this.http.post<Logradouro>(this.apiPath, logradouro);
  }

  update(logradouro: Logradouro): Observable<Logradouro> {
    return from(this.http
      .put<Logradouro>(`${this.apiPath}/${logradouro.id}`, logradouro)
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
