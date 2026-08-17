import { HttpParams } from '@angular/common/http';
import { Injectable, Injector } from '@angular/core';
import { Observable } from 'rxjs';

import { EstabelecimentoIn } from '../../shared/models/estabelecimentoIn';
import { environment } from '../../../environments/environment';
import { EstabelecimentoOut } from '../../shared/models/estabelecimentoOut';
import { BaseResourceService } from '../../shared/services/base-resource.service';

export class EstabelecimentoFilters {

  pagina = 0;
  itensPorPagina = 40;
  totalRegistros = 0;

  id: number | null = null;
  nome = '';
  cpf: string | null = null;
  cnpj: string | null = null;

  params = new HttpParams();
}

@Injectable({
  providedIn: 'root',
})
export class EstabelecimentoService
  extends BaseResourceService<EstabelecimentoOut> {

  constructor(
    protected injector: Injector,
  ) {
    super(
      environment.apiUrl + 'estabelecimentos',
      injector,
      EstabelecimentoOut.fromJson,
    );
  }

  pesquisar(
    filtro: EstabelecimentoFilters,
  ): Promise<any> {

    const params = filtro.params;

    return this.http
      .get<any>(
        this.apiPath + '/filter',
        { params },
      )
      .toPromise()
      .then(response => {

        const estabelecimentos =
          response?.content ?? [];

        return {
          estabelecimentos,
          total: response?.totalElements ?? 0,
        };
      });
  }

  getEstabelecimentoById(
    id: number,
  ): Promise<EstabelecimentoOut> {

    return this.http
      .get<EstabelecimentoOut>(
        `${this.apiPath}/${id}`,
      )
      .toPromise()
      .then(response =>
        EstabelecimentoOut.fromJson(response),
      );
  }

  createEstabelecimento(
    estabelecimento: EstabelecimentoIn,
  ): Observable<EstabelecimentoOut> {

    const payload =
      EstabelecimentoIn.toJson(estabelecimento);

    return this.http.post<EstabelecimentoOut>(
      this.apiPath,
      payload,
    );
  }

  updateEstabelecimento(
    id: number,
    estabelecimento: EstabelecimentoIn,
  ): Observable<EstabelecimentoOut> {

    const payload =
      EstabelecimentoIn.toJson(estabelecimento);

    /*
     * O proprietário não pode ser transferido pelo update
     * normal do estabelecimento.
     */
    delete payload.pessoaId;

    return this.http.put<EstabelecimentoOut>(
      `${this.apiPath}/${id}`,
      payload,
    );
  }

  deleteEstabelecimento(
    id: number,
  ): Observable<void> {

    return this.http.delete<void>(
      `${this.apiPath}/${id}`,
    );
  }
}