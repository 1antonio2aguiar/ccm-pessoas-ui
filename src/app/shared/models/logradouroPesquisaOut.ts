import { BaseResourceModel } from './base-resource.model';

// Interface para definir a estrutura de um objeto Bairro dentro do array
export interface Bairro {
  id: number;
  nome: string;
  // Adicione outras propriedades do bairro se sua API retornar mais (ex: sigla, etc.)
}

export class LogradouroPesquisaOut extends BaseResourceModel {
    constructor(
      public override id?: number, 
      public tipoLogradouro?: string,
      public logradouroNome?: string,        
      public bairros?: Bairro[] ,
      public cidadeNome?: string,
      public uf?: string,
      public cep?: string,
      public logradouroId?: number,
      public cepId?: number,
    ) {
      super();
      // Inicializar o array para evitar undefined errors, se preferir
       this.bairros = bairros || [];
  }

  static fromJson(jsonData: any): LogradouroPesquisaOut { 
    const instance = new LogradouroPesquisaOut(); 
    
    // Mapeia as propriedades conhecidas e o array 'bairros'
    instance.id             = jsonData.id;
    instance.tipoLogradouro = jsonData.tipoLogradouro;
    instance.logradouroNome = jsonData.logradouroNome;
    instance.cidadeNome     = jsonData.cidadeNome;
    instance.uf             = jsonData.uf;
    instance.cep            = jsonData.cep;
    instance.logradouroId   = jsonData.logradouroId;
    instance.cepId          = jsonData.cepId;

    // Mapeamento cuidadoso do array de bairros
    if (jsonData.bairros && Array.isArray(jsonData.bairros)) {
      instance.bairros = jsonData.bairros.map((bairroData: any) => ({ // Tipar bairroData se possível
        id: bairroData.id,
        nome: bairroData.nome
        
      }));

    } else {
      instance.bairros = []; 
    }

    return instance;
 }

  static toJson(instance: LogradouroPesquisaOut): any {
      return {
        id:             instance.id,
        tipoLogradouro: instance.tipoLogradouro,
        logradouroNome: instance.logradouroNome,
        cidadeNome:     instance.cidadeNome,
        uf:             instance.uf,
        cep:            instance.cep,
        logradouroId  : instance.logradouroId,
        bairros:        instance.bairros 
    };
  }
} 