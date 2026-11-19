import { Component, OnInit } from '@angular/core';
import { NbToastrService } from '@nebular/theme';

import {
  ConsolidacaoEnderecosService,
  ConsolidacaoResultadoDTO,
  ConsolidacaoResumoDTO,
  NivelConsolidacaoDTO,
} from '../consolidacao-enderecos.service';

interface LinhaNivel {
  nivel: NivelConsolidacaoDTO;
  resumo: ConsolidacaoResumoDTO | null;
  carregando: boolean;
  erro: string;
  resultado: ConsolidacaoResultadoDTO | null;
}

/*
 * Consolidação (fase 2): *_UNIFICADO -> DBO_UNI_PESSOAS.CIDADES / DISTRITOS /
 * BAIRROS / LOGRADOUROS / CEPS. Substitui as procedures *_UNIFICA.
 *
 * Os números de cada nível são carregados um de cada vez (logradouros e CEPs
 * passam de 1 milhão de linhas).
 */
@Component({
  selector: 'ngx-consolidacao-enderecos-iud',
  templateUrl: './consolidacao-enderecos-iud.component.html',
  styleUrls: ['./consolidacao-enderecos-iud.component.scss'],
})
export class ConsolidacaoEnderecosIudComponent implements OnInit {

  linhas: LinhaNivel[] = [];

  processando = false;
  nivelProcessando = '';
  mensagemErro = '';
  resultadosTodos: ConsolidacaoResultadoDTO[] = [];

  constructor(
    private service: ConsolidacaoEnderecosService,
    private toastrService: NbToastrService,
  ) { }

  ngOnInit(): void {
    this.carregarNiveis();
  }

  private async carregarNiveis(): Promise<void> {
    try {
      const niveis = (await this.service.listarNiveis()) ?? [];

      this.linhas = niveis.map((nivel) => ({
        nivel,
        resumo: null,
        carregando: false,
        erro: '',
        resultado: null,
      }));

      await this.atualizarNumeros();
    } catch (e) {
      console.error(e);
      this.mensagemErro = this.extrairMensagem(e, 'Erro ao carregar os níveis da consolidação.');
    }
  }

  async atualizarNumeros(): Promise<void> {
    for (const linha of this.linhas) {
      await this.carregarResumo(linha);
    }
  }

  private async carregarResumo(linha: LinhaNivel): Promise<void> {

    linha.carregando = true;
    linha.erro = '';

    try {
      linha.resumo = await this.service.buscarResumo(linha.nivel.codigo);
    } catch (e) {
      console.error(e);
      linha.resumo = null;
      linha.erro = this.extrairMensagem(e, 'Erro ao consultar os números.');
    } finally {
      linha.carregando = false;
    }
  }

  get carregandoAlgum(): boolean {
    return this.linhas.some((l) => l.carregando);
  }

  async consolidar(linha: LinhaNivel): Promise<void> {

    if (this.processando) {
      return;
    }

    this.processando = true;
    this.nivelProcessando = linha.nivel.descricao;
    this.mensagemErro = '';
    this.resultadosTodos = [];
    linha.resultado = null;

    try {

      linha.resultado = await this.service.executar(linha.nivel.codigo);

      this.toastrService.success(
        linha.resultado?.mensagem || `${linha.nivel.descricao} consolidado.`,
        'Consolidação'
      );

      await this.carregarResumo(linha);

    } catch (e: any) {

      console.error(e);

      this.mensagemErro = this.extrairMensagem(e, `Erro ao consolidar ${linha.nivel.descricao}.`);

      this.toastrService.danger(this.mensagemErro, 'Erro');

    } finally {
      this.processando = false;
      this.nivelProcessando = '';
    }
  }

  async consolidarTodos(): Promise<void> {

    if (this.processando) {
      return;
    }

    this.processando = true;
    this.nivelProcessando = 'todos os níveis';
    this.mensagemErro = '';
    this.resultadosTodos = [];
    this.linhas.forEach((l) => (l.resultado = null));

    try {

      this.resultadosTodos = (await this.service.executarTodos()) ?? [];

      for (const r of this.resultadosTodos) {
        const linha = this.linhas.find((l) => l.nivel.codigo === r.nivel);

        if (linha) {
          linha.resultado = r;
        }
      }

      const comErro = this.resultadosTodos.some((r) => !r.sucesso);

      if (comErro) {
        this.toastrService.warning('A consolidação parou no nível com erro.', 'Finalizado com erro');
      } else {
        this.toastrService.success('Todos os níveis consolidados.', 'Consolidação');
      }

      await this.atualizarNumeros();

    } catch (e: any) {

      console.error(e);

      this.mensagemErro = this.extrairMensagem(e, 'Erro ao consolidar.');

      this.toastrService.danger(this.mensagemErro, 'Erro');

    } finally {
      this.processando = false;
      this.nivelProcessando = '';
    }
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
