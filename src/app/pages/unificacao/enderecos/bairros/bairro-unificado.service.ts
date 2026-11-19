import { Injectable, Injector } from '@angular/core';
import { HttpParams } from '@angular/common/http';

import { environment } from '../../../../../environments/environment';
import { BaseResourceService } from '../../../../shared/services/base-resource.service';

export type SituacaoBairro =
  | 'DISTRITO_NAO_UNIFICADO'
  | 'UNICA'
  | 'DUPLICADA'
  | 'AMBIGUA'
  | 'SEM_CORRESPONDENCIA';

export interface OrigemBairroDTO {
  codigo: string;
  descricao: string;
}

export interface BairroOrigemDTO {
  origem: string;
  cidadeOrigem: number;
  distritoOrigem: number;
  bairroOrigem: number;
  nome: string;
  uf: string;
  nomeCidade: string | null;
  cidadeCorreios: number | null;
  distritoCorreios: number | null;
  qtdCandidatos: number;
  situacao: SituacaoBairro;
  idSugerido: number | null;
  nomeSugerido: string | null;
  bairroCorreiosSugerido: number | null;
}

export interface BairroCandidatoDTO {
  id: number;
  cidadeCorreios: number;
  distritoCorreios: number;
  bairroCorreios: number;
  nome: string;
  nomeReduzido: string | null;
  codigoOrigemAtual: number | null;
  statusCor: string | null;
  criterio: 'NOME' | 'PESQUISA' | 'DISTRITO';
}

export interface BairroUnificadoResumoDTO {
  origem: string;
  descricao: string;
  totalOrigem: number;
  totalVinculados: number;
  totalDuplicadosRegistrados: number;
  totalNaoVincular: number;
  totalPendentes: number;
  totalDistritoNaoUnificado: number;
  totalUnicos: number;
  totalDuplicados: number;
  totalAmbiguos: number;
  totalSemCorrespondencia: number;
}

export interface BairroUnificadoLoteDTO {
  totalAnalisados: number;
  totalVinculados: number;
  totalDuplicados: number;
  totalErros: number;
  erros: string[];
}

export interface BairroBaseCorreiosResumoDTO {
  totalCorreios: number;
  totalCorreiosFicticios: number;
  totalUnificado: number;
  totalFaltando: number;
  permiteZerar: boolean;
}

export interface BairroBaseCorreiosResultadoDTO {
  unificadoApagados: number;
  controleApagados: number;
  bairrosInseridos: number;
  mensagem: string;
}

export class BairroUnificadoFilters {
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
export class BairroUnificadoService extends BaseResourceService<any> {

  private listaApiPath = environment.apiUrl + 'bairros-unificado';

  constructor(protected injector: Injector) {
    super(environment.apiUrl + 'bairros-unificado', injector, (json) => json);
  }

  private chave(b: { cidadeOrigem: number; distritoOrigem: number; bairroOrigem: number }): string {
    return `${b.cidadeOrigem}/${b.distritoOrigem}/${b.bairroOrigem}`;
  }

  /*
   * Base dos Correios
   */
  buscarResumoBaseCorreios(): Promise<BairroBaseCorreiosResumoDTO> {
    return this.http
      .get<BairroBaseCorreiosResumoDTO>(`${this.listaApiPath}/base-correios/resumo`)
      .toPromise();
  }

  gerarBaseCorreios(): Promise<BairroBaseCorreiosResultadoDTO> {
    return this.http
      .post<BairroBaseCorreiosResultadoDTO>(`${this.listaApiPath}/base-correios/gerar`, {})
      .toPromise();
  }

  zerarBaseCorreios(confirmacao: string): Promise<BairroBaseCorreiosResultadoDTO> {

    const params = new HttpParams().set('confirmacao', confirmacao);

    return this.http
      .post<BairroBaseCorreiosResultadoDTO>(
        `${this.listaApiPath}/base-correios/zerar`,
        {},
        { params }
      )
      .toPromise();
  }

  /*
   * Unificação por origem
   */
  listarOrigens(): Promise<OrigemBairroDTO[]> {
    return this.http
      .get<OrigemBairroDTO[]>(`${this.listaApiPath}/origens`)
      .toPromise();
  }

  pesquisarPendentes(
    origem: string,
    params: HttpParams
  ): Promise<{ bairros: BairroOrigemDTO[]; total: number }> {

    return this.http
      .get<any>(`${this.listaApiPath}/${origem}/pendentes`, { params })
      .toPromise()
      .then((response) => {
        const bairros = Array.isArray(response) ? response : (response?.content ?? []);
        const total = Array.isArray(response) ? bairros.length : (response?.totalElements ?? 0);

        return { bairros, total };
      });
  }

  buscarResumo(origem: string): Promise<BairroUnificadoResumoDTO> {
    return this.http
      .get<BairroUnificadoResumoDTO>(`${this.listaApiPath}/${origem}/resumo`)
      .toPromise();
  }

  buscarCandidatos(
    origem: string,
    bairro: BairroOrigemDTO,
    pesquisa?: string,
    todos = false
  ): Promise<BairroCandidatoDTO[]> {

    let params = new HttpParams();

    if (pesquisa && pesquisa.trim()) {
      params = params.set('pesquisa', pesquisa.trim());
    }

    if (todos) {
      params = params.set('todos', 'true');
    }

    return this.http
      .get<BairroCandidatoDTO[]>(
        `${this.listaApiPath}/${origem}/candidatos/${this.chave(bairro)}`,
        { params }
      )
      .toPromise();
  }

  vincular(
    origem: string,
    bairro: BairroOrigemDTO,
    idUnificado: number
  ): Promise<string> {

    const params = new HttpParams().set('idUnificado', String(idUnificado));

    return this.http
      .post(
        `${this.listaApiPath}/${origem}/vincular/${this.chave(bairro)}`,
        {},
        { params, responseType: 'text' }
      )
      .toPromise();
  }

  vincularUnicos(origem: string): Promise<BairroUnificadoLoteDTO> {
    return this.http
      .post<BairroUnificadoLoteDTO>(`${this.listaApiPath}/${origem}/vincular-unicos`, {})
      .toPromise();
  }

  criar(origem: string, bairro: BairroOrigemDTO): Promise<string> {
    return this.http
      .post(
        `${this.listaApiPath}/${origem}/criar/${this.chave(bairro)}`,
        {},
        { responseType: 'text' }
      )
      .toPromise();
  }

  naoVincular(
    origem: string,
    bairro: BairroOrigemDTO,
    motivo?: string
  ): Promise<string> {

    let params = new HttpParams();

    if (motivo && motivo.trim()) {
      params = params.set('motivo', motivo.trim());
    }

    return this.http
      .post(
        `${this.listaApiPath}/${origem}/nao-vincular/${this.chave(bairro)}`,
        {},
        { params, responseType: 'text' }
      )
      .toPromise();
  }
}
