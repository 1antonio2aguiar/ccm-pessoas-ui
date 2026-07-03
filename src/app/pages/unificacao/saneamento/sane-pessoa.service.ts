import { Injectable, Injector, EventEmitter } from '@angular/core';
import { HttpParams } from '@angular/common/http';

import { environment } from '../../../../environments/environment';
import { BaseResourceService } from '../../../shared/services/base-resource.service';
import { FiltroPaginado } from '../../../shared/filters/filtro-paginado';

export class SanePessoaFilters {
  pagina = 0;
  itensPorPagina = 8;
  totalRegistros = 0;

  pessoa: number | null = null;
  nome = '';
  cpf: string | null = null;
  dataNascimento: string | null = null;

  params = new HttpParams();
}

@Injectable({ providedIn: 'root' })
export class SanePessoaService extends BaseResourceService<any> {

  private sanePessoasEventHendlerId: EventEmitter<any>;

  private listaApiPath = environment.apiUrl + 'sane-pessoas';

  constructor(protected injector: Injector) {
    super(environment.apiUrl + 'sane-pessoas', injector, (json) => json);
    this.sanePessoasEventHendlerId = new EventEmitter<any>();
  }

  pesquisarCpfUnico(filtro: FiltroPaginado): Promise<any> {
    const params = filtro.params || new HttpParams();

    return this.http
      .get<any>(`${this.listaApiPath}/cpf-unico`, { params })
      .toPromise()
      .then((response) => {
        const sanePessoas = Array.isArray(response) ? response : (response?.content ?? []);
        const total = Array.isArray(response) ? sanePessoas.length : (response?.totalElements ?? 0);

        return { sanePessoas, total };
      });
  }

  pesquisarCpfDuplicado(filtro: FiltroPaginado): Promise<any> {
    const params = filtro.params || new HttpParams();

    return this.http
      .get<any>(`${this.listaApiPath}/cpf-duplicado`, { params })
      .toPromise()
      .then((response) => {
        const sanePessoas = Array.isArray(response) ? response : (response?.content ?? []);
        const total = Array.isArray(response) ? sanePessoas.length : (response?.totalElements ?? 0);

        return { sanePessoas, total };
      });
  }

  processarCpfUnico(pessoaId: number): Promise<string> {
    return this.http
      .post(`${this.listaApiPath}/processar-cpf-unico/${pessoaId}`, {}, { responseType: 'text' })
      .toPromise();
  }

  processarCpfDuplicado(pessoaId: number): Promise<string> {
    return this.http
      .post(`${this.listaApiPath}/processar-cpf-duplicado/${pessoaId}`, {}, { responseType: 'text' })
      .toPromise();
  }

  processarJaExisteCadUnico(pessoaId: number): Promise<string> {
    return this.http
      .post(`${this.listaApiPath}/processar-ja-existe-cad-unico/${pessoaId}`, {}, { responseType: 'text' })
      .toPromise();
  }

  existeCpfCnpjNoCadUnico(cpfCnpj: string | number, fisicaJuridica: string): Promise<boolean> {
    const params = new HttpParams()
      .set('cpfCnpj', String(cpfCnpj).replace(/\D/g, ''))
      .set('fisicaJuridica', fisicaJuridica);

    return this.http
      .get<boolean>(`${environment.apiUrl}pessoas/existe-cpf-cnpj-cad-unico`, { params })
      .toPromise();
  }

  pesquisarCnpjUnico(filtro: FiltroPaginado): Promise<any> {
    const params = filtro.params || new HttpParams();

    return this.http
      .get<any>(`${this.listaApiPath}/cnpj-unico`, { params })
      .toPromise()
      .then((response) => {
        const sanePessoas = Array.isArray(response) ? response : (response?.content ?? []);
        const total = Array.isArray(response) ? sanePessoas.length : (response?.totalElements ?? 0);

        return { sanePessoas, total };
      });
  }
    
  processarCnpjUnico(pessoaId: number): Promise<string> {
    return this.http
      .post(`${this.listaApiPath}/processar-cnpj-unico/${pessoaId}`, {}, { responseType: 'text' })
      .toPromise();
  }

  processarCnpjJaExisteCadUnico(pessoaId: number): Promise<string> {
    return this.http
      .post(`${this.listaApiPath}/processar-cnpj-ja-existe-cad-unico/${pessoaId}`, {}, { responseType: 'text' })
      .toPromise();
  }
} 