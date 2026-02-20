import { Injectable, Injector, EventEmitter } from '@angular/core';
import { Observable, from } from 'rxjs';

import { environment } from '../../../environments/environment';
import { BaseResourceService } from '../../shared/services/base-resource.service';
import { Pais } from '../../shared/models/pais';
import { Filters } from '../../shared/filters/filters';

@Injectable({
  providedIn: 'root'
})

export class PaisService extends BaseResourceService<Pais> {

  // Mantido por compatibilidade com o padrão do projeto (se você usar eventos no componente)
  private paisEventHendlerId: EventEmitter<Pais>;

  constructor(protected injector: Injector) {
    super(environment.apiUrl + 'paises', injector, Pais.fromJson);
    this.paisEventHendlerId = new EventEmitter<Pais>();
  }

  pesquisar(filtro: Filters): Promise<any> {
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
        const paises = response.content;
        const resultado = { paises };
        return resultado;
      });
  }

  create(pais: Pais): Observable<Pais> {
    return from(this.http
      .post<Pais>(this.apiPath, pais)
      .toPromise()
      .then(response => response));
  }

  update(pais: Pais): Observable<Pais> {
    return from(this.http
      .put<Pais>(`${this.apiPath}/${pais.id}`, pais)
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
