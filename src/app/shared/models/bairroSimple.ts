export class BairroSimple {
  constructor(
    public id: number,
    public nome: string,
  ) {}

  // ✅ para /logradouros/filter (retorna {id, nome})
  static fromJson(json: any): BairroSimple {
    return new BairroSimple(
      Number(json?.id),
      String(json?.nome ?? ''),
    );
  }

  // ✅ (opcional) se você ainda usar /ceps/filter em algum lugar
  static fromCepJson(json: any): BairroSimple {
    return new BairroSimple(
      Number(json?.bairroId),
      String(json?.bairroNome ?? ''),
    );
  }
}