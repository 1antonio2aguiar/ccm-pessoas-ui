import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';

export interface CadUnicoEnderecoOrigemDTO {
  banco: string;
  cdOrigem: number;
  cidade: number;
  cidadeNome: string;
  distrito: number;
  distritoNome: string;
  bairro: number;
  bairroNome: string;
  logradouro: number;
  logradouroNome: string;
  numero: number;
  complemento: string;
  cep: number;
  uf: string;
  tipoLogradouro: string;
}

export interface CadUnicoPessoaOrigemDTO {
  id: number;
  cdOrigem: number;
  tipoPessoa: number;
  nome: string;
  fisicaJuridica: string;
  cpfCnpj: number;
  estadoCivil: string;
  sexo: string;
  email: string;
  banco: string;
  pessoasCdUnico: number;
  status: string;
  dataNascimento: string;
  dataCadastro: string;
  observacao: string;
  cidadeNascimentoNome: string;
  enderecos: CadUnicoEnderecoOrigemDTO[];
}

@Injectable({ providedIn: 'root' })
export class OrigemService {

  private apiPath = environment.apiUrl + 'cad-unico-pessoas';

  constructor(private http: HttpClient) { }

  buscarOrigens(pessoasCdUnico: number): Observable<CadUnicoPessoaOrigemDTO[]> {
    return this.http.get<CadUnicoPessoaOrigemDTO[]>(`${this.apiPath}/${pessoasCdUnico}/origens`);
  }
}
