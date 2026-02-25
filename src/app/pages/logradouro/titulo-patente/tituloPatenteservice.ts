import { Injectable, Injector } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { environment } from '../../../../environments/environment';
import { BaseResourceService } from '../../../shared/services/base-resource.service';
import { TituloPatente } from '../../../shared/models/tituloPatente';

@Injectable({ providedIn: 'root' })
export class TituloPatenteService extends BaseResourceService<TituloPatente> {

  constructor(protected injector: Injector) {
    super(environment.apiUrl + 'titulo-patentes', injector, TituloPatente.fromJson);
  }

  /**
   * Autocomplete de TituloPatente
   */
  filtrarPorDescricao(tituloPatente: string, page = 0, size = 10): Observable<TituloPatente[]> {
    const params = new HttpParams()
      .set('descricao', tituloPatente ?? '')
      .set('page', String(page))
      .set('size', String(size));

    return this.http
      .get<any>(`${this.apiPath}/listar`, { params })
      .pipe(
        map((resp) => {
          const lista = Array.isArray(resp) ? resp : (resp?.content ?? []);
          console.log('Retorno lista ', lista)
          return (lista ?? [])
            .filter((x: any) => x && typeof x === 'object')
            .map((x: any) => TituloPatente.fromJson(x));
        }),
      );
  }
}
