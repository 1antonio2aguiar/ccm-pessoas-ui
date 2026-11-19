import { Injectable, Injector } from '@angular/core';

import { environment } from '../../../../../environments/environment';
import { BaseResourceService } from '../../../../shared/services/base-resource.service';

export interface NivelConsolidacaoDTO {
  codigo: string;
  descricao: string;
  tabela: string;
}

export interface ConsolidacaoResumoDTO {
  nivel: string;
  descricao: string;
  tabela: string;
  totalUnificado: number;
  totalConsolidado: number;
  totalFaltando: number;
  totalSoConsolidado: number;
}

export interface ConsolidacaoResultadoDTO {
  nivel: string;
  descricao: string;
  inseridos: number;
  completados: number;
  sucesso: boolean;
  mensagem: string;
}

@Injectable({ providedIn: 'root' })
export class ConsolidacaoEnderecosService extends BaseResourceService<any> {

  private listaApiPath = environment.apiUrl + 'consolidacao-enderecos';

  constructor(protected injector: Injector) {
    super(environment.apiUrl + 'consolidacao-enderecos', injector, (json) => json);
  }

  listarNiveis(): Promise<NivelConsolidacaoDTO[]> {
    return this.http
      .get<NivelConsolidacaoDTO[]>(`${this.listaApiPath}/niveis`)
      .toPromise();
  }

  buscarResumo(nivel: string): Promise<ConsolidacaoResumoDTO> {
    return this.http
      .get<ConsolidacaoResumoDTO>(`${this.listaApiPath}/${nivel}/resumo`)
      .toPromise();
  }

  executar(nivel: string): Promise<ConsolidacaoResultadoDTO> {
    return this.http
      .post<ConsolidacaoResultadoDTO>(`${this.listaApiPath}/${nivel}/executar`, {})
      .toPromise();
  }

  executarTodos(): Promise<ConsolidacaoResultadoDTO[]> {
    return this.http
      .post<ConsolidacaoResultadoDTO[]>(`${this.listaApiPath}/executar-todos`, {})
      .toPromise();
  }
}
