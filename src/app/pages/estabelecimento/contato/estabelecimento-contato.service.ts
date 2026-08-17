import { HttpParams } from '@angular/common/http';
import { Injectable, Injector } from '@angular/core';
import { Observable } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { environment } from '../../../../environments/environment';
import { ContatoIn } from '../../../shared/models/contatoIn';
import { ContatoOut } from '../../../shared/models/contatoOut';
import { BaseResourceService } from '../../../shared/services/base-resource.service';

@Injectable({
  providedIn: 'root',
})
export class EstabelecimentoContatoService
  extends BaseResourceService<ContatoOut> {

  constructor(protected injector: Injector) {
    super(
      environment.apiUrl + 'contatos',
      injector,
      ContatoOut.fromJson,
    );
  }

  getContatoByEstabelecimentoId(
    estabelecimentoId: number,
  ): Observable<ContatoOut[]> {
    const url = `${this.apiPath}/por-estabelecimento/${estabelecimentoId}`;

    return this.http.get<any[]>(url).pipe(
      map(response =>
        (response ?? []).map(item => this.jsonDataToResource(item)),
      ),
      catchError(this.handleError),
    );
  }

  create(contato: ContatoIn): Observable<ContatoOut> {
    return this.http.post<ContatoOut>(this.apiPath, contato).pipe(
      map(response => this.jsonDataToResource(response)),
      catchError(this.handleError),
    );
  }

  update(contato: ContatoIn): Observable<ContatoOut> {
    if (contato.id == null) {
      throw new Error('ID do contato é necessário para atualização.');
    }

    const url = `${this.apiPath}/${contato.id}`;

    return this.http.put<ContatoOut>(url, contato).pipe(
      map(response => this.jsonDataToResource(response)),
      catchError(this.handleError),
    );
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiPath}/${id}`).pipe(
      catchError(this.handleError),
    );
  }

  definirComoPrincipal(
    contatoId: number,
    pessoaId: number,
  ): Observable<void> {
    const url = `${this.apiPath}/${contatoId}/definir-como-principal`;
    const params = new HttpParams().set('pessoaId', pessoaId.toString());

    return this.http.put<void>(url, null, { params }).pipe(
      catchError(this.handleError),
    );
  }
}
