import { Component, Input, OnInit } from '@angular/core';
import { NbDialogRef } from '@nebular/theme';

import {
  CidadeCandidatoDTO,
  CidadeOrigemDTO,
  CidadeUnificadoService,
} from '../cidade-unificado.service';

/*
 * Decisão devolvida para a tela ao fechar o diálogo.
 * Fechar sem decisão devolve undefined.
 */
export interface DecisaoCidade {
  acao: 'VINCULAR' | 'CRIAR' | 'NAO_VINCULAR';
  idUnificado?: number;
  motivo?: string;
}

@Component({
  selector: 'ngx-cidade-candidatos-dialog',
  templateUrl: './cidade-candidatos-dialog.component.html',
  styleUrls: ['./cidade-candidatos-dialog.component.scss'],
})
export class CidadeCandidatosDialogComponent implements OnInit {

  @Input()
  origem!: string;

  @Input()
  origemDescricao = 'Origem';

  @Input()
  cidade!: CidadeOrigemDTO;

  candidatosAutomaticos: CidadeCandidatoDTO[] = [];
  resultadoPesquisa: CidadeCandidatoDTO[] = [];

  pesquisa = '';
  ufPesquisa = '';

  carregando = false;
  pesquisando = false;
  pesquisou = false;

  exibirMotivo = false;
  motivo = '';

  mensagemErro = '';

  constructor(
    private dialogRef: NbDialogRef<CidadeCandidatosDialogComponent>,
    private service: CidadeUnificadoService,
  ) {}

  ngOnInit(): void {
    this.ufPesquisa = this.cidade?.uf ?? '';
    this.carregarCandidatos();
  }

  async carregarCandidatos(): Promise<void> {

    this.carregando = true;
    this.mensagemErro = '';

    try {
      this.candidatosAutomaticos =
        (await this.service.buscarCandidatos(
          this.origem,
          this.cidade.cidadeOrigem
        )) ?? [];
    } catch (e: any) {
      console.error(e);
      this.mensagemErro = this.extrairMensagem(
        e,
        'Erro ao buscar as cidades candidatas.'
      );
    } finally {
      this.carregando = false;
    }
  }

  async pesquisar(): Promise<void> {

    if (!this.pesquisa || this.pesquisa.trim().length < 3) {
      this.mensagemErro = 'Informe pelo menos 3 letras para pesquisar.';
      return;
    }

    this.pesquisando = true;
    this.mensagemErro = '';

    try {
      this.resultadoPesquisa =
        (await this.service.buscarCandidatos(
          this.origem,
          this.cidade.cidadeOrigem,
          this.pesquisa,
          this.ufPesquisa
        )) ?? [];

      this.pesquisou = true;
    } catch (e: any) {
      console.error(e);
      this.mensagemErro = this.extrairMensagem(
        e,
        'Erro ao pesquisar cidades.'
      );
    } finally {
      this.pesquisando = false;
    }
  }

  /*
   * Só é permitido criar cidade nova quando não existe
   * nenhum candidato por nome/UF ou IBGE.
   * A API faz a mesma validação.
   */
  get podeCriar(): boolean {
    return !this.carregando
      && this.candidatosAutomaticos.length === 0;
  }

  vincular(candidato: CidadeCandidatoDTO): void {
    this.dialogRef.close({
      acao: 'VINCULAR',
      idUnificado: candidato.id,
    } as DecisaoCidade);
  }

  criar(): void {
    this.dialogRef.close({
      acao: 'CRIAR',
    } as DecisaoCidade);
  }

  confirmarNaoVincular(): void {

    if (!this.exibirMotivo) {
      this.exibirMotivo = true;
      return;
    }

    this.dialogRef.close({
      acao: 'NAO_VINCULAR',
      motivo: this.motivo,
    } as DecisaoCidade);
  }

  fechar(): void {
    this.dialogRef.close();
  }

  ocupado(candidato: CidadeCandidatoDTO): boolean {
    return Number(candidato?.codigoOrigemAtual ?? 0) > 0;
  }

  descricaoCriterio(criterio: string): string {

    if (criterio === 'NOME') {
      return 'Nome + UF';
    }

    if (criterio === 'IBGE') {
      return 'Código IBGE';
    }

    return 'Pesquisa';
  }

  formatarCep(valor: any): string {

    const cep = String(valor ?? '').replace(/\D/g, '');

    if (!cep || cep === '0') {
      return '-';
    }

    return cep
      .padStart(8, '0')
      .replace(/(\d{5})(\d{3})/, '$1-$2');
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
