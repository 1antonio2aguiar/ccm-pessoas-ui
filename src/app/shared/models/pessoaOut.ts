import { BaseResourceModel } from './base-resource.model';

export class PessoaOut extends BaseResourceModel {
  constructor(
    public override id?: number,
    public nome?: string,
    public fisicaJuridica?: string,

    public situacaoId?: number,
    public situacao?: number,

    public tipoPessoaId?: number,
    public tipoPessoaNome?: string,

    // PF (achatado)
    public cpf?: string,
    public sexo?: string,
    public estadoCivilId?: number,
    public estadoCivil?: string,
    public dataNascimento?: string,
    public nomeMae?: string,
    public nomePai?: string,
    public observacao?: string,

    // PJ (achatado)
    public cnpj?: string,
    public nomeFantasia?: string,
    public objetoSocial?: string,
    public microEmpresa?: 'S' | 'N',
    public tipoEmpresa?: number,

    // conveniência p/ tabela/filtro
    public cnpjCpf?: string,

    // (opcional) manter os objetos originais, caso você queira usar depois
    public dadosPessoaFisica?: any,
    public dadosPessoaJuridica?: any,
  ) {
    super();
  }

  static fromJson(jsonData: any): PessoaOut {
    if (!jsonData) return new PessoaOut();

    const pf = jsonData.dadosPessoaFisica ?? null;
    const pj = jsonData.dadosPessoaJuridica ?? null;

    const pessoaNormalizada: any = {
      ...jsonData,

      // guardar os objetos (opcional)
      dadosPessoaFisica: pf,
      dadosPessoaJuridica: pj,

      // PF achatado
      cpf: jsonData.cpf ?? pf?.cpf ?? undefined,
      sexo: jsonData.sexo ?? pf?.sexo ?? undefined,
      estadoCivilId: jsonData.estadoCivilId ?? pf?.estadoCivilId ?? undefined,
      estadoCivil: jsonData.estadoCivil ?? pf?.estadoCivil ?? undefined,
      dataNascimento: jsonData.dataNascimento ?? pf?.dataNascimento ?? undefined,

      // seu backend usa "mae"/"pai" dentro de dadosPessoaFisica
      nomeMae: jsonData.nomeMae ?? pf?.mae ?? pf?.nomeMae ?? undefined,
      nomePai: jsonData.nomePai ?? pf?.pai ?? pf?.nomePai ?? undefined,

      // observação pode existir em vários níveis
      observacao: jsonData.observacao ?? pf?.observacao ?? pj?.observacao ?? undefined,

      // PJ achatado
      cnpj: jsonData.cnpj ?? pj?.cnpj ?? undefined,
      nomeFantasia: jsonData.nomeFantasia ?? pj?.nomeFantasia ?? undefined,
      objetoSocial: jsonData.objetoSocial ?? pj?.objetoSocial ?? undefined,
      microEmpresa: jsonData.microEmpresa ?? pj?.microEmpresa ?? undefined,
      tipoEmpresa: jsonData.tipoEmpresa ?? pj?.tipoEmpresa ?? undefined,
    };

    // campo de conveniência p/ tabela
    pessoaNormalizada.cnpjCpf =
      (pessoaNormalizada.cpf ?? pessoaNormalizada.cnpj ?? '').toString();

    return Object.assign(new PessoaOut(), pessoaNormalizada);
  }

  static toJson(model: PessoaOut): any {
    if (!model) return {};

    // Se o seu backend espera PF/PJ aninhado, você pode montar aqui.
    // Vou manter compatível com ambos: envia achatado + aninhado.
    const isFisica = (model.fisicaJuridica ?? '').toUpperCase() === 'F';
    const isJuridica = (model.fisicaJuridica ?? '').toUpperCase() === 'J';

    const payload: any = { ...model };

    // montar objetos aninhados (sem atrapalhar quem já usa achatado)
    if (isFisica) {
      payload.dadosPessoaFisica = {
        ...(model.dadosPessoaFisica ?? {}),
        cpf: model.cpf,
        sexo: model.sexo,
        estadoCivilId: model.estadoCivilId,
        estadoCivil: model.estadoCivil,
        dataNascimento: model.dataNascimento,
        mae: model.nomeMae,
        pai: model.nomePai,
        observacao: model.observacao,
      };
      payload.dadosPessoaJuridica = null;
    }

    if (isJuridica) {
      payload.dadosPessoaJuridica = {
        ...(model.dadosPessoaJuridica ?? {}),
        cnpj: model.cnpj,
        nomeFantasia: model.nomeFantasia,
        objetoSocial: model.objetoSocial,
        microEmpresa: model.microEmpresa,
        tipoEmpresa: model.tipoEmpresa,
        observacao: model.observacao,
      };
      payload.dadosPessoaFisica = null;
    }

    // não precisa mandar esse campo pro backend
    delete payload.cnpjCpf;

    return payload;
  }
}