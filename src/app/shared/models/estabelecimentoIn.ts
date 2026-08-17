export class EstabelecimentoIn {

  constructor(
    public pessoaId?: number,
    public cnpj?: string,
    public nome?: string,
    public estabelecimento?: number,
    public nomeFantasia?: string,
    public objetoSocial?: string,
    public microEmpresa?: string,
    public conjuge?: string,
    public tipoEmpresa?: number,
  ) {
  }

  static fromJson(
    jsonData: any,
  ): EstabelecimentoIn {

    if (!jsonData) {
      return new EstabelecimentoIn();
    }

    return Object.assign(
      new EstabelecimentoIn(),
      jsonData,
    );
  }

  static toJson(
    model: EstabelecimentoIn,
  ): any {

    if (!model) {
      return {};
    }

    return {
      pessoaId: model.pessoaId,
      cnpj: model.cnpj,
      nome: model.nome,
      estabelecimento: model.estabelecimento,
      nomeFantasia: model.nomeFantasia,
      objetoSocial: model.objetoSocial,
      microEmpresa: model.microEmpresa,
      conjuge: model.conjuge,
      tipoEmpresa: model.tipoEmpresa,
    };
  }
}