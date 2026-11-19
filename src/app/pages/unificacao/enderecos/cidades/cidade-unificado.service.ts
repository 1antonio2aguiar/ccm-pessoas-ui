import { Injectable, Injector } from '@angular/core';
import { HttpParams } from '@angular/common/http';

import { environment } from '../../../../../environments/environment';
import { BaseResourceService } from '../../../../shared/services/base-resource.service';

export type SituacaoCidade =
  | 'UNICA'
  | 'DUPLICADA'
  | 'AMBIGUA'
  | 'SEM_CORRESPONDENCIA';

export interface OrigemCidadeDTO {
  codigo: string;
  descricao: string;
}

export interface CidadeOrigemDTO {
  origem: string;
  cidadeOrigem: number;
  nome: string;
  uf: string;
  cep: number | null;
  ddd: string | null;
  codigoIbge: number | null;
  qtdCandidatos: number;
  situacao: SituacaoCidade;
  idSugerido: number | null;
  nomeSugerido: string | null;
  cidadeCorreiosSugerida: number | null;
}

export interface CidadeCandidatoDTO {
  id: number;
  cidadeCorreios: number | null;
  nome: string;
  uf: string;
  cep: number | null;
  codigoIbge: number | null;
  codigoOrigemAtual: number | null;
  statusCor: string | null;
  criterio: 'NOME' | 'IBGE' | 'PESQUISA';
}

export interface CidadeUnificadoResumoDTO {
  origem: string;
  descricao: string;
  totalOrigem: number;
  totalVinculadas: number;
  totalDuplicadasRegistradas: number;
  totalNaoVincular: number;
  totalPendentes: number;
  totalUnicas: number;
  totalDuplicadas: number;
  totalAmbiguas: number;
  totalSemCorrespondencia: number;
}

export interface CidadeUnificadoLoteDTO {
  totalAnalisados: number;
  totalVinculados: number;
  totalDuplicados: number;
  totalErros: number;
  erros: string[];
}

export interface CidadeBaseCorreiosResumoDTO {
  totalCorreios: number;
  totalCorreiosFicticias: number;
  totalUnificado: number;
  totalFaltando: number;
  permiteZerar: boolean;
}

export interface CidadeBaseCorreiosResultadoDTO {
  unificadoApagadas: number;
  controleApagados: number;
  ficticiasApagadas: number;
  cidadesInseridas: number;
  mensagem: string;
}

export class CidadeUnificadoFilters {
  pagina = 0;
  itensPorPagina = 10;
  totalRegistros = 0;

  /*
   * Quantidade de registros trazidos do backend por consulta.
   * A paginação da tabela é local sobre esse bloco.
   */
  tamanhoConsulta = 200;

  params = new HttpParams();
}

@Injectable({ providedIn: 'root' })
export class CidadeUnificadoService extends BaseResourceService<any> {

  private listaApiPath = environment.apiUrl + 'cidades-unificado';

  constructor(protected injector: Injector) {
    super(environment.apiUrl + 'cidades-unificado', injector, (json) => json);
  }

  /*
   * Base dos Correios
   */
  buscarResumoBaseCorreios(): Promise<CidadeBaseCorreiosResumoDTO> {
    return this.http
      .get<CidadeBaseCorreiosResumoDTO>(`${this.listaApiPath}/base-correios/resumo`)
      .toPromise();
  }

  gerarBaseCorreios(): Promise<CidadeBaseCorreiosResultadoDTO> {
    return this.http
      .post<CidadeBaseCorreiosResultadoDTO>(
        `${this.listaApiPath}/base-correios/gerar`,
        {}
      )
      .toPromise();
  }

  zerarBaseCorreios(
    confirmacao: string,
    apagarFicticias: boolean
  ): Promise<CidadeBaseCorreiosResultadoDTO> {

    const params = new HttpParams()
      .set('confirmacao', confirmacao)
      .set('apagarFicticias', String(apagarFicticias));

    return this.http
      .post<CidadeBaseCorreiosResultadoDTO>(
        `${this.listaApiPath}/base-correios/zerar`,
        {},
        { params }
      )
      .toPromise();
  }

  /*
   * Unificação por origem
   */
  listarOrigens(): Promise<OrigemCidadeDTO[]> {
    return this.http
      .get<OrigemCidadeDTO[]>(`${this.listaApiPath}/origens`)
      .toPromise();
  }

  pesquisarPendentes(
    origem: string,
    params: HttpParams
  ): Promise<{ cidades: CidadeOrigemDTO[]; total: number }> {

    return this.http
      .get<any>(`${this.listaApiPath}/${origem}/pendentes`, { params })
      .toPromise()
      .then((response) => {
        const cidades = Array.isArray(response) ? response : (response?.content ?? []);
        const total = Array.isArray(response) ? cidades.length : (response?.totalElements ?? 0);

        return { cidades, total };
      });
  }

  buscarResumo(origem: string): Promise<CidadeUnificadoResumoDTO> {
    return this.http
      .get<CidadeUnificadoResumoDTO>(`${this.listaApiPath}/${origem}/resumo`)
      .toPromise();
  }

  buscarCandidatos(
    origem: string,
    cidade: number,
    pesquisa?: string,
    uf?: string
  ): Promise<CidadeCandidatoDTO[]> {

    let params = new HttpParams();

    if (pesquisa && pesquisa.trim()) {
      params = params.set('pesquisa', pesquisa.trim());
    }

    if (uf && uf.trim()) {
      params = params.set('uf', uf.trim().toUpperCase());
    }

    return this.http
      .get<CidadeCandidatoDTO[]>(
        `${this.listaApiPath}/${origem}/candidatos/${cidade}`,
        { params }
      )
      .toPromise();
  }

  vincular(
    origem: string,
    cidade: number,
    idUnificado: number
  ): Promise<string> {

    const params = new HttpParams()
      .set('idUnificado', String(idUnificado));

    return this.http
      .post(
        `${this.listaApiPath}/${origem}/vincular/${cidade}`,
        {},
        { params, responseType: 'text' }
      )
      .toPromise();
  }

  vincularUnicas(origem: string): Promise<CidadeUnificadoLoteDTO> {
    return this.http
      .post<CidadeUnificadoLoteDTO>(
        `${this.listaApiPath}/${origem}/vincular-unicas`,
        {}
      )
      .toPromise();
  }

  criar(origem: string, cidade: number): Promise<string> {
    return this.http
      .post(
        `${this.listaApiPath}/${origem}/criar/${cidade}`,
        {},
        { responseType: 'text' }
      )
      .toPromise();
  }

  naoVincular(
    origem: string,
    cidade: number,
    motivo?: string
  ): Promise<string> {

    let params = new HttpParams();

    if (motivo && motivo.trim()) {
      params = params.set('motivo', motivo.trim());
    }

    return this.http
      .post(
        `${this.listaApiPath}/${origem}/nao-vincular/${cidade}`,
        {},
        { params, responseType: 'text' }
      )
      .toPromise();
  }
}
