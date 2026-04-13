import { BaseResourceModel } from '../base-resource.model';

export class PesPessoas extends BaseResourceModel {
  constructor(
    public override id?: number,
    public nome?: string,
    public fisicaJuridica?: string,
    public dataCadastro?: string,
    public cgcCpf?: number,

    public tipoPessoa?: number,
    public tipoPessoaDescricao?: string,

    public cidade?: number,
    public cidadeNome?: string,
    public uf?: string,

    public distrito?: number,
    public distritoNome?: string,

    public bairro?: number,
    public bairroNome?: string,

    public logradouro?: number,
    public logradouroNome?: string,
    public tipoLogradouro?: string,
    public numero?: number,
    public complemento?: string,
    public cep?: number,

    public dataNascimento?: string,
    public estadoCivil?: string,
    public sexo?: string,

    public telefone?: number,
    public recado?: number,
    public celular?: number,
    public fax?: number,
    public email?: string,
    public paginaWeb?: string,

    public mae?: string,
    public pai?: string,

    public observacao?: string,
    public nomeSocial?: string,
    public deficiente?: string
  ) {
    super();
  }

  static fromJson(jsonData: any): PesPessoas {
    return Object.assign(new PesPessoas(), {
      id: jsonData.pessoa,
      nome: jsonData.nome,
      fisicaJuridica: jsonData.fisicaJuridica,
      dataCadastro: jsonData.dataCadastro,
      cgcCpf: jsonData.cgcCpf,

      tipoPessoa: jsonData.tipoPessoa,
      tipoPessoaDescricao: jsonData.tipoPessoaDescricao,

      cidade: jsonData.cidade,
      cidadeNome: jsonData.cidadeNome,
      uf: jsonData.uf,

      distrito: jsonData.distrito,
      distritoNome: jsonData.distritoNome,

      bairro: jsonData.bairro,
      bairroNome: jsonData.bairroNome,

      logradouro: jsonData.logradouro,
      logradouroNome: jsonData.logradouroNome,
      tipoLogradouro: jsonData.tipoLogradouro,
      numero: jsonData.numero,
      complemento: jsonData.complemento,
      cep: jsonData.cep,

      dataNascimento: jsonData.dataNascimento,
      estadoCivil: jsonData.estadoCivil,
      sexo: jsonData.sexo,

      telefone: jsonData.telefone,
      recado: jsonData.recado,
      celular: jsonData.celular,
      fax: jsonData.fax,
      email: jsonData.email,
      paginaWeb: jsonData.paginaWeb,

      mae: jsonData.mae,
      pai: jsonData.pai,

      observacao: jsonData.observacao,
      nomeSocial: jsonData.nomeSocial,
      deficiente: jsonData.deficiente
    });
  }

  static toJson(pesPessoa: PesPessoas): any {
    return {
      pessoa: pesPessoa.id,
      nome: pesPessoa.nome,
      fisicaJuridica: pesPessoa.fisicaJuridica,
      dataCadastro: pesPessoa.dataCadastro,
      cgcCpf: pesPessoa.cgcCpf,

      tipoPessoa: pesPessoa.tipoPessoa,

      cidade: pesPessoa.cidade,
      distrito: pesPessoa.distrito,
      bairro: pesPessoa.bairro,
      logradouro: pesPessoa.logradouro,

      numero: pesPessoa.numero,
      complemento: pesPessoa.complemento,
      cep: pesPessoa.cep,

      dataNascimento: pesPessoa.dataNascimento,
      estadoCivil: pesPessoa.estadoCivil,
      sexo: pesPessoa.sexo,

      telefone: pesPessoa.telefone,
      recado: pesPessoa.recado,
      celular: pesPessoa.celular,
      fax: pesPessoa.fax,
      email: pesPessoa.email,
      paginaWeb: pesPessoa.paginaWeb,

      mae: pesPessoa.mae,
      pai: pesPessoa.pai,

      observacao: pesPessoa.observacao,
      nomeSocial: pesPessoa.nomeSocial,
      deficiente: pesPessoa.deficiente
    };
  }
}