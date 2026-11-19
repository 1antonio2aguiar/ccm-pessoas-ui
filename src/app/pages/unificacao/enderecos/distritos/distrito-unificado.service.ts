import { Injectable, Injector } from '@angular/core';
import { HttpParams } from '@angular/common/http';

import { environment } from '../../../../../environments/environment';
import { BaseResourceService } from '../../../../shared/services/base-resource.service';

export type SituacaoDistrito =
  | 'CIDADE_NAO_UNIFICADA'
  | 'UNICA'
  | 'DUPLICADA'
  | 'AMBIGUA'
  | 'SEM_CORRESPONDENCIA';

export interface OrigemDistritoDTO {
  codigo: string;
  descricao: string;
}

export interface DistritoOrigemDTO {
  origem: string;
  cidadeOrigem: number;
  distritoOrigem: number;
  nome: string;
  uf: string;
  nomeCidade: string | null;
  cidadeCorreios: number | null;
  qtdCandidatos: number;
  situacao: SituacaoDistrito;
  idSugerido: number | null;
  nomeSugerido: string | null;
  distritoCorreiosSugerido: number | null;
}

export interface DistritoCandidatoDTO {
  id: number;
  cidadeCorreios: number;
  distritoCorreios: number;
  nome: string;
  uf: string;
  cep: number | null;
  codigoOrigemAtual: number | null;
  statusCor: string | null;
  criterio: 'NOME' | 'PESQUISA' | 'CIDADE';
}

export interface DistritoUnificadoResumoDTO {
  origem: string;
  descricao: string;
  totalOrigem: number;
  totalVinculados: number;
  totalDuplicadosRegistrados: number;
  totalNaoVincular: number;
  totalPendentes: number;
  totalCidadeNaoUnificada: number;
  totalUnicos: number;
  totalDuplicados: number;
  totalAmbiguos: number;
  totalSemCorrespondencia: number;
}

export interface DistritoUnificadoLoteDTO {
  totalAnalisados: number;
  totalVinculados: number;
  totalDuplicados: number;
  totalErros: number;
  erros: string[];
}

export interface DistritoBaseCorreiosResumoDTO {
  totalCorreios: number;
  totalCorreiosFicticios: number;
  totalUnificado: number;
  totalFaltando: number;
  permiteZerar: boolean;
}

export interface DistritoBaseCorreiosResultadoDTO {
  unificadoApagados: number;
  controleApagados: number;
  distritosInseridos: number;
  mensagem: string;
}

export class DistritoUnificadoFilters {
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
export class DistritoUnificadoService extends BaseResourceService<any> {

  private listaApiPath = environment.apiUrl + 'distritos-unificado';

  constructor(protected injector: Injector) {
    super(environment.apiUrl + 'distritos-unificado', injector, (json) => json);
  }

  /*
   * Base dos Correios
   */
  buscarResumoBaseCorreios(): Promise<DistritoBaseCorreiosResumoDTO> {
    return this.http
      .get<DistritoBaseCorreiosResumoDTO>(`${this.listaApiPath}/base-correios/resumo`)
      .toPromise();
  }

  gerarBaseCorreios(): Promise<DistritoBaseCorreiosResultadoDTO> {
    return this.http
      .post<DistritoBaseCorreiosResultadoDTO>(`${this.listaApiPath}/base-correios/gerar`, {})
      .toPromise();
  }

  zerarBaseCorreios(confirmacao: string): Promise<DistritoBaseCorreiosResultadoDTO> {

    const params = new HttpParams().set('confirmacao', confirmacao);

    return this.http
      .post<DistritoBaseCorreiosResultadoDTO>(
        `${this.listaApiPath}/base-correios/zerar`,
        {},
        { params }
      )
      .toPromise();
  }

  /*
   * Unificação por origem
   */
  listarOrigens(): Promise<OrigemDistritoDTO[]> {
    return this.http
      .get<OrigemDistritoDTO[]>(`${this.listaApiPath}/origens`)
      .toPromise();
  }

  pesquisarPendentes(
    origem: string,
    params: HttpParams
  ): Promise<{ distritos: DistritoOrigemDTO[]; total: number }> {

    return this.http
      .get<any>(`${this.listaApiPath}/${origem}/pendentes`, { params })
      .toPromise()
      .then((response) => {
        const distritos = Array.isArray(response) ? response : (response?.content ?? []);
        const total = Array.isArray(response) ? distritos.length : (response?.totalElements ?? 0);

        return { distritos, total };
      });
  }

  buscarResumo(origem: string): Promise<DistritoUnificadoResumoDTO> {
    return this.http
      .get<DistritoUnificadoResumoDTO>(`${this.listaApiPath}/${origem}/resumo`)
      .toPromise();
  }

  buscarCandidatos(
    origem: string,
    cidade: number,
    distrito: number,
    pesquisa?: string,
    todos = false
  ): Promise<DistritoCandidatoDTO[]> {

    let params = new HttpParams();

    if (pesquisa && pesquisa.trim()) {
      params = params.set('pesquisa', pesquisa.trim());
    }

    if (todos) {
      params = params.set('todos', 'true');
    }

    return this.http
      .get<DistritoCandidatoDTO[]>(
        `${this.listaApiPath}/${origem}/candidatos/${cidade}/${distrito}`,
        { params }
      )
      .toPromise();
  }

  vincular(
    origem: string,
    cidade: number,
    distrito: number,
    idUnificado: number
  ): Promise<string> {

    const params = new HttpParams().set('idUnificado', String(idUnificado));

    return this.http
      .post(
        `${this.listaApiPath}/${origem}/vincular/${cidade}/${distrito}`,
        {},
        { params, responseType: 'text' }
      )
      .toPromise();
  }

  vincularUnicos(origem: string): Promise<DistritoUnificadoLoteDTO> {
    return this.http
      .post<DistritoUnificadoLoteDTO>(`${this.listaApiPath}/${origem}/vincular-unicos`, {})
      .toPromise();
  }

  criar(origem: string, cidade: number, distrito: number): Promise<string> {
    return this.http
      .post(
        `${this.listaApiPath}/${origem}/criar/${cidade}/${distrito}`,
        {},
        { responseType: 'text' }
      )
      .toPromise();
  }

  naoVincular(
    origem: string,
    cidade: number,
    distrito: number,
    motivo?: string
  ): Promise<string> {

    let params = new HttpParams();

    if (motivo && motivo.trim()) {
      params = params.set('motivo', motivo.trim());
    }

    return this.http
      .post(
        `${this.listaApiPath}/${origem}/nao-vincular/${cidade}/${distrito}`,
        {},
        { params, responseType: 'text' }
      )
      .toPromise();
  }
}
