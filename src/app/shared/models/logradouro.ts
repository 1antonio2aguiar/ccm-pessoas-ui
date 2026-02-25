import { BaseResourceModel } from './base-resource.model';
import { Distrito } from './distrito';

export class Logradouro extends BaseResourceModel {
  constructor(
    public override id?: number,

    public distritoId?: number,
    public distritoNome?: string,

    public nome?: string,

    public tituloPatente?: string,
    public nomeReduzido?: string,
    public nomeSimplificado?: string,
    public complemento?: string,

    public distrito?: Distrito,
  ) {
    super();
  }

  static fromJson(jsonData: any): Logradouro {
    if (!jsonData) return Object.assign(new Logradouro(), {} as any);

    const distritoId = jsonData?.distritoId ?? jsonData?.distrito?.id ?? null;
    const distritoNome = jsonData?.distritoNome ?? jsonData?.distrito?.nome ?? null;

    
    const normalizado = {
      ...jsonData,
      distritoId,
      distritoNome,
    };

    return Object.assign(new Logradouro(), normalizado);
  }

  static toJson(jsonData: any): Logradouro {
    return Object.assign(new Logradouro(), jsonData);
  }
}
