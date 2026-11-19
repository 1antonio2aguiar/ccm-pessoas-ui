import { Component, Input, OnInit } from '@angular/core';
import { NbDialogRef } from '@nebular/theme';

import {
  DistritoCandidatoDTO,
  DistritoOrigemDTO,
  DistritoUnificadoService,
} from '../distrito-unificado.service';

/*
 * Decisão devolvida para a tela ao fechar o diálogo.
 * Fechar sem decisão devolve undefined.
 */
export interface DecisaoDistrito {
  acao: 'VINCULAR' | 'CRIAR' | 'NAO_VINCULAR';
  idUnificado?: number;
  motivo?: string;
}

@Component({
  selector: 'ngx-distrito-candidatos-dialog',
  templateUrl: './distrito-candidatos-dialog.component.html',
  styleUrls: ['./distrito-candidatos-dialog.component.scss'],
})
export class DistritoCandidatosDialogComponent implements OnInit {

  @Input()
  origem!: string;

  @Input()
  origemDescricao = 'Origem';

  @Input()
  distrito!: DistritoOrigemDTO;

  candidatosAutomaticos: DistritoCandidatoDTO[] = [];
  outrosDistritos: DistritoCandidatoDTO[] = [];

  pesquisa = '';

  carregando = false;
  pesquisando = false;
  pesquisou = false;

  exibirMotivo = false;
  motivo = '';

  mensagemErro = '';

  constructor(
    private dialogRef: NbDialogRef<DistritoCandidatosDialogComponent>,
    private service: DistritoUnificadoService,
  ) {}

  ngOnInit(): void {
    if (!this.cidadeNaoUnificada) {
      this.carregarCandidatos();
    }
  }

  /*
   * Sem cidade unificada não há com quem comparar.
   */
  get cidadeNaoUnificada(): boolean {
    return this.distrito?.situacao === 'CIDADE_NAO_UNIFICADA';
  }

  async carregarCandidatos(): Promise<void> {

    this.carregando = true;
    this.mensagemErro = '';

    try {
      this.candidatosAutomaticos =
        (await this.service.buscarCandidatos(
          this.origem,
          this.distrito.cidadeOrigem,
          this.distrito.distritoOrigem
        )) ?? [];
    } catch (e: any) {
      console.error(e);
      this.mensagemErro = this.extrairMensagem(e, 'Erro ao buscar os distritos candidatos.');
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

  async listarTodosDaCidade(): Promise<void> {
    await this.buscarOutros('', true);
  }

  private async buscarOutros(pesquisa: string, todos: boolean): Promise<void> {

    this.pesquisando = true;
    this.mensagemErro = '';

    try {
      this.outrosDistritos =
        (await this.service.buscarCandidatos(
          this.origem,
          this.distrito.cidadeOrigem,
          this.distrito.distritoOrigem,
          pesquisa,
          todos
        )) ?? [];

      this.pesquisou = true;
    } catch (e: any) {
      console.error(e);
      this.mensagemErro = this.extrairMensagem(e, 'Erro ao pesquisar distritos.');
    } finally {
      this.pesquisando = false;
    }
  }

  /*
   * Só é permitido criar distrito novo quando a cidade está unificada
   * e não existe distrito com o mesmo nome nela. A API valida o mesmo.
   */
  get podeCriar(): boolean {
    return !this.cidadeNaoUnificada
      && !this.carregando
      && this.candidatosAutomaticos.length === 0;
  }

  vincular(candidato: DistritoCandidatoDTO): void {
    this.dialogRef.close({
      acao: 'VINCULAR',
      idUnificado: candidato.id,
    } as DecisaoDistrito);
  }

  criar(): void {
    this.dialogRef.close({ acao: 'CRIAR' } as DecisaoDistrito);
  }

  confirmarNaoVincular(): void {

    if (!this.exibirMotivo) {
      this.exibirMotivo = true;
      return;
    }

    this.dialogRef.close({
      acao: 'NAO_VINCULAR',
      motivo: this.motivo,
    } as DecisaoDistrito);
  }

  fechar(): void {
    this.dialogRef.close();
  }

  ocupado(candidato: DistritoCandidatoDTO): boolean {
    return Number(candidato?.codigoOrigemAtual ?? 0) > 0;
  }

  descricaoCriterio(criterio: string): string {

    if (criterio === 'NOME') {
      return 'Mesmo nome';
    }

    if (criterio === 'PESQUISA') {
      return 'Pesquisa';
    }

    return 'Distrito da cidade';
  }

  formatarCep(valor: any): string {

    const cep = String(valor ?? '').replace(/\D/g, '');

    if (!cep || cep === '0') {
      return '-';
    }

    return cep.padStart(8, '0').replace(/(\d{5})(\d{3})/, '$1-$2');
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
