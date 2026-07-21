import { BaseResourceModel } from './base-resource.model';

export class ContatoIn extends BaseResourceModel {
  constructor(
    public override id?: number,

    public contato?: string,
    public principal?: string,
    public tipoContato?: number,
    public complemento?: string,

    public pessoaId?: number,
    public dadosPessoaJuridicaId?: number,
  ) {
    super();
  }

  static fromJson(jsonData: any): ContatoIn {
    return Object.assign(
      new ContatoIn(),
      {
        ...jsonData,
      },
    );
  }

  static toJson(jsonData: any): ContatoIn {
    return Object.assign(
      new ContatoIn(),
      jsonData,
    );
  }
}