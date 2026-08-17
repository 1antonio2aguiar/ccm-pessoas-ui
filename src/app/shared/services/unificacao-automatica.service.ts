import { Injectable } from '@angular/core';

export type DecisaoUnificacao =
  | 'AUTOMATICA'
  | 'EXIGIR_CONFIRMACAO'
  | 'INVALIDA';

export interface PessoaParaComparacao {
  nome?: string | null;
  cpfCnpj?: string | number | null;
  dataNascimento?: string | Date | null;
}

export interface ResultadoUnificacaoAutomatica {
  decisao: DecisaoUnificacao;
  automatica: boolean;
  motivo: string;
  distanciaNomes: number | null;
}

@Injectable({
  providedIn: 'root',
})

export class UnificacaoAutomaticaService {

  avaliar(
    pessoaOrigem: PessoaParaComparacao,
    pessoaCadUnico: PessoaParaComparacao
  ): ResultadoUnificacaoAutomatica {

    const documentoOrigem =
      this.normalizarDocumento(
        pessoaOrigem?.cpfCnpj
      );

    const documentoCadUnico =
      this.normalizarDocumento(
        pessoaCadUnico?.cpfCnpj
      );

    /*
     * Sem os documentos não é possível realizar
     * uma comparação segura.
     */
    if (
      !documentoOrigem ||
      !documentoCadUnico
    ) {
      return {
        decisao: 'INVALIDA',
        automatica: false,
        motivo:
          'CPF/CNPJ não informado para comparação.',
        distanciaNomes: null,
      };
    }

    /*
     * Documentos diferentes nunca podem resultar
     * em unificação automática.
     */
    if (
      documentoOrigem !==
      documentoCadUnico
    ) {
      return {
        decisao: 'INVALIDA',
        automatica: false,
        motivo:
          'Os documentos informados são diferentes.',
        distanciaNomes: null,
      };
    }

    const nomeOrigem =
      this.normalizarNome(
        pessoaOrigem?.nome
      );

    const nomeCadUnico =
      this.normalizarNome(
        pessoaCadUnico?.nome
      );

    /*
     * Com CPF igual, mas sem os dois nomes,
     * a decisão precisa continuar com o usuário.
     */
    if (
      !nomeOrigem ||
      !nomeCadUnico
    ) {
      return {
        decisao: 'EXIGIR_CONFIRMACAO',
        automatica: false,
        motivo:
          'Não foi possível comparar os nomes.',
        distanciaNomes: null,
      };
    }

    /*
     * Regra específica para espólio:
     *
     * O documento já foi validado como igual.
     * Se a única diferença entre os nomes for
     * ESPÓLIO/ESPOLIO no final, a unificação
     * pode ser realizada automaticamente.
     */
    const nomeOrigemSemEspolio =
      this.normalizarNomeSemEspolio(
        pessoaOrigem?.nome
      );

    const nomeCadUnicoSemEspolio =
      this.normalizarNomeSemEspolio(
        pessoaCadUnico?.nome
      );

    const existeIndicadorEspolio =
      nomeOrigemSemEspolio !== nomeOrigem ||
      nomeCadUnicoSemEspolio !== nomeCadUnico;

    if (
      existeIndicadorEspolio &&
      nomeOrigemSemEspolio.length > 0 &&
      nomeCadUnicoSemEspolio.length > 0 &&
      nomeOrigemSemEspolio === nomeCadUnicoSemEspolio
    ) {
      return {
        decisao: 'AUTOMATICA',
        automatica: true,
        motivo:
          'CPF/CNPJ e nomes são equivalentes, desconsiderando o indicador de espólio.',
        distanciaNomes: null,
      };
    }

    /*
     * Regra que já existia:
     * documento e nomes normalizados iguais.
     */
    if (
      nomeOrigem ===
      nomeCadUnico
    ) {
      return {
        decisao: 'AUTOMATICA',
        automatica: true,
        motivo:
          'CPF/CNPJ e nomes são iguais.',
        distanciaNomes: 0,
      };
    }

    const dataOrigem =
  this.normalizarData(
    pessoaOrigem?.dataNascimento
  );

const dataCadUnico =
  this.normalizarData(
    pessoaCadUnico?.dataNascimento
  );

const datasIguais =
  dataOrigem.length > 0 &&
  dataCadUnico.length > 0 &&
  dataOrigem === dataCadUnico;

/*
 * Regra para partículas de ligação:
 *
 * CPF/CNPJ já foi validado como igual.
 * As datas precisam estar preenchidas e iguais.
 * A única diferença entre os nomes deve ser
 * uma partícula como DE, DA, DO, DAS, DOS ou E.
 */
const nomeOrigemSemParticulas =
  this.normalizarNomeSemParticulas(
    pessoaOrigem?.nome
  );

const nomeCadUnicoSemParticulas =
  this.normalizarNomeSemParticulas(
    pessoaCadUnico?.nome
  );

const nomesSemParticulasIguais =
  nomeOrigemSemParticulas.length > 0 &&
  nomeCadUnicoSemParticulas.length > 0 &&
  nomeOrigemSemParticulas ===
    nomeCadUnicoSemParticulas;

/*
 * Evita entrar nessa regra quando os nomes
 * já eram iguais sem retirar partículas.
 *
 * Normalmente o retorno de nomes iguais já
 * aconteceu anteriormente, mas esta condição
 * deixa a intenção explícita.
 */
const existeDiferencaSomenteDeParticulas =
  nomeOrigem !== nomeCadUnico &&
  nomesSemParticulasIguais;

if (
  datasIguais &&
  existeDiferencaSomenteDeParticulas
) {
  return {
    decisao: 'AUTOMATICA',
    automatica: true,
    motivo:
      'Documento, nascimento e nomes são equivalentes, desconsiderando partículas de ligação.',
    distanciaNomes: null,
  };
}

/*
 * Daqui para baixo continua exatamente
 * o código que já existia.
 */
const nomeOrigemSemEspacos =
  existeIndicadorEspolio
    ? nomeOrigemSemEspolio
    : nomeOrigem;

const nomeCadUnicoSemEspacos =
  existeIndicadorEspolio
    ? nomeCadUnicoSemEspolio
    : nomeCadUnico;

const tamanhoMinimoAtendido =
  nomeOrigemSemEspacos.length >= 10 &&
  nomeCadUnicoSemEspacos.length >= 10;

const distanciaNomes =
  this.calcularDistanciaEdicao(
    nomeOrigemSemEspacos,
    nomeCadUnicoSemEspacos
  );

    /*
     * Nova regra:
     *
     * 1. documento igual;
     * 2. nascimento igual;
     * 3. nomes suficientemente longos;
     * 4. apenas uma alteração entre os nomes.
     */
    if (
      datasIguais &&
      tamanhoMinimoAtendido &&
      distanciaNomes === 1
    ) {
      return {
        decisao: 'AUTOMATICA',
        automatica: true,
        motivo:
          'Documento e nascimento são iguais, com diferença de apenas uma letra no nome.',
        distanciaNomes,
      };
    }

    /*
     * O documento é igual, mas os demais dados
     * não atendem à regra automática.
     */
    return {
      decisao: 'EXIGIR_CONFIRMACAO',
      automatica: false,
      motivo:
        this.montarMotivoConfirmacao(
          datasIguais,
          tamanhoMinimoAtendido,
          distanciaNomes
        ),
      distanciaNomes,
    };
  }

