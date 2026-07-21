// endereco.ts
import { Empresa } from './empresa';
import { BaseResourceModel } from './base-resource.model';
import { Pessoa } from './pessoa';
import { CepOut } from './cepOut';
import BairroOut from './bairroOut';
import { LogradouroPesquisaOut } from './logradouroPesquisaOut';

export class Endereco extends BaseResourceModel {
    constructor(
      public override id?: number,
      public tipoEndereco?: number,
      public principal?: string,
      public numero?: number,
      public complemento?: string,

      public cepId?: number,
      public cep?: CepOut, // Se cep pode vir como null da API, isso está ok

      public pessoaId?: number,
      public pessoa?: Pessoa, // Se pessoa pode vir como null da API
      public dadosPessoaJuridicaId?: number,

      public logradouroId?: number, // Corrigido para minúsculo para consistência (assumindo que esta é a intenção)
      public logradouro?: LogradouroPesquisaOut,

      public bairroId?: number,
      public bairro?: BairroOut,

    ) {
      super();
  }

  static fromJson(jsonData: any): Endereco {
   const enderecoTransformado = {
  ...jsonData,

  cepId: jsonData.cep?.id ?? jsonData.cepId ?? undefined,
  pessoaId: jsonData.pessoa?.id ?? jsonData.pessoaId ?? undefined,

  dadosPessoaJuridicaId:
    jsonData.dadosPessoaJuridica?.id ??
    jsonData.dadosPessoaJuridicaId ??
    undefined,

  logradouroId:
    jsonData.logradouro?.id ??
    jsonData.logradouroId ??
    undefined,

  bairroId:
    jsonData.bairro?.id ??
    jsonData.bairroId ??
    undefined,
};
    return Object.assign(new Endereco(), enderecoTransformado);
 }

  // toJson não é usado neste fluxo, mas deve ser revisado se for usado em outro lugar.
  // static toJson(jsonData: any): Endereco {
  //     return Object.assign(new Endereco(), jsonData);
  // }
}