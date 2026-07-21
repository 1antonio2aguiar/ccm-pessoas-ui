import { BaseResourceModel } from './base-resource.model';

export class ContatoOut extends BaseResourceModel {
  constructor(
    public override id?: number,

    public tipoContato?: number,
    public tipoContatoDescricao?: string,

    public contato?: string,
    public complemento?: string,
    public principal?: string,

    public pessoaId?: number,
    public pessoaNome?: string,

    public dadosPessoaJuridicaId?: number,
    public estabelecimentoNome?: string,
    public estabelecimentoCnpj?: string,
  ) {
    super();
  }

  static fromJson(jsonData: any): ContatoOut {
    return Object.assign(
      new ContatoOut(),
      {
        ...jsonData,
      },
    );
  }
}