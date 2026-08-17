import { Injectable, Injector, EventEmitter } from '@angular/core';
import { HttpParams } from '@angular/common/http';

import { environment } from '../../../../../environments/environment';
import { BaseResourceService } from '../../../../shared/services/base-resource.service';
import { FiltroPaginado } from '../../../../shared/filters/filtro-paginado';

export class RhPessoaFilters {
  pagina = 0;
  itensPorPagina = 7;
  totalRegistros = 0;

  id: number | null = null;
  nome = '';
  cpf: string | null = null;
  cnpj: string | null = null;
  fisicaJuridica: string | null = null;
  statusCadastro: string | null = null;

  params = new HttpParams();
}

export interface PessoaCpfCnpjCadUnicoDTO {
  existe: boolean;
  pessoaId: number | null;
  nome: string | null;
  cpfCnpj: string | null;
  dataNascimento: string | null;
}

@Injectable({ providedIn: 'root' })
export class RhPessoaService extends BaseResourceService<any> {

  private rhPessoasEventHendlerId: EventEmitter<any>;
  private listaApiPath = environment.apiUrl + 'rh-pessoas';
  private cargaApiPath = environment.apiUrl + 'rh-pessoas';

  constructor(protected injector: Injector) {
    super(environment.apiUrl + 'rh-pessoas', injector, (json) => json);
    this.rhPessoasEventHendlerId = new EventEmitter<any>();
  }

  pesquisar(filtro: FiltroPaginado): Promise<any> {
    const params = filtro.params || new HttpParams();

    return this.http
      .get<any>(this.listaApiPath, { params })
      .toPromise()
      .then((response) => {
        const rhPessoas = Array.isArray(response) ? response : (response?.content ?? []);
        const total = Array.isArray(response) ? rhPessoas.length : (response?.totalElements ?? 0);

        return { rhPessoas, total };
      });
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

  processarCpfUnico(pessoaId: number): Promise<string> {
    return this.http
      .post(`${this.cargaApiPath}/processar-cpf-unico/${pessoaId}`, {}, { responseType: 'text' })
      .toPromise();
  }

  processarCpfDuplicado(pessoaId: number): Promise<string> {
    return this.http
      .post(`${this.cargaApiPath}/processar-cpf-duplicado/${pessoaId}`, {}, { responseType: 'text' })
      .toPromise();
  }

  processarJaExisteCadUnico(pessoaId: number): Promise<string> {
    return this.http
      .post(`${this.cargaApiPath}/processar-ja-existe-cad-unico/${pessoaId}`, {}, { responseType: 'text' })
      .toPromise();
  }

  processarCnpjUnico(pessoaId: number): Promise<string> {
    return this.http
      .post(`${this.cargaApiPath}/processar-cnpj-unico/${pessoaId}`, {}, { responseType: 'text' })
      .toPromise();
  }

  registrarGrupoCpfDuplicadoNaoMigrar(
    pessoaId: number
  ): Promise<string> {

    return this.http
      .post(
        `${this.listaApiPath}/cpf-duplicado/nao-migrar/${pessoaId}`,
        {},
        {
          responseType: 'text',
        }
      )
      .toPromise();
  }
}
