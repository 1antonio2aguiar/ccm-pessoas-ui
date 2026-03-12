// endereco.ts
import { BaseResourceModel } from './base-resource.model';

export class EnderecoOut extends BaseResourceModel {
  constructor(
    public id?: number,
    public tipoEndereco?: number,
    public principal?: string,
    public numero?: number,
    public complemento?: string,
    public cep?: string,
    
    public nomePessoa?: string,
    public logradouroId?: number, 
    public tipoLogradouroId?: number,
    public tipoLogradouro?: string,
    public logradouroNome?: string,
    
    public distritoNome?: string,
    public cidadeNome?: string,
    public estadoUf?: string,

    public cepId?: number,
    public pessoaId?: number,
    public bairroId?: number,
    public bairroNome?: string,

  ) {
      super();
      //this.bairros = bairros || [];
  }

  static fromJson(jsonData: any): EnderecoOut {
    const enderecos = {
      ...jsonData, 
    };
    return Object.assign(new EnderecoOut(), enderecos);
 }
}
