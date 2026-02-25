export class TipoPessoa {
  constructor(
    public id?: number,
    public descricao?: string,
  ) {}

  static fromJson(jsonData: any): TipoPessoa {
    return Object.assign(new TipoPessoa(), jsonData);
  }
}
