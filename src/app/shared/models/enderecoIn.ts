import { BaseResourceModel } from './base-resource.model';

export class EnderecoIn extends BaseResourceModel {
    constructor(
      public override id?: number,
      public numero?: number,
      public principal?: string,
      public tipoEndereco?: number,
      public complemento?: string,

      public pessoaId?: number,
      public cepId?: number,
      public logradouroId?: number,
      public bairroId?: number,

    ) {
      super();
  }

  static fromJson(jsonData: any): EnderecoIn {
    const enderecosIn = {
      ...jsonData
    };
    return Object.assign(new EnderecoIn(), enderecosIn);
 }

  static toJson(jsonData: any): EnderecoIn {
      return Object.assign(new EnderecoIn(), jsonData);
  }
}
