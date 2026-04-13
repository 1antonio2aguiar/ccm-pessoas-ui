import { BaseResourceModel } from './base-resource.model';

export class ContatoIn extends BaseResourceModel {
    constructor(
      public override id?: number,
      public numero?: string,
      public principal?: string,
      public tipoContato?: number,
      public complemento?: string,

      public pessoaId?: number,

    ) {
      super();
  }

  static fromJson(jsonData: any): ContatoIn {
    const contatosIn = {
      ...jsonData
    };
    return Object.assign(new ContatoIn(), contatosIn);
 }

  static toJson(jsonData: any): ContatoIn {
      return Object.assign(new ContatoIn(), jsonData);
  }
}
