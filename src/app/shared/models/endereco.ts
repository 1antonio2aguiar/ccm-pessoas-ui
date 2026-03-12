// endereco.ts
import { Empresa } from './empresa';
import { BaseResourceModel } from './base-resource.model';
import { Pessoa } from './pessoa';
import { CepApiOut } from './cepApiOut';
import BairroOut from './bairroOut';
import LogradouroOut from './logradouroOut';

export class Endereco extends BaseResourceModel {
    constructor(
      public override id?: number,
      public tipoEndereco?: number,
      public principal?: string,
      public numero?: number,
      public complemento?: string,

      public cepId?: number,
      public cep?: CepApiOut, // Se cep pode vir como null da API, isso está ok

      public pessoaId?: number,
      public pessoa?: Pessoa, // Se pessoa pode vir como null da API

      public logradouroId?: number, // Corrigido para minúsculo para consistência (assumindo que esta é a intenção)
      public logradouro?: LogradouroOut,

      public bairroId?: number,
      public bairro?: BairroOut,

    ) {
      super();
  }

  static fromJson(jsonData: any): Endereco {
    const enderecoTransformado = {
      ...jsonData, // Mantém as propriedades originais como logradouro, cep, bairro, pessoa (sejam objetos ou null)
      cepId: jsonData.cep?.id ?? undefined, // Garante undefined se cep ou cep.id for nulo/undefined
      pessoaId: jsonData.pessoa?.id ?? undefined,
      logradouroId: jsonData.logradouro?.id ?? undefined, // Ajuste para a propriedade correta no jsonData se necessário
      bairroId: jsonData.bairro?.id ?? undefined,
      // Se você quiser popular os objetos cep, pessoa, etc., com instâncias das suas classes:
      // cep: jsonData.cep ? new CepApiOut(jsonData.cep) : undefined, // Supondo que CepApiOut tenha um construtor que aceite os dados
      // logradouro: jsonData.logradouro ? new LogradouroOut(jsonData.logradouro) : undefined,
      // bairro: jsonData.bairro ? new BairroOut(jsonData.bairro) : undefined,
      // pessoa: jsonData.pessoa ? new Pessoa(jsonData.pessoa) : undefined,
    };
    return Object.assign(new Endereco(), enderecoTransformado);
 }

  // toJson não é usado neste fluxo, mas deve ser revisado se for usado em outro lugar.
  // static toJson(jsonData: any): Endereco {
  //     return Object.assign(new Endereco(), jsonData);
  // }
}