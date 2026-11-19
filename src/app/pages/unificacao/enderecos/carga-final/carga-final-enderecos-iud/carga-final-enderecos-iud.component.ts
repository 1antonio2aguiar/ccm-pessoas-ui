import { Component, OnInit } from '@angular/core';
import { NbToastrService } from '@nebular/theme';

import {
  CargaFinalEnderecosService,
  CargaFinalResultadoDTO,
  CargaFinalResumoDTO,
  NivelCargaFinalDTO,
} from '../carga-final-enderecos.service';

interface LinhaNivel {
  nivel: NivelCargaFinalDTO;
  resumo: CargaFinalResumoDTO | null;
  carregando: boolean;
  erro: string;
  resultado: CargaFinalResultadoDTO | null;
}

/*
 * Carga final (fase 3): DBO_UNI_PESSOAS -> DBO_CC_ENDERECOS e DBO_CCM_PESSOAS,
 * gerando o CODIGO_CCM. Substitui SP_CARGA_ENDERECOS e SP_CARGA_CEPS.
 *
 * Os números de cada nível são carregados um de cada vez (logradouros e CEPs
 * passam de 1 milhão de linhas).
 */
@Component({
  selector: 'ngx-carga-final-enderecos-iud',
  templateUrl: './carga-final-enderecos-iud.component.html',
  styleUrls: ['./carga-final-enderecos-iud.component.scss'],
})
export class CargaFinalEnderecosIudComponent implements OnInit {

  linhas: LinhaNivel[] = [];

  processando = false;
  nivelProcessando = '';
  mensagemErro = '';
  resultadosTodos: CargaFinalResultadoDTO[] = [];

  constructor(
    private service: CargaFinalEnderecosService,
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
      this.mensagemErro = this.extrairMensagem(e, 'Erro ao carregar os níveis da carga final.');
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

  async carregar(linha: LinhaNivel): Promise<void> {

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
        linha.resultado?.mensagem || `${linha.nivel.descricao} carregado.`,
        'Carga final'
      );

      await this.carregarResumo(linha);

    } catch (e: any) {

      console.error(e);

      this.mensagemErro = this.extrairMensagem(e, `Erro na carga final de ${linha.nivel.descricao}.`);

      this.toastrService.danger(this.mensagemErro, 'Erro');

    } finally {
      this.processando = false;
      this.nivelProcessando = '';
    }
  }

  async carregarTodos(): Promise<void> {

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
        this.toastrService.warning('A carga final parou no nível com erro.', 'Finalizado com erro');
      } else {
        this.toastrService.success('Todos os níveis carregados.', 'Carga final');
      }

      await this.atualizarNumeros();

    } catch (e: any) {

      console.error(e);

      this.mensagemErro = this.extrairMensagem(e, 'Erro na carga final.');

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
