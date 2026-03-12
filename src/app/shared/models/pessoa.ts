import { BaseResourceModel } from './base-resource.model';
import { DadosPessoaFisica } from './dadosPessoaFisica';
import { TipoPessoa } from './tipoPessoa';

export class Pessoa extends BaseResourceModel {
    constructor(
      public override id?: number,
      public nome?: string,
      public fisicaJuridica?: string,
      public situacao?: string,

      public tipoPessoaId?: number,
      public tipoPessoa?: TipoPessoa,

      public dadosPessoaFisicaId?: number,
      public dadosPessoaFisica?: DadosPessoaFisica,

    ) {
      super();
  }

  static fromJson(jsonData: any): Pessoa {
    const pessoas = {
      ...jsonData,
      tipoPessoaId:  jsonData["tipoPessoa"]["id"],
      dadosPessoaFisicaId:  jsonData["dadosPessoaFisica"]["id"]
    };
    return Object.assign(new Pessoa(), pessoas);
 }

  static toJson(jsonData: any): Pessoa {
      return Object.assign(new Pessoa(), jsonData);
  }
}
