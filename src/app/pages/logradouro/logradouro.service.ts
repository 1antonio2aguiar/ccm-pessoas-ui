import { Injectable, Injector, EventEmitter } from '@angular/core';
import { Observable, from, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { HttpClient, HttpParams } from '@angular/common/http';

import { environment } from '../../../environments/environment';
import { BaseResourceService } from '../../shared/services/base-resource.service';
import { FiltroPaginado } from '../../shared/filters/filtro-paginado';
import { Logradouro } from '../../shared/models/logradouro';
import { LogradouroSimple } from '../../shared/models/logradouroSimple';
import { LogradouroPesquisaOut } from '../../shared/models/logradouroPesquisaOut';

interface BackendLogradouroRcd {
  id: number;
  tipoLogradouro: string;
  logradouroNome: string; // O nome da propriedade no DTO é logradouroNome
  bairros: { id: number; nome: string }[];
  cidadeNome: string;
  uf: string;
  cepId: number;
  cep: string; // CEP é string no backend
}

@Injectable({ providedIn: 'root' })
export class LogradouroService extends BaseResourceService<Logradouro> {

  private logradouroEventHendlerId: EventEmitter<Logradouro>;

  constructor(protected injector: Injector) {
    // Ajuste o endpoint se seu backend usar outro (ex.: 'logradouros')
    super(environment.apiUrl + 'logradouros', injector, Logradouro.fromJson);
    this.logradouroEventHendlerId = new EventEmitter<Logradouro>();
  }

  pesquisar(filtro: FiltroPaginado): Promise<any> {
    let params = filtro.params;

    if (filtro.params) {
      filtro.params.keys().forEach(key => {
        params = params.set(key, filtro.params.get(key));
      });
    }

    return this.http
      .get<any>(this.apiPath + '/filter', { params })
      .toPromise()
      .then((response) => {
        const logradouros = Array.isArray(response) ? response : response?.content;
        //console.log('RESULTADO ', logradouros)
        return { logradouros };
      });
  }

  create(logradouro: Logradouro): Observable<Logradouro> {
    return this.http.post<Logradouro>(this.apiPath, logradouro);
  }

  update(logradouro: Logradouro): Observable<Logradouro> {
    return from(this.http
      .put<Logradouro>(`${this.apiPath}/${logradouro.id}`, logradouro)
      .toPromise()
      .then(response => response));
  }

  delete(id: number): Observable<any> {
    return from(this.http
      .delete<any>(`${this.apiPath}/${id}`)
      .toPromise()
      .then(response => response));
  }

  filtrarPorCidadeIdENome(cidadeId: number, nome: string, page = 0, size = 20): Observable<LogradouroSimple[]> {
    const params = new HttpParams()
      .set('cidadeId', String(cidadeId))
      .set('nome', nome ?? '')
      .set('page', String(page))
      .set('size', String(size));

    return this.http
      .get<any>(`${environment.apiUrl}logradouros/filter`, { params })   // 👈 AQUI
      .pipe(
        map((resp) => {
          const lista = Array.isArray(resp) ? resp : (resp?.content ?? []);
          console.log('LISTA REST ', lista);
          return (lista ?? [])
            .filter((x: any) => x && typeof x === 'object')
            .map((x: any) => LogradouroSimple.fromJson(x));             // 👈 AQUI
        }),
      );
  }

  buscarLogradourosPorTipoNome(nome: string, tipoLogradouroId: number, cidadeNome: string, cidadeId: number,): 
    Observable<LogradouroPesquisaOut[]> {
        const logradouroApiPath = environment.apiUrl + 'logradouros';
        let params = new HttpParams();

        // Adiciona os parâmetros apenas se eles tiverem valor
        if (nome) {
            params = params.set('nome', nome);
        }
        if (tipoLogradouroId) {
            params = params.set('tipoLogradouroId', tipoLogradouroId.toString());
        }
        if (cidadeNome) {
            params = params.set('cidadeNome', cidadeNome);
        }
        if (cidadeId) {
            params = params.set('cidadeId', cidadeId);
        }

        // 2. O 'get' agora espera um array diretamente: BackendLogradouroRcd[]
        return this.http.get<BackendLogradouroRcd[]>(`${logradouroApiPath}/por-cidade-tipo-nome`, { params }).pipe(
            tap(responseArray => {
                //console.log('Resposta CRUA da API de logradouros (Array):', responseArray);
            }),
            // 3. O 'map' agora opera diretamente no array da resposta
            map(responseArray => responseArray.map(log => ({
                id: log.id,
                tipoLogradouro: log.tipoLogradouro,
                logradouroNome: log.logradouroNome,
                bairros: log.bairros,
                cidadeNome: log.cidadeNome,
                uf: log.uf,
                cepId: log.cepId,
                cep: log.cep ? log.cep.toString() : '' // Pequena proteção para o caso de cep ser null
            }))),
            catchError(err => {
                console.error('Erro ao buscar logradouros por nome:', err);
                return of([]); // Retorna um array vazio em caso de erro
            })
        );
    }

}