  private normalizarDocumento(
    valor: string | number | null | undefined
  ): string {

    const documento =
      String(valor ?? '')
        .replace(/\D/g, '');

    if (!documento) {
      return '';
    }

    /*
     * Recupera zeros à esquerda quando o documento
     * foi recebido como número.
     */
    if (documento.length <= 11) {
      return documento.padStart(
        11,
        '0'
      );
    }

    if (documento.length <= 14) {
      return documento.padStart(
        14,
        '0'
      );
    }

    return documento;
  }

  private normalizarNome(
    valor: string | null | undefined
  ): string {

    return String(valor ?? '')
      .normalize('NFKD')
      .replace(
        /[\u0300-\u036f]/g,
        ''
      )
      .toUpperCase()
      .replace(
        /[^A-Z0-9]/g,
        ''
      );
  }

  private normalizarData(
    valor: string | Date | null | undefined
  ): string {

    if (!valor) {
      return '';
    }

    if (valor instanceof Date) {

      if (Number.isNaN(valor.getTime())) {
        return '';
      }

      const ano =
        String(
          valor.getFullYear()
        );

      const mes =
        String(
          valor.getMonth() + 1
        ).padStart(2, '0');

      const dia =
        String(
          valor.getDate()
        ).padStart(2, '0');

      return `${ano}-${mes}-${dia}`;
    }

    const texto =
      String(valor).trim();

    /*
     * Formato recebido do backend:
     * 1975-03-27 ou 1975-03-27T00:00:00
     */
    const formatoIso =
      texto.match(
        /^(\d{4})-(\d{2})-(\d{2})/
      );

    if (formatoIso) {
      return (
        `${formatoIso[1]}-` +
        `${formatoIso[2]}-` +
        `${formatoIso[3]}`
      );
    }

    /*
     * Formato utilizado na tela:
     * 27/03/1975
     */
    const formatoBrasileiro =
      texto.match(
        /^(\d{2})\/(\d{2})\/(\d{4})$/
      );

    if (formatoBrasileiro) {
      return (
        `${formatoBrasileiro[3]}-` +
        `${formatoBrasileiro[2]}-` +
        `${formatoBrasileiro[1]}`
      );
    }

    return '';
  }

  private calcularDistanciaEdicao(
    primeiroValor: string,
    segundoValor: string
  ): number {

    const primeiro =
      primeiroValor ?? '';

    const segundo =
      segundoValor ?? '';

    if (primeiro === segundo) {
      return 0;
    }

    if (!primeiro.length) {
      return segundo.length;
    }

    if (!segundo.length) {
      return primeiro.length;
    }

    /*
     * Matriz usada pelo algoritmo de Levenshtein.
     *
     * Cada posição guarda quantas alterações são
     * necessárias para transformar parte do primeiro
     * nome na parte correspondente do segundo nome.
     */
    const matriz: number[][] =
      Array.from(
        {
          length:
            primeiro.length + 1,
        },
        () =>
          new Array(
            segundo.length + 1
          ).fill(0)
      );

    for (
      let linha = 0;
      linha <= primeiro.length;
      linha++
    ) {
      matriz[linha][0] = linha;
    }

    for (
      let coluna = 0;
      coluna <= segundo.length;
      coluna++
    ) {
      matriz[0][coluna] = coluna;
    }

    for (
      let linha = 1;
      linha <= primeiro.length;
      linha++
    ) {

      for (
        let coluna = 1;
        coluna <= segundo.length;
        coluna++
      ) {

        const custo =
          primeiro.charAt(linha - 1) ===
            segundo.charAt(coluna - 1)
            ? 0
            : 1;

        matriz[linha][coluna] =
          Math.min(
            matriz[linha - 1][coluna] + 1,
            matriz[linha][coluna - 1] + 1,
            matriz[linha - 1][coluna - 1] + custo
          );
      }
    }

    return matriz[
      primeiro.length
    ][
      segundo.length
    ];
  }

  private montarMotivoConfirmacao(
    datasIguais: boolean,
    tamanhoMinimoAtendido: boolean,
    distanciaNomes: number
  ): string {

    if (!datasIguais) {
      return (
        'O CPF/CNPJ é igual, mas as datas de nascimento ' +
        'não são iguais ou não estão preenchidas.'
      );
    }

    if (!tamanhoMinimoAtendido) {
      return (
        'Os nomes são muito curtos para realizar ' +
        'a unificação automática com segurança.'
      );
    }

    return (
      'O CPF/CNPJ é igual, mas os nomes possuem ' +
      `${distanciaNomes} alterações.`
    );
  }

  private normalizarNomeSemEspolio(
    valor: string | null | undefined
  ): string {

    return String(valor ?? '')
      .normalize('NFD')
      .replace(
        /[\u0300-\u036f]/g,
        ''
      )
      .toUpperCase()

      /*
       * Remove somente ESPOLIO no final:
       *
       * NOME (ESPOLIO)
       * NOME ESPOLIO
       * NOME(ESPOLIO)
       */
      .replace(
        /\s*\(\s*ESPOLIO\s*\)\s*$/,
        ''
      )
      .replace(
        /\s+ESPOLIO\s*$/,
        ''
      )
      .replace(
        /[^A-Z0-9]/g,
        ''
      );
  }

  private normalizarNomeSemParticulas(
    valor: string | null | undefined
  ): string {

    return String(valor ?? '')
      .normalize('NFD')
      .replace(
        /[\u0300-\u036f]/g,
        ''
      )
      .toUpperCase()
      .replace(
        /[^A-Z0-9\s]/g,
        ' '
      )
      .split(/\s+/)
      .filter(
        parte =>
          parte.length > 0 &&
          ![
            'DE',
            'DA',
            'DO',
            'DAS',
            'DOS',
            'E',
          ].includes(parte)
      )
      .join('');
  }
}