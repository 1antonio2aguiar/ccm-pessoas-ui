import { Injectable, Injector } from '@angular/core';
import { HttpParams } from '@angular/common/http';

import { environment } from '../../../../../environments/environment';
import { BaseResourceService } from '../../../../shared/services/base-resource.service';

export type SituacaoLogradouro =
  | 'DISTRITO_NAO_UNIFICADO'
  | 'UNICA'
  | 'FAIXAS'
  | 'DUPLICADA'
  | 'TIPO_DIFERENTE'
  | 'AMBIGUA'
  | 'SEM_CORRESPONDENCIA';

export interface OrigemLogradouroDTO {
  codigo: string;
  descricao: string;
}

export interface LogradouroOrigemDTO {
  origem: string;
  cidadeOrigem: number;
  distritoOrigem: number;
  logradouroOrigem: number;
  tipo: string | null;
  nome: string;
  uf: string;
  nomeCidade: string | null;
  cidadeCorreios: number | null;
  distritoCorreios: number | null;
  qtdCandidatos: number;
  situacao: SituacaoLogradouro;
  idSugerido: number | null;
  nomeSugerido: string | null;
  logradouroCorreiosSugerido: number | null;
  complementoSugerido: string | null;
}

export interface LogradouroCandidatoDTO {
  id: number;
  cidadeCorreios: number;
  distritoCorreios: number;
  logradouroCorreios: number;
  tipo: string | null;
  nome: string;
  complemento: string | null;
  nomeBairro: string | null;
  faixa: boolean;
  codigoOrigemAtual: number | null;
  statusCor: string | null;
  criterio: 'NOME' | 'TIPO_DIFERENTE' | 'PESQUISA' | 'DISTRITO';
}

/*
 * CEP válido da tabela de CEPs dos Correios, oferecido para o logradouro novo.
 */
export interface LogradouroCepDTO {
  cep: number;
  distrito: number;
  logradouro: number;
  nomeLogradouro: string | null;
  bairro: number | null;
  nomeBairro: string | null;
  numeroIni: number | null;
  numeroFim: number | null;
  complemento: string | null;
}

export interface LogradouroUnificadoResumoDTO {
  origem: string;
  descricao: string;
  totalOrigem: number;
  totalVinculados: number;
  totalDuplicadosRegistrados: number;
  totalNaoVincular: number;
  totalPendentes: number;
  totalDistritoNaoUnificado: number;
  totalUnicos: number;
  totalFaixas: number;
  totalDuplicados: number;
  totalTipoDiferente: number;
  totalAmbiguos: number;
  totalSemCorrespondencia: number;
}

export interface LogradouroUnificadoLoteDTO {
  totalAnalisados: number;
  totalVinculados: number;
  totalDuplicados: number;
  totalErros: number;
  erros: string[];
}

export interface LogradouroBaseCorreiosResumoDTO {
  totalCorreios: number;
  totalCorreiosFicticios: number;
  totalUnificado: number;
  totalFaltando: number;
  totalSemChave: number;
  permiteZerar: boolean;
}

export interface LogradouroBaseCorreiosResultadoDTO {
  unificadoApagados: number;
  controleApagados: number;
  logradourosInseridos: number;
  chavesCalculadas: number;
  mensagem: string;
}

export class LogradouroUnificadoFilters {
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
export class LogradouroUnificadoService extends BaseResourceService<any> {

  private listaApiPath = environment.apiUrl + 'logradouros-unificado';

  constructor(protected injector: Injector) {
    super(environment.apiUrl + 'logradouros-unificado', injector, (json) => json);
  }

  private chave(b: { cidadeOrigem: number; distritoOrigem: number; logradouroOrigem: number }): string {
    return `${b.cidadeOrigem}/${b.distritoOrigem}/${b.logradouroOrigem}`;
  }

  /*
   * Base dos Correios
   */
  buscarResumoBaseCorreios(): Promise<LogradouroBaseCorreiosResumoDTO> {
    return this.http
      .get<LogradouroBaseCorreiosResumoDTO>(`${this.listaApiPath}/base-correios/resumo`)
      .toPromise();
  }

  gerarBaseCorreios(): Promise<LogradouroBaseCorreiosResultadoDTO> {
    return this.http
      .post<LogradouroBaseCorreiosResultadoDTO>(`${this.listaApiPath}/base-correios/gerar`, {})
      .toPromise();
  }

