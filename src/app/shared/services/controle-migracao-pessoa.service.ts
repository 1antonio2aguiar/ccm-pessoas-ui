import { Injectable } from '@angular/core';
import {
  HttpClient,
  HttpParams,
} from '@angular/common/http';

import {
  environment,
} from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ControleMigracaoPessoaService {

  private readonly apiPath =
    environment.apiUrl +
    'controle-migracao-pessoa';

  constructor(
    private http: HttpClient
  ) {}

  registrarNaoMigrar(
    banco: 'PESSOAS' | 'RH' | 'SANE',
    cdOrigem: number
  ): Promise<string> {

    const params =
      new HttpParams()
        .set(
          'banco',
          banco
        )
        .set(
          'cdOrigem',
          String(cdOrigem)
        );

    return this.http
      .post(
        `${this.apiPath}/nao-migrar`,
        {},
        {
          params,
          responseType: 'text',
        }
      )
      .toPromise();
  }
}