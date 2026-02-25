import { BaseResourceModel } from './base-resource.model';
import { Modalidade } from './modalidade';
import { Cidade } from './cidade';
import { Distrito } from './distrito';

export class Bairro extends BaseResourceModel {
    constructor(
      public override id?: number,
      public nome?: string,
      public nomeAbreviado?: string,

      public distritoId?: number,
      public distrito?: Distrito,

      public cidadeId?: number,
      public cidade?: Cidade,

    ) {
      super();
  }

  static fromJson(jsonData: any): Bairro {
    const bairros = {
      ...jsonData,
      distritoId: jsonData["distrito"]["id"],
      cidadeId: jsonData["cidade"]["id"]
    };
    return Object.assign(new Bairro(), bairros);
 }

  static toJson(jsonData: any): Bairro {
      return Object.assign(new Bairro(), jsonData);
  }
}