  zerarBaseCorreios(confirmacao: string): Promise<LogradouroBaseCorreiosResultadoDTO> {

    const params = new HttpParams().set('confirmacao', confirmacao);

    return this.http
      .post<LogradouroBaseCorreiosResultadoDTO>(
        `${this.listaApiPath}/base-correios/zerar`,
        {},
        { params }
      )
      .toPromise();
  }

  /*
   * Unificação por origem
   */
  listarOrigens(): Promise<OrigemLogradouroDTO[]> {
    return this.http
      .get<OrigemLogradouroDTO[]>(`${this.listaApiPath}/origens`)
      .toPromise();
  }

  pesquisarPendentes(
    origem: string,
    params: HttpParams
  ): Promise<{ logradouros: LogradouroOrigemDTO[]; total: number }> {

    return this.http
      .get<any>(`${this.listaApiPath}/${origem}/pendentes`, { params })
      .toPromise()
      .then((response) => {
        const logradouros = Array.isArray(response) ? response : (response?.content ?? []);
        const total = Array.isArray(response) ? logradouros.length : (response?.totalElements ?? 0);

        return { logradouros, total };
      });
  }

  buscarResumo(origem: string): Promise<LogradouroUnificadoResumoDTO> {
    return this.http
      .get<LogradouroUnificadoResumoDTO>(`${this.listaApiPath}/${origem}/resumo`)
      .toPromise();
  }

  buscarCandidatos(
    origem: string,
    logradouro: LogradouroOrigemDTO,
    pesquisa?: string,
    todos = false
  ): Promise<LogradouroCandidatoDTO[]> {

    let params = new HttpParams();

    if (pesquisa && pesquisa.trim()) {
      params = params.set('pesquisa', pesquisa.trim());
    }

    if (todos) {
      params = params.set('todos', 'true');
    }

    return this.http
      .get<LogradouroCandidatoDTO[]>(
        `${this.listaApiPath}/${origem}/candidatos/${this.chave(logradouro)}`,
        { params }
      )
      .toPromise();
  }

  vincular(
    origem: string,
    logradouro: LogradouroOrigemDTO,
    idUnificado: number
  ): Promise<string> {

    const params = new HttpParams().set('idUnificado', String(idUnificado));

    return this.http
      .post(
        `${this.listaApiPath}/${origem}/vincular/${this.chave(logradouro)}`,
        {},
        { params, responseType: 'text' }
      )
      .toPromise();
  }

  vincularUnicos(origem: string): Promise<LogradouroUnificadoLoteDTO> {
    return this.http
      .post<LogradouroUnificadoLoteDTO>(`${this.listaApiPath}/${origem}/vincular-unicos`, {})
      .toPromise();
  }

  /*
   * pesquisa: começo do CEP ou parte do nome de um logradouro vizinho.
   * Sem pesquisa: o CEP informado na origem (Saúde), se for válido.
   */
  buscarCeps(
    origem: string,
    logradouro: LogradouroOrigemDTO,
    pesquisa?: string
  ): Promise<LogradouroCepDTO[]> {

    let params = new HttpParams();

    if (pesquisa && pesquisa.trim()) {
      params = params.set('pesquisa', pesquisa.trim());
    }

    return this.http
      .get<LogradouroCepDTO[]>(
        `${this.listaApiPath}/${origem}/ceps/${this.chave(logradouro)}`,
        { params }
      )
      .toPromise();
  }

  criar(origem: string, logradouro: LogradouroOrigemDTO, cep: number): Promise<string> {

    const params = new HttpParams().set('cep', String(cep));

    return this.http
      .post(
        `${this.listaApiPath}/${origem}/criar/${this.chave(logradouro)}`,
        {},
        { params, responseType: 'text' }
      )
      .toPromise();
  }

  naoVincular(
    origem: string,
    logradouro: LogradouroOrigemDTO,
    motivo?: string
  ): Promise<string> {

    let params = new HttpParams();

    if (motivo && motivo.trim()) {
      params = params.set('motivo', motivo.trim());
    }

    return this.http
      .post(
        `${this.listaApiPath}/${origem}/nao-vincular/${this.chave(logradouro)}`,
        {},
        { params, responseType: 'text' }
      )
      .toPromise();
  }
}
