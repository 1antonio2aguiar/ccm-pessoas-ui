export class EstabelecimentoSelect {

  constructor(
    public id?: number,
    public nome?: string,
    public cnpj?: string,
    public nomeFantasia?: string,
  ) {
  }

  static fromJson(json: any): EstabelecimentoSelect {
    return Object.assign(
      new EstabelecimentoSelect(),
      json
    );
  }

}