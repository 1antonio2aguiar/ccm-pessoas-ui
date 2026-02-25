import { BaseResourceModel } from './base-resource.model';
import { Modalidade } from './modalidade';
import { Estado } from './estado';

export class Cidade extends BaseResourceModel {
    constructor(
      public override id?: number,
      public nome?: string,
      public sigla?: string,

      public estadoId?: number,
      public estado?: Estado,

    ) {
      super();
  }

  static fromJson(jsonData: any): Cidade {
    if (!jsonData) return Object.assign(new Cidade(), {} as any);

    // 1) Se vier no formato novo: { paisId: 60, paisNome: "BRASIL", ... }
    // 2) Se vier no formato antigo: { pais: { id: 60, ... }, ... }
    const cidadeId = jsonData?.cidadeId ?? jsonData?.cidade?.id ?? null;

    const cidadeNormalizado = {
      ...jsonData,
      cidadeId,
      // opcional: se você quiser popular pais quando só veio paisId/paisNome:
      // pais: jsonData?.pais ?? (paisId ? ({ id: paisId, nome: jsonData?.paisNome } as any) : null),
    };

    return Object.assign(new Cidade(), cidadeNormalizado);
  }


  static toJson(jsonData: any): Cidade {
      return Object.assign(new Cidade(), jsonData);
  }
}
