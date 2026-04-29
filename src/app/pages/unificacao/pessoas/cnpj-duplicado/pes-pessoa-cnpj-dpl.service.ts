import { Injectable, Injector, EventEmitter } from '@angular/core';
import { HttpParams } from '@angular/common/http';

import { environment } from '../../../../../environments/environment';
import { BaseResourceService } from '../../../../shared/services/base-resource.service';
import { FiltroPaginado } from '../../../../shared/filters/filtro-paginado';
import { PesPessoas } from '../../../../shared/models/unificacao/pes-pessoas';

export class PessoaCnpjDplFilters {
  pagina = 0;
  itensPorPagina = 40;
  totalRegistros = 0;

  id: number | null = null;
  nome = '';
  cnpj: string | null = null;

  params = new HttpParams();
}

@Injectable({ providedIn: 'root' })
export class PesPessoaCnpjDplService extends BaseResourceService<PesPessoas> {

  private pesPessoasEventHendlerId: EventEmitter<PesPessoas>;
  private cargaApiPath = environment.apiUrl + 'pes-carga-pessoas-cnpj-duplicado';
  private listaApiPath = environment.apiUrl + 'pes-pessoas/cnpj-duplicado-nao-migradas';

  constructor(protected injector: Injector) {
    super(environment.apiUrl + 'pes-pessoas', injector, PesPessoas.fromJson);
    this.pesPessoasEventHendlerId = new EventEmitter<PesPessoas>();
  }

  pesquisar(filtro: FiltroPaginado): Promise<any> {
    const params = filtro.params || new HttpParams();

    return this.http
      .get<any>(this.listaApiPath, { params })
      .toPromise()
      .then((response) => {
        const pesPessoas = Array.isArray(response) ? response : (response?.content ?? []);
        const total = Array.isArray(response) ? pesPessoas.length : (response?.totalElements ?? 0);
        return { pesPessoas, total };
      });
  }

  pesquisarCnpjDpl(filtro: FiltroPaginado): Promise<any> {
    return this.pesquisar(filtro);
  }

  processarPessoaUnica(pessoaId: number): Promise<string> {
    return this.http
      .post(`${this.cargaApiPath}/processar/${pessoaId}`, {}, { responseType: 'text' })
      .toPromise();
  }

  processarPessoaCnpjDpl(pessoaId: number): Promise<string> {
    return this.http
      .post(`${this.cargaApiPath}/processar/${pessoaId}`, {}, { responseType: 'text' })
      .toPromise();
  }
} 
