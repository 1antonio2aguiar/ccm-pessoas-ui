import { Empresa } from './empresa';
import { BaseResourceModel } from './base-resource.model';
import { Modalidade } from './modalidade';
import { Pais } from './pais';

export class Estado extends BaseResourceModel {
    constructor(
      public override id?: number,
      public nome?: string,
      public uf?: string,

      public paisId?: number,
      public pais?: Pais,

    ) {
      super();
  }

  static fromJson(jsonData: any): Estado {
    if (!jsonData) return Object.assign(new Estado(), {} as any);

    // 1) Se vier no formato novo: { paisId: 60, paisNome: "BRASIL", ... }
    // 2) Se vier no formato antigo: { pais: { id: 60, ... }, ... }
    const paisId = jsonData?.paisId ?? jsonData?.pais?.id ?? null;

    const estadoNormalizado = {
      ...jsonData,
      paisId,
      // opcional: se você quiser popular pais quando só veio paisId/paisNome:
      // pais: jsonData?.pais ?? (paisId ? ({ id: paisId, nome: jsonData?.paisNome } as any) : null),
    };

    return Object.assign(new Estado(), estadoNormalizado);
  }

  static toJson(jsonData: any): Estado {
      return Object.assign(new Estado(), jsonData);
  }
}
