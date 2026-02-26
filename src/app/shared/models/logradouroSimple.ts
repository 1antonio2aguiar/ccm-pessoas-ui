export class LogradouroSimple {
  constructor(
    public id: number,
    public nome: string,
  ) {}

  // ✅ para /logradouros/filter (retorna {id, nome})
  static fromJson(json: any): LogradouroSimple {
    return new LogradouroSimple(
      Number(json?.id),
      String(json?.nome ?? ''),
    );
  }

  // ✅ (opcional) se você ainda usar /ceps/filter em algum lugar
  static fromCepJson(json: any): LogradouroSimple {
    return new LogradouroSimple(
      Number(json?.logradouroId),
      String(json?.logradouroNome ?? ''),
    );
  }
}