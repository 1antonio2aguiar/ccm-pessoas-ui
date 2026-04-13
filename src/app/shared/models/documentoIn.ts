import { BaseResourceModel } from './base-resource.model';

export class DocumentoIn extends BaseResourceModel {
    constructor(
      public override id?: number,
      public tipoDocumento?: string,
      public numeroDocumento?: string,
      public dataDocumento?: Date,
      public dataExpedicao?: Date,
      public documentoOrigem?: string,
      public orgaoExpedidor?: string,
      public dataPrimeiraCnh?: Date,
      public dataValidade?: Date,
      public categoriaCnh?: string,
      public zona?: number,
      public secao?: number,
      public observacao?: string,

      public pessoaId?: number,

    ) {
      super();
  }

  static fromJson(jsonData: any): DocumentoIn {
    const documentosIn = {
      ...jsonData
    };
    return Object.assign(new DocumentoIn(), documentosIn);
  }

  static toJson(jsonData: any): DocumentoIn {
      return Object.assign(new DocumentoIn(), jsonData);
  }
}
