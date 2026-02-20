import { Injectable, Injector, EventEmitter } from '@angular/core';
import { HttpParams, HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
//import { AuthService } from '../../../shared/services/auth.service';
import { catchError, map } from 'rxjs/operators';

import { BaseResourceService } from '../../../shared/services/base-resource.service';
import { Filters } from '../../../shared/filters/filters';
import { environment } from '../../../../environments/environment';
//import { Equipe } from '../../../shared/models/equipe';

@Injectable({
  providedIn: 'root'
})

export class EquipesService  {

  filtro: Filters = new Filters();

  // etapa por id.
  /*private equipeEventHendlerId: EventEmitter<Equipe>

  constructor(
    protected injector: Injector,
    private authService: AuthService,
  ) {
    super(environment.apiUrl + 'equipe', injector, Equipe.fromJson);
    this.equipeEventHendlerId = new EventEmitter<Equipe>();
  } 

  getEquipes(): Observable<Equipe[]> {
    const empresaId = this.authService.getEmpresaId(); // Obtém o ID da empresa do serviço de autenticação
    let params = new HttpParams();
    params = params.set('empresaId', empresaId.toString()); // Adiciona o empresaId como parâmetro de consulta

    return this.http.get<Equipe[]>(this.apiPath + '/filter', { params });
  }

  pesquisar(filtro: Filters): Promise<any> {
    const empresaId = this.authService.getEmpresaId(); // Obtém o ID da empresa do serviço de autenticação
    let params = new HttpParams();
    params = params.set('empresaId', empresaId.toString()); // Adiciona o empresaId como parâmetro de consulta
    
    params = params
      .append('page', filtro.pagina.toString())
      .append('size', filtro.itensPorPagina.toString());

    return this.http
      .get<any>(this.apiPath + '/filter', { params }) // Use the declared params
      .toPromise()
      .then((response) => {
        // Ajuste conforme a estrutura da sua resposta da API
        const equipes = response.content
        const resultado = {
          equipes,
          total: response.totalElements
        };
        return resultado;
      })
      .catch(error => {
        console.error('Erro na requisição:', error);
        throw error; // Re-lance o erro para ser tratado em outro lugar
      });
  }*/
}
