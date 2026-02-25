import { BaseResourceModel } from './base-resource.model';
import { Cidade } from './cidade';

export class Distrito extends BaseResourceModel {
  constructor(
    public override id?: number,
    public nome?: string,

    public cidadeId?: number,
    public cidadeNome?: string,   // <<< MUITO útil pro dropdown e grid
    public cidade?: Cidade,       // <<< se algum endpoint vier com objeto
  ) {
    super();
  }

  static fromJson(jsonData: any): Distrito {
    if (!jsonData) return new Distrito();

    const cidadeObj = jsonData['cidade'];

    const distrito = {
      ...jsonData,

      // PRIORIDADE: cidadeId direto do payload; senão tenta cidade.id
      cidadeId: jsonData['cidadeId'] ?? cidadeObj?.id ?? jsonData['cidade_id'] ?? null,

      // PRIORIDADE: cidadeNome direto; senão tenta cidade.nome
      cidadeNome: jsonData['cidadeNome'] ?? cidadeObj?.nome ?? jsonData['cidade_nome'] ?? null,
    };

    return Object.assign(new Distrito(), distrito);
  }

  static toJson(jsonData: any): Distrito {
    return Object.assign(new Distrito(), jsonData);
  }
}