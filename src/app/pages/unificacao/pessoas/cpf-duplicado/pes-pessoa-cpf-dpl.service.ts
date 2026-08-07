import { Injectable, Injector, EventEmitter } from '@angular/core';
import { HttpParams } from '@angular/common/http';

import { environment } from '../../../../../environments/environment';
import { BaseResourceService } from '../../../../shared/services/base-resource.service';
import { FiltroPaginado } from '../../../../shared/filters/filtro-paginado';

import { PesPessoas } from '../../../../shared/models/unificacao/pes-pessoas';

export interface PessoaCpfCnpjCadUnicoDTO {
  existe: boolean;
  pessoaId: number | null;
  nome: string | null;
  cpfCnpj: string | null;
  dataNascimento: string | null;
}
export class PessoaFilters {
  pagina = 0;
  itensPorPagina = 8;
  totalRegistros = 0;

  id: number | null = null;
  nome = '';
  cpf: string | null = null;
  cnpj: string | null = null;

  params = new HttpParams();
} 

@Injectable({ providedIn: 'root' })

export class PesPessoaCpfDplService extends BaseResourceService<PesPessoas> {

  private pesPessoasEventHendlerId: EventEmitter<PesPessoas>;

  private cargaApiPath =
    environment.apiUrl + 'pessoa/pes-pessoas/cpf-duplicado';

  private listaApiPath =
    environment.apiUrl + 'pessoa/pes-pessoas/cpf-duplicado-nao-migradas';

  constructor(protected injector: Injector) {
    super(
      environment.apiUrl + 'pessoa/pes-pessoas',
      injector,
      PesPessoas.fromJson
    );

    this.pesPessoasEventHendlerId =
      new EventEmitter<PesPessoas>();
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

  pesquisarCpfDpl(filtro: FiltroPaginado): Promise<any> {
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

  /*processarPessoaUnica(pessoaId: number): Promise<string> {
    return this.http
      .post(`${this.cargaApiPath}/processar/${pessoaId}`, {}, { responseType: 'text' })
      .toPromise();
  }*/

  processarPessoaCpfDpl(pessoaId: number): Promise<string> {
    return this.http
      .post(`${this.cargaApiPath}/processar/${pessoaId}`, {}, { responseType: 'text' })
      .toPromise();
  }

  processarPessoaCpfDplJaExiste(
    pessoaId: number
  ): Promise<string> {

    return this.http
      .post(
        `${this.cargaApiPath}/processar-ja-existe/${pessoaId}`,
        {},
        { responseType: 'text' }
      )
      .toPromise();
  }

  existeCpfCnpjNoCadUnico(
    cpfCnpj: string | number,
    fisicaJuridica: string
  ): Promise<PessoaCpfCnpjCadUnicoDTO> {

    const params = new HttpParams()
      .set(
        'cpfCnpj',
        String(cpfCnpj).replace(/\D/g, '')
      )
      .set(
        'fisicaJuridica',
        fisicaJuridica
      );

    return this.http
      .get<PessoaCpfCnpjCadUnicoDTO>(
        `${environment.apiUrl}pessoas/existe-cpf-cnpj-cad-unico`,
        { params }
      )
      .toPromise();
  }
}