import { BaseResourceModel } from './base-resource.model';

export class PessoaIn extends BaseResourceModel {
    constructor(

      public override id?: number | null,
      public nome?: string,
      public fisicaJuridica?: 'F' | 'J',
      public situacao?: number, // << DEVE SER NUMBER
      public tipoPessoaId?: number,
      public tipoPessoaNome?: string,
      public observacao?: string,

      // PF
      public cpf?: string,
      public sexo?: string,
      public estadoCivil?: number,
      public dataNascimento?: string, // Formato 'YYYY-MM-DD'
      public nomeMae?: string,
      public nomePai?: string,

      // PJ
      public cnpj?: string,
      public nomeFantasia?: string,
      public objetoSocial?: string,
      public microEmpresa?: 'S' | 'N',
      public tipoEmpresa?: number,

      public cnpjCpf?: string,

    ) {
      super();
  }

  static fromJson(jsonData: any): PessoaIn {
    const pessoasIn = {
      ...jsonData
    };
    
    return Object.assign(new PessoaIn(), pessoasIn);
 }

  static toJson(jsonData: any): PessoaIn {
      return Object.assign(new PessoaIn(), jsonData);
  }
}
