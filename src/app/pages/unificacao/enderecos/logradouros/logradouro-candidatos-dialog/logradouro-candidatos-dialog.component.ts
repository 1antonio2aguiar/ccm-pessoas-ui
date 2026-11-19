import { Component, Input, OnInit } from '@angular/core';
import { NbDialogRef } from '@nebular/theme';

import {
  LogradouroCandidatoDTO,
  LogradouroCepDTO,
  LogradouroOrigemDTO,
  LogradouroUnificadoService,
} from '../logradouro-unificado.service';

/*
 * Decisão devolvida para a tela ao fechar o diálogo.
 * Fechar sem decisão devolve undefined.
 */
export interface DecisaoLogradouro {
  acao: 'VINCULAR' | 'CRIAR' | 'NAO_VINCULAR';
  idUnificado?: number;
  motivo?: string;
  cep?: number;
}

@Component({
  selector: 'ngx-logradouro-candidatos-dialog',
  templateUrl: './logradouro-candidatos-dialog.component.html',
  styleUrls: ['./logradouro-candidatos-dialog.component.scss'],
})
export class LogradouroCandidatosDialogComponent implements OnInit {

  @Input()
  origem!: string;

  @Input()
  origemDescricao = 'Origem';

  @Input()
  logradouro!: LogradouroOrigemDTO;

  candidatosAutomaticos: LogradouroCandidatoDTO[] = [];
  outrosLogradouros: LogradouroCandidatoDTO[] = [];

  pesquisa = '';

  carregando = false;
  pesquisando = false;
  pesquisou = false;

  exibirMotivo = false;
  motivo = '';

  /*
   * Criação de logradouro novo: escolha obrigatória de um CEP que já existe
   * na tabela de CEPs dos Correios. A tela nunca cria um valor de CEP.
   */
  exibirCriacao = false;
  pesquisaCep = '';
  ceps: LogradouroCepDTO[] = [];
  cepSelecionado: LogradouroCepDTO | null = null;
  buscandoCeps = false;
  pesquisouCep = false;

  mensagemErro = '';

  constructor(
    private dialogRef: NbDialogRef<LogradouroCandidatosDialogComponent>,
    private service: LogradouroUnificadoService,
  ) {}

  ngOnInit(): void {
    if (!this.distritoNaoUnificado) {
      this.carregarCandidatos();
    }
  }

  /*
   * Sem distrito unificado não há com quem comparar.
   */
  get distritoNaoUnificado(): boolean {
    return this.logradouro?.situacao === 'DISTRITO_NAO_UNIFICADO';
  }

  async carregarCandidatos(): Promise<void> {

    this.carregando = true;
    this.mensagemErro = '';

    try {
      this.candidatosAutomaticos =
        (await this.service.buscarCandidatos(
          this.origem,
          this.logradouro
        )) ?? [];
    } catch (e: any) {
      console.error(e);
      this.mensagemErro = this.extrairMensagem(e, 'Erro ao buscar os logradouros candidatos.');
    } finally {
      this.carregando = false;
    }
  }

  async pesquisar(): Promise<void> {

    if (!this.pesquisa || this.pesquisa.trim().length < 3) {
      this.mensagemErro = 'Informe pelo menos 3 letras para pesquisar.';
      return;
    }

    await this.buscarOutros(this.pesquisa, false);
  }

  async listarTodosDoDistrito(): Promise<void> {
    await this.buscarOutros('', true);
  }

  private async buscarOutros(pesquisa: string, todos: boolean): Promise<void> {

    this.pesquisando = true;
    this.mensagemErro = '';

    try {
      this.outrosLogradouros =
        (await this.service.buscarCandidatos(
          this.origem,
          this.logradouro,
          pesquisa,
          todos
        )) ?? [];

      this.pesquisou = true;
    } catch (e: any) {
      console.error(e);
      this.mensagemErro = this.extrairMensagem(e, 'Erro ao pesquisar logradouros.');
    } finally {
      this.pesquisando = false;
    }
  }

  /*
   * Só é permitido criar logradouro novo quando o distrito está unificado
   * e não existe logradouro com o mesmo nome e tipo compatível nele
   * (os de tipo diferente não impedem). A API valida o mesmo.
   */
  get podeCriar(): boolean {
    return !this.distritoNaoUnificado
      && !this.carregando
      && !this.candidatosAutomaticos.some((c) => c.criterio === 'NOME');
  }

  get tipoDiferente(): boolean {
    return this.candidatosAutomaticos.length > 0
      && this.candidatosAutomaticos.every((c) => c.criterio === 'TIPO_DIFERENTE');
  }

  vincular(candidato: LogradouroCandidatoDTO): void {
    this.dialogRef.close({
      acao: 'VINCULAR',
      idUnificado: candidato.id,
    } as DecisaoLogradouro);
  }

  /*
   * Primeiro clique: abre a escolha do CEP (já traz o CEP da origem, se válido).
   * Segundo clique: confirma com o CEP escolhido.
   */
  async criar(): Promise<void> {

    if (!this.exibirCriacao) {
      this.exibirCriacao = true;
      this.exibirMotivo = false;
      await this.buscarCeps('');
      return;
    }

    if (!this.cepSelecionado) {
      this.mensagemErro = 'Escolha um CEP da lista para criar o logradouro.';
      return;
    }

    this.dialogRef.close({
      acao: 'CRIAR',
      cep: this.cepSelecionado.cep,
    } as DecisaoLogradouro);
  }

  async pesquisarCeps(): Promise<void> {

    const texto = (this.pesquisaCep ?? '').trim();
    const digitos = texto.replace(/\D/g, '');
    const soNumero = texto.length > 0 && texto.replace(/[0-9.\-\s]/g, '').length === 0;

    if (soNumero ? digitos.length < 3 : texto.length < 3) {
      this.mensagemErro = 'Informe pelo menos 3 números do CEP ou 3 letras do nome de um logradouro vizinho.';
      return;
    }

    await this.buscarCeps(texto);
  }

  private async buscarCeps(pesquisa: string): Promise<void> {

    this.buscandoCeps = true;
    this.mensagemErro = '';
    this.cepSelecionado = null;

    try {
      this.ceps = (await this.service.buscarCeps(this.origem, this.logradouro, pesquisa)) ?? [];
      this.pesquisouCep = pesquisa.length > 0 || this.ceps.length > 0;

      if (!pesquisa && this.ceps.length === 1) {
        this.cepSelecionado = this.ceps[0];
      }
    } catch (e: any) {
      console.error(e);
      this.mensagemErro = this.extrairMensagem(e, 'Erro ao buscar os CEPs.');
    } finally {
      this.buscandoCeps = false;
    }
  }

  selecionarCep(cep: LogradouroCepDTO): void {
    this.cepSelecionado = cep;
    this.mensagemErro = '';
  }

  formatarCep(cep: number | null | undefined): string {

    if (cep === null || cep === undefined) {
      return '-';
    }

    const texto = String(cep).padStart(8, '0');

    return `${texto.substring(0, 5)}-${texto.substring(5)}`;
  }

  faixaCep(c: LogradouroCepDTO): string {

    if (c.complemento) {
      return c.complemento;
    }

    if (c.numeroIni || c.numeroFim) {
      return `${c.numeroIni ?? ''} a ${c.numeroFim ?? 'fim'}`;
    }

    return '-';
  }

  confirmarNaoVincular(): void {

    if (!this.exibirMotivo) {
      this.exibirMotivo = true;
      this.exibirCriacao = false;
      return;
    }

    this.dialogRef.close({
      acao: 'NAO_VINCULAR',
      motivo: this.motivo,
    } as DecisaoLogradouro);
  }

  fechar(): void {
    this.dialogRef.close();
  }

  ocupado(candidato: LogradouroCandidatoDTO): boolean {
    return Number(candidato?.codigoOrigemAtual ?? 0) > 0;
  }

  descricaoCriterio(criterio: string): string {

    if (criterio === 'NOME') {
      return 'Mesmo nome e distrito';
    }

    if (criterio === 'TIPO_DIFERENTE') {
      return 'Mesmo nome, tipo diferente';
    }

    if (criterio === 'PESQUISA') {
      return 'Pesquisa';
    }

    return 'Logradouro do distrito';
  }

  private extrairMensagem(e: any, padrao: string): string {

    if (typeof e?.error === 'string' && e.error.trim()) {
      return e.error.trim();
    }

    if (e?.error?.message) {
      return e.error.message;
    }

    return e?.message || padrao;
  }
}
