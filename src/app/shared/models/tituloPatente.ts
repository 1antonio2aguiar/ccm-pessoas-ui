import { BaseResourceModel } from './base-resource.model';

export class TituloPatente extends BaseResourceModel {
  constructor(
    public override id?: number,
    public descricao?: string,
  ) {
  super();
}

  static fromJson(jsonData: any): TituloPatente {
      return Object.assign(new TituloPatente(), jsonData);
  }
}
