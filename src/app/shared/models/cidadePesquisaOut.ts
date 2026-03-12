import { BaseResourceModel } from './base-resource.model';

export class CidadePesquisaOut extends BaseResourceModel {
    constructor(
      public override id?: number, 
      public cidadeNome?: string,
      public uf?: string,
    ) {
      super();
  }

  static fromJson(jsonData: any): CidadePesquisaOut { 
    const instance = new CidadePesquisaOut(); 
    
    // Mapeia as propriedades conhecidas e o array 'bairros'
    instance.id             = jsonData.id;
    instance.cidadeNome     = jsonData.cidadeNome;
    instance.uf             = jsonData.uf;

    return instance;
 }

  static toJson(instance: CidadePesquisaOut): any {
      return {
        id:             instance.id,
        cidadeNome:     instance.cidadeNome,
        uf:             instance.uf,
    };
  }
}