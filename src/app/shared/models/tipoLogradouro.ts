import { BaseResourceModel } from './base-resource.model';

export class TipoLogradouro extends BaseResourceModel {
  constructor(
    public override id?: number,
    public descricao?: string,
    public sigla?: string,
  ) {
  super();
}

  static fromJson(jsonData: any): TipoLogradouro {
      return Object.assign(new TipoLogradouro(), jsonData);
  }
}
