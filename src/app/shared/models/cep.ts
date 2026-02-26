import { Bairro } from './bairro';
import { BaseResourceModel } from './base-resource.model';
import { Logradouro } from './logradouro';

export class Cep extends BaseResourceModel {
  constructor(
    public override id?: number,
    public cep?: string,
    public numeroIni?: number,
    public numeroFim?: number,
    public identificacao?: string,

    public bairroId?: number,
    public bairroNome?: string,
    public bairro?: Bairro,

    public logradouroId?: number,
    public logradouroNome?: string,
    public logradouro?: Logradouro,

  ) {
    super();
  }

  static fromJson(jsonData: any): Cep {
    if (!jsonData) return Object.assign(new Cep(), {} as any);

    const bairroId = jsonData?.bairroId ?? jsonData?.bairro?.id ?? null;
    const bairroNome = jsonData?.bairroNome ?? jsonData?.bairro?.nome ?? null;

    const logradouroId = jsonData?.logradouroId ?? jsonData?.logradouro?.id ?? null;
    const logradouroNome = jsonData?.logradouroNome ?? jsonData?.logradouro?.nome ?? null;
    
    const normalizado = {
      ...jsonData,
      bairroId,
      bairroNome,
      logradouroId,
      logradouroNome

    };

    return Object.assign(new Cep(), normalizado);
  }

  static toJson(jsonData: any): Cep {
    return Object.assign(new Cep(), jsonData);
  }
}
