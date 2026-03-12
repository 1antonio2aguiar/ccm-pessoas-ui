import { BaseResourceModel } from './base-resource.model';

export interface Bairro {
  id: number;
  nome: string;
}

export class CepOut extends BaseResourceModel {
  constructor(
    public override id?: number,
    public cep?: string,
    public numeroIni?: number,
    public numeroFim?: number,
    public identificacao?: string,
    public tipoLogradouro?: string,
    public logradouroId?: number,
    public logradouroNome?: string,
    public distritoId?: number,
    public distritoNome?: string,
    public cidadeId?: number,
    public cidadeNome?: string,
    public estadoUf?: string,
    public bairros?: Bairro[]
  ) {
    super();
    this.bairros = bairros || [];
  }

  static fromJson(jsonData: any): CepOut {
    const instance = new CepOut();

    instance.id = jsonData.id;
    instance.cep = jsonData.cep;
    instance.numeroIni = jsonData.numeroIni;
    instance.numeroFim = jsonData.numeroFim;
    instance.identificacao = jsonData.identificacao;
    instance.tipoLogradouro = jsonData.tipoLogradouro;
    instance.logradouroId = jsonData.logradouroId;
    instance.logradouroNome = jsonData.logradouroNome;
    instance.distritoId = jsonData.distritoId;
    instance.distritoNome = jsonData.distritoNome;
    instance.cidadeId = jsonData.cidadeId;
    instance.cidadeNome = jsonData.cidadeNome;
    instance.estadoUf = jsonData.estadoUf;

    if (jsonData.bairros && Array.isArray(jsonData.bairros)) {
      instance.bairros = jsonData.bairros.map((bairroData: any) => ({
        id: bairroData.id,
        nome: bairroData.nome,
      }));
    } else {
      instance.bairros = [];
    }

    return instance;
  }

  static toJson(instance: CepOut): any {
    return {
      id: instance.id,
      cep: instance.cep,
      numeroIni: instance.numeroIni,
      numeroFim: instance.numeroFim,
      identificacao: instance.identificacao,
      tipoLogradouro: instance.tipoLogradouro,
      logradouroId: instance.logradouroId,
      logradouroNome: instance.logradouroNome,
      distritoId: instance.distritoId,
      distritoNome: instance.distritoNome,
      cidadeId: instance.cidadeId,
      cidadeNome: instance.cidadeNome,
      estadoUf: instance.estadoUf,
      bairros: instance.bairros,
    };
  }
}