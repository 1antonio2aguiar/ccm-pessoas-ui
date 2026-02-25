import { Injectable, Injector, EventEmitter } from '@angular/core';
import { Observable, from } from 'rxjs';

import { environment } from '../../../environments/environment';
import { BaseResourceService } from '../../shared/services/base-resource.service';
import { TipoPessoa } from '../../shared/models/tipoPessoa';
import { FiltroPaginado } from '../../shared/filters/filtro-paginado';

@Injectable({
  providedIn: 'root'
})
export class TipoPessoaService extends BaseResourceService<TipoPessoa> {

  private tipoPessoaEventHendlerId: EventEmitter<TipoPessoa>;

  constructor(protected injector: Injector) {
    // Ajuste o endpoint se o seu backend for diferente (ex: 'tipos-pessoas')
    super(environment.apiUrl + 'tipos-pessoas', injector, TipoPessoa.fromJson);
    this.tipoPessoaEventHendlerId = new EventEmitter<TipoPessoa>();
  }

  pesquisar(filtro: FiltroPaginado): Promise<any> {
  // seu backend IGNORA params, mas vou manter para não quebrar chamadas
  return this.http
    .get<TipoPessoa[]>(this.apiPath, { params: filtro.params })
    .toPromise()
    .then((lista) => {
      // como backend retorna array direto
      const tiposPessoas = lista ?? [];
      return { tiposPessoas };
    });
  }


  create(tipoPessoa: TipoPessoa): Observable<TipoPessoa> {
    return from(this.http
      .post<TipoPessoa>(this.apiPath, tipoPessoa)
      .toPromise()
      .then(response => response));
  }

  update(tipoPessoa: TipoPessoa): Observable<TipoPessoa> {
    return from(this.http
      .put<TipoPessoa>(`${this.apiPath}/${tipoPessoa.id}`, tipoPessoa)
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
