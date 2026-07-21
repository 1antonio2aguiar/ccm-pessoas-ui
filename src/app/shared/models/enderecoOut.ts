import { BaseResourceModel } from './base-resource.model';

export class EnderecoOut extends BaseResourceModel {
  constructor(
    public override id?: number,
    public tipoEndereco?: number,
    public principal?: string,
    public numero?: number,
    public complemento?: string,
    public cep?: string,

    public pessoaId?: number,
    public pessoaNome?: string,

    public dadosPessoaJuridicaId?: number,
    public estabelecimentoNome?: string,
    public estabelecimentoCnpj?: string,

    public logradouroId?: number,
    public tipoLogradouroId?: number,
    public tipoLogradouro?: string,
    public logradouroNome?: string,

    public distritoNome?: string,
    public cidadeNome?: string,
    public estadoUf?: string,

    public cepId?: number,
    public bairroId?: number,
    public bairroNome?: string,

  ) {
    super();
  }

  static fromJson(jsonData: any): EnderecoOut {
    return Object.assign(new EnderecoOut(), {
      ...jsonData,
    });
  }
}