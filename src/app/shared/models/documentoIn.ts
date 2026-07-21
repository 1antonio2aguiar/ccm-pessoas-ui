import { BaseResourceModel } from './base-resource.model';

export class DocumentoIn extends BaseResourceModel {

  constructor(
    public override id?: number,

    public tipoDocumento?: number,
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

    public dadosPessoaJuridicaId?: number | null

  ) {
    super();
  }

  static fromJson(jsonData: any): DocumentoIn {

    const documentoIn = {
      ...jsonData
    };

    return Object.assign(
      new DocumentoIn(),
      documentoIn
    );
  }

  static toJson(jsonData: any): DocumentoIn {

    return Object.assign(
      new DocumentoIn(),
      jsonData
    );
  }
}