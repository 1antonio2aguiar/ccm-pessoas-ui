import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { environment } from '../../../environments/environment';

export interface CadUnicoDashboardResumo {
  totalPessoasUnificadas: number;
  totalVinculos: number;
  totalOrigemPessoas: number;
  totalOrigemRh: number;
  totalCpf: number;
  totalCnpj: number;
  totalSemEndereco: number;
  totalComMaisDeUmaOrigem: number;
}

@Injectable({
  providedIn: 'root',
})
export class CadUnicoDashboardService {

  private apiPath = environment.apiUrl + 'cad-unico-dashboard';

  constructor(private http: HttpClient) {}

  buscarResumo(): Promise<CadUnicoDashboardResumo> {
    return this.http
      .get<CadUnicoDashboardResumo>(`${this.apiPath}/resumo`)
      .toPromise();
  }
}