import { BaseResourceModel } from './base-resource.model';

export class Pais extends BaseResourceModel {
  constructor(
    public override id?: number,
    public nome?: string,
    public sigla?: string,
    public nacionalidade?: string,
  ) {
  super();
}

  static fromJson(jsonData: any): Pais {
      return Object.assign(new Pais(), jsonData);
  }
}
