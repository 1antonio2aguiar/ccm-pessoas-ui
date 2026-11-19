import { Injectable, Injector } from '@angular/core';

import { environment } from '../../../../../environments/environment';
import { BaseResourceService } from '../../../../shared/services/base-resource.service';

export interface NivelCargaFinalDTO {
  codigo: string;
  descricao: string;
}

export interface CargaFinalResumoDTO {
  nivel: string;
  descricao: string;
  totalConsolidado: number;
  comCodigo: number;
  pendentes: number;
  bloqueados: number;
  faltandoCcEnderecos: number;
  faltandoCcmPessoas: number;
}

export interface CargaFinalResultadoDTO {
  nivel: string;
  descricao: string;
  codigosNovos: number;
  codigosReaproveitados: number;
  inseridosCcEnderecos: number;
  inseridosCcmPessoas: number;
  sucesso: boolean;
  mensagem: string;
}

@Injectable({ providedIn: 'root' })
export class CargaFinalEnderecosService extends BaseResourceService<any> {

  private listaApiPath = environment.apiUrl + 'carga-final-enderecos';

  constructor(protected injector: Injector) {
    super(environment.apiUrl + 'carga-final-enderecos', injector, (json) => json);
  }

  listarNiveis(): Promise<NivelCargaFinalDTO[]> {
    return this.http
      .get<NivelCargaFinalDTO[]>(`${this.listaApiPath}/niveis`)
      .toPromise();
  }

  buscarResumo(nivel: string): Promise<CargaFinalResumoDTO> {
    return this.http
      .get<CargaFinalResumoDTO>(`${this.listaApiPath}/${nivel}/resumo`)
      .toPromise();
  }

  executar(nivel: string): Promise<CargaFinalResultadoDTO> {
    return this.http
      .post<CargaFinalResultadoDTO>(`${this.listaApiPath}/${nivel}/executar`, {})
      .toPromise();
  }

  executarTodos(): Promise<CargaFinalResultadoDTO[]> {
    return this.http
      .post<CargaFinalResultadoDTO[]>(`${this.listaApiPath}/executar-todos`, {})
      .toPromise();
  }
}
