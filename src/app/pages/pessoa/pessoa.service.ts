import { Injectable, Injector, EventEmitter } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { map } from 'rxjs/operators';

import { environment } from '../../../environments/environment';
import { BaseResourceService } from '../../shared/services/base-resource.service';
import { PessoaIn,  } from '../../shared/models/pessoaIn';
import { PessoaOut } from '../../shared/models/pessoaOut';
import { TipoPessoa } from '../../shared/models/tipoPessoa';
import { Filters } from '../../shared/filters/filters';
import { EstabelecimentoSelect } from '../../shared/models/estabelecimento-select';

export class PessoaFilters {
  pagina = 0;
  itensPorPagina = 40;
  totalRegistros = 0;

  id: number | null = null;
  nome = '';
  cpf: string | null = null;
  cnpj: string | null = null;

  params = new HttpParams();
}

@Injectable({ providedIn: 'root' })

export class PessoaService extends BaseResourceService<PessoaOut> {

  // pessoa por id.
    private pessoaEventHendlerId: EventEmitter<PessoaIn>

  constructor(
      protected injector: Injector,
    ) {
      super(environment.apiUrl + 'pessoas', injector, PessoaOut.fromJson);
      this.pessoaEventHendlerId = new EventEmitter<PessoaIn>();
  }

  
  pesquisar(filtro: Filters): Promise<any> {
    let params = filtro.params;

    return this.http
    .get<any>(this.apiPath + '/filter', { params })
    .toPromise()
    .then((response) => {
      const pessoas = response.content;
      const resultado = {
        pessoas,
        total: response.totalElements,
      };
      //console.log('LISTA ', resultado)
      return resultado;
    });
  }

  getPessoaById(pessoaId: number): Promise<PessoaOut> {
    // padrão REST: GET /pessoas/{id}
    const url = `${this.apiPath}/${pessoaId}`;
    return this.http.get<PessoaOut>(url).toPromise();
  }

  public createPessoa(pessoa: any): Observable<PessoaOut> {
    return this.http.post<PessoaOut>(this.apiPath, pessoa);
  }
  
  public updatePessoa(id: number, pessoa: any): Observable<PessoaOut> {
    return this.http.put<PessoaOut>(`${this.apiPath}/${id}`, pessoa);
  }

  public verificarCpfCnpjDuplicado(cpf?: string | null, cnpj?: string | null, idIgnorar?: number | null): Observable<boolean> {
    const cpfLimpo = cpf ? String(cpf).replace(/\D/g, '') : '';
    const cnpjLimpo = cnpj ? String(cnpj).replace(/\D/g, '') : '';

    if (!cpfLimpo && !cnpjLimpo) {
      return of(false);
    }

    const documentoPesquisado = cpfLimpo || cnpjLimpo;

    let params = new HttpParams()
      .set('pagina', '0')
      .set('itensPorPagina', '20');

    if (cpfLimpo) {
      params = params.set('cpf', cpfLimpo);
    }

    if (cnpjLimpo) {
      params = params.set('cnpj', cnpjLimpo);
    }

    return this.http.get<any>(this.apiPath + '/filter', { params }).pipe(
      map((response) => {
        const lista = this.extrairListaPessoas(response);
        const idAtual = idIgnorar !== null && idIgnorar !== undefined ? Number(idIgnorar) : null;

        return lista.some((p: any) => {
          const idEncontrado = p?.id !== null && p?.id !== undefined ? Number(p.id) : null;

          if (idAtual !== null && idEncontrado === idAtual) {
            return false;
          }

          const documentoEncontrado = this.extrairCpfCnpjPessoa(p);

          // Garante que só acusa duplicidade quando o CPF/CNPJ retornado é exatamente o mesmo.
          // Isso evita falso positivo caso o /filter volte registros por outro critério.
          return documentoEncontrado === documentoPesquisado;
        });
      })
    );
  }

  private extrairListaPessoas(response: any): any[] {
    if (Array.isArray(response)) {
      return response;
    }

    if (Array.isArray(response?.content)) {
      return response.content;
    }

    if (Array.isArray(response?.pessoas)) {
      return response.pessoas;
    }

    if (Array.isArray(response?.data)) {
      return response.data;
    }

    if (Array.isArray(response?.resultado)) {
      return response.resultado;
    }

    return [];
  }

  private extrairCpfCnpjPessoa(pessoa: any): string {
    return String(
      pessoa?.cpf ??
      pessoa?.cnpj ??
      pessoa?.cpfCnpj ??
      pessoa?.cgcCpf ??
      pessoa?.dadosPessoaFisica?.cpf ??
      pessoa?.dadosPessoaJuridica?.cnpj ??
      ''
    ).replace(/\D/g, '');
  }

  public deletePessoa(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiPath}/${id}`);
  }

  getEstabelecimentos(
  pessoaId: number
  ): Promise<EstabelecimentoSelect[]> {

    return this.getPessoaById(pessoaId)
      .then((pessoa: any) => {

        return (pessoa?.dadosPessoasJuridicas ?? [])
          .map((item: any) =>
            EstabelecimentoSelect.fromJson({
              id: item.id,
              nome: item.nome,
              cnpj: item.cnpj,
              nomeFantasia: item.nomeFantasia,
            })
          );

      });

  }

}
