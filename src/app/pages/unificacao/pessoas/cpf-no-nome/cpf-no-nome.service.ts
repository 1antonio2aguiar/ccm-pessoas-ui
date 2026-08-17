import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';

import { environment } from '../../../../../environments/environment';

export class CpfNoNomeFilters {
  pagina = 0;
  itensPorPagina = 1000;
  totalRegistros = 0;
  params = new HttpParams();
} 

@Injectable({
  providedIn: 'root',
})

export class CpfNoNomeService {

  private readonly apiUrl = environment.apiUrl + 'pes-pessoas/cpf-no-nome';

  constructor(private http: HttpClient) {
  }

  pesquisar(filtro: CpfNoNomeFilters): Promise<any> {
    const params = filtro.params || new HttpParams();

    return this.http.get<any>(this.apiUrl, { params })
      .toPromise()
      .then(response => {
        const registros = Array.isArray(response) ? response : (response?.content ?? []);
        const total = Array.isArray(response) ? registros.length : (response?.totalElements ?? 0);

        return { registros, total };
      });
  }
}
