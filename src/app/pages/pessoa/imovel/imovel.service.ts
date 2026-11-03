import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface ImovelDividaDTO {
  tipoDivida: number;
  tipoDividaDescricao: string;
  anoDivida: number;
  valorDivida: number;
  correcao: number;
  multa: number;
  juros: number;
  sit: string;
  total: number;
}

export interface ImovelDTO {
  imovel: number;
  tipoLogradouro: string;
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  uf: string;
  cep: string;
  total: number;
  dividas: ImovelDividaDTO[];
}

@Injectable({ providedIn: 'root' })
export class ImovelService {
  private readonly apiPath = environment.apiUrl + 'imoveis';
  constructor(private http: HttpClient) {}

  listarPorPessoa(pessoasCdUnico: number, anoInicial = 1992, anoFinal = new Date().getFullYear()): Observable<ImovelDTO[]> {
    const params = new HttpParams()
      .set('anoInicial', String(anoInicial))
      .set('anoFinal', String(anoFinal));
    return this.http.get<ImovelDTO[]>(`${this.apiPath}/pessoa/${pessoasCdUnico}`, { params });
  }
}
