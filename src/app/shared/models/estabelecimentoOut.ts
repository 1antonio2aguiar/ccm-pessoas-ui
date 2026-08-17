import { BaseResourceModel } from './base-resource.model';

export class EstabelecimentoOut extends BaseResourceModel {

  constructor(
    public override id?: number,
    public cnpj?: string,
    public nome?: string,
    public estabelecimento?: number,
    public nomeFantasia?: string,
    public objetoSocial?: string,
    public microEmpresa?: string,
    public conjuge?: string,
    public tipoEmpresa?: number,

    public mesEnvioSicom?: number,
    public anoEnvioSicom?: number,

    public pessoaId?: number,
    public pessoaNome?: string,
    public pessoaCpf?: string,
  ) {
    super();
  }

  static fromJson(
    jsonData: any,
  ): EstabelecimentoOut {

    if (!jsonData) {
      return new EstabelecimentoOut();
    }

    return Object.assign(
      new EstabelecimentoOut(),
      jsonData,
    );
  }
}