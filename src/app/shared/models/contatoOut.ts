// endereco.ts
import { BaseResourceModel } from './base-resource.model';

export class ContatoOut extends BaseResourceModel {
  constructor(
    public id?: number,
    public tipoContato?: number,
    public tipoContatoDescricao?: string,
    public contato?: string,
    public complemento?: string,
    public principal?: string,
    
    public pessoaNome?: string,
    public pessoaId?: number,

  ) {
      super();
  }

  static fromJson(jsonData: any): ContatoOut {
    const contatos = {
      ...jsonData,
    };
    return Object.assign(new ContatoOut(), contatos);
 }
}
