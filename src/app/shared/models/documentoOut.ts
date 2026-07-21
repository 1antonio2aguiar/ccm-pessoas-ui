import { BaseResourceModel } from './base-resource.model';

export class DocumentoOut extends BaseResourceModel {

  constructor(
    public override id?: number,

    public tipoDocumento?: number,
    public tipoDocumentoDescricao?: string,

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

    public pessoaNome?: string,
    public pessoaId?: number,

    public dadosPessoaJuridicaId?: number | null,
    public estabelecimentoNome?: string | null,
    public estabelecimentoCnpj?: string | null

  ) {
    super();
  }

  static fromJson(jsonData: any): DocumentoOut {

    const documentoOut = {
      ...jsonData
    };

    return Object.assign(
      new DocumentoOut(),
      documentoOut
    );
  }
}