import { Component, Input, OnInit } from '@angular/core';
import { NbDialogRef } from '@nebular/theme';

import {
  BairroCandidatoDTO,
  BairroOrigemDTO,
  BairroUnificadoService,
} from '../bairro-unificado.service';

/*
 * Decisão devolvida para a tela ao fechar o diálogo.
 * Fechar sem decisão devolve undefined.
 */
export interface DecisaoBairro {
  acao: 'VINCULAR' | 'CRIAR' | 'NAO_VINCULAR';
  idUnificado?: number;
  motivo?: string;
}

@Component({
  selector: 'ngx-bairro-candidatos-dialog',
  templateUrl: './bairro-candidatos-dialog.component.html',
  styleUrls: ['./bairro-candidatos-dialog.component.scss'],
})
export class BairroCandidatosDialogComponent implements OnInit {

  @Input()
  origem!: string;

  @Input()
  origemDescricao = 'Origem';

  @Input()
  bairro!: BairroOrigemDTO;

  candidatosAutomaticos: BairroCandidatoDTO[] = [];
  outrosBairros: BairroCandidatoDTO[] = [];

  pesquisa = '';

  carregando = false;
  pesquisando = false;
  pesquisou = false;

  exibirMotivo = false;
  motivo = '';

  mensagemErro = '';

  constructor(
    private dialogRef: NbDialogRef<BairroCandidatosDialogComponent>,
    private service: BairroUnificadoService,
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
    return this.bairro?.situacao === 'DISTRITO_NAO_UNIFICADO';
  }

  async carregarCandidatos(): Promise<void> {

    this.carregando = true;
    this.mensagemErro = '';

    try {
      this.candidatosAutomaticos =
        (await this.service.buscarCandidatos(
          this.origem,
          this.bairro
        )) ?? [];
    } catch (e: any) {
      console.error(e);
      this.mensagemErro = this.extrairMensagem(e, 'Erro ao buscar os bairros candidatos.');
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
      this.outrosBairros =
        (await this.service.buscarCandidatos(
          this.origem,
          this.bairro,
          pesquisa,
          todos
        )) ?? [];

      this.pesquisou = true;
    } catch (e: any) {
      console.error(e);
      this.mensagemErro = this.extrairMensagem(e, 'Erro ao pesquisar bairros.');
    } finally {
      this.pesquisando = false;
    }
  }

  /*
   * Só é permitido criar bairro novo quando o distrito está unificado
   * e não existe bairro com o mesmo nome nele. A API valida o mesmo.
   */
  get podeCriar(): boolean {
    return !this.distritoNaoUnificado
      && !this.carregando
      && this.candidatosAutomaticos.length === 0;
  }

  vincular(candidato: BairroCandidatoDTO): void {
    this.dialogRef.close({
      acao: 'VINCULAR',
      idUnificado: candidato.id,
    } as DecisaoBairro);
  }

  criar(): void {
    this.dialogRef.close({ acao: 'CRIAR' } as DecisaoBairro);
  }

  confirmarNaoVincular(): void {

    if (!this.exibirMotivo) {
      this.exibirMotivo = true;
      return;
    }

    this.dialogRef.close({
      acao: 'NAO_VINCULAR',
      motivo: this.motivo,
    } as DecisaoBairro);
  }

  fechar(): void {
    this.dialogRef.close();
  }

  ocupado(candidato: BairroCandidatoDTO): boolean {
    return Number(candidato?.codigoOrigemAtual ?? 0) > 0;
  }

  descricaoCriterio(criterio: string): string {

    if (criterio === 'NOME') {
      return 'Mesmo nome e distrito';
    }

    if (criterio === 'PESQUISA') {
      return 'Pesquisa';
    }

    return 'Bairro do distrito';
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
