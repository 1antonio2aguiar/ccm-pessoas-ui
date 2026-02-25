import { Injectable, Injector, EventEmitter } from '@angular/core';
import { Observable, from } from 'rxjs';

import { environment } from '../../../environments/environment';
import { BaseResourceService } from '../../shared/services/base-resource.service';
import { FiltroPaginado } from '../../shared/filters/filtro-paginado';
import { Bairro } from '../../shared/models/bairro';

@Injectable({ providedIn: 'root' })
export class BairroService extends BaseResourceService<Bairro> {

  private bairroEventHendlerId: EventEmitter<Bairro>;

  constructor(protected injector: Injector) {
    super(environment.apiUrl + 'bairros', injector, Bairro.fromJson);
    this.bairroEventHendlerId = new EventEmitter<Bairro>();
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
        const bairros = Array.isArray(response) ? response : response?.content;
        console.log('Resultado ', bairros)
        return { bairros };
      });
  }

  create(bairro: Bairro): Observable<Bairro> {
    return this.http.post<Bairro>(this.apiPath, bairro);
  }

  update(bairro: Bairro): Observable<Bairro> {
    return from(this.http
      .put<Bairro>(`${this.apiPath}/${bairro.id}`, bairro)
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
