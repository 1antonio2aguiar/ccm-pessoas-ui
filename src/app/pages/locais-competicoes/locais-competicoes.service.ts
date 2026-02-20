import { Injectable, Injector } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, from } from 'rxjs';

import { LocaisCompeticoes } from '../../shared/models/locaisCompeticoes';
import { environment } from '../../../environments/environment';
import { BaseResourceService } from '../../shared/services/base-resource.service';
import { Filters } from '../../shared/filters/filters';

@Injectable({
  providedIn: 'root'
})

@Injectable()
export class LocaisCompeticoesService extends BaseResourceService<LocaisCompeticoes>{

  constructor(protected injector: Injector) {
    super(environment.apiUrl + 'locaisCompeticoes', injector, LocaisCompeticoes.fromJson);
  }

  pesquisar(filtro: Filters): Promise<any> {
    let params = new HttpParams();
    params = params
      .append('page', filtro.pagina.toString())
      .append('size', filtro.itensPorPagina.toString());
      
      return this.http
      .get<any>(this.apiPath +'/filter', { })
        .toPromise()
        .then((response) => {
          const locaisCompeticoes = response.content;
          const resultado = {
            locaisCompeticoes,
            total: response.totalElements,
          };
          //console.table('Resultado: ', resultado.locaisCompeticoes)
          return resultado;
    });
  };

  /*pesquisar(filtro: Filters): Promise<any> {
    let params = new HttpParams();
    params = params
      .append('page', filtro.pagina.toString())
      .append('size', filtro.itensPorPagina.toString());

    return this.http
      .get<any>(this.apiPath + '/filter', {})
      .toPromise()
      .then((response) => {
        const modalidades = response.content;
        const resultado = {
          modalidades,
          total: response.totalElements,
        };
        //console.table('Resultado: ', response,  )
        return resultado;
      })}     ;*/


  // 1. Listar todos os registros (READ)
  listAll(): Promise<LocaisCompeticoes[]> {
    return this.http
      .get<LocaisCompeticoes[]>(this.apiPath /*+ '/list'*/)
      .toPromise();
  }

  create(locaisCompeticoes: LocaisCompeticoes): Observable<LocaisCompeticoes> {
    return from(this.http
      .post<LocaisCompeticoes>(this.apiPath, locaisCompeticoes)
      .toPromise()
      .then(response => {
        // Lidar com a resposta da API
        console.log('Local competição criado com sucesso:', response); // Log para verificar a resposta
        return response; // Retorna a resposta para o Observable
    }));
  }

  update(locaisCompeticoes: LocaisCompeticoes): Observable<LocaisCompeticoes> {
    return from(this.http
      .put<LocaisCompeticoes>(`${this.apiPath}/${locaisCompeticoes.id}`, locaisCompeticoes)
      .toPromise()
      .then(response => {
        // Lidar com a resposta da API
        console.log('Local competição atualizado com sucesso:', response);
        return response;
    }));
  }

  delete(id: number): Observable<any> {
    return from(this.http
      .delete<any>(`${this.apiPath}/${id}`)
      .toPromise()
      .then(response => {
        // Lidar com a resposta da API
        console.log('Local competição deletado com sucesso:', response); 
        return response;
    }));
  }
  
}
