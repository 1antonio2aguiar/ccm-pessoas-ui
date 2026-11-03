import {
  Component,
  Inject,
  OnDestroy,
  OnInit,
} from '@angular/core';

import {
  DOCUMENT,
} from '@angular/common';

import {
  Router,
} from '@angular/router';

import {
  MENU_ITEMS,
} from './pages-menu';

@Component({
  selector: 'ngx-pages',
  styleUrls: ['pages.component.scss'],
  template: `
    <ngx-one-column-layout>
      <nb-menu [items]="menu"></nb-menu>
      <router-outlet></router-outlet>
    </ngx-one-column-layout>
  `,
})
export class PagesComponent implements OnInit, OnDestroy {

  menu = MENU_ITEMS;

  private sequenciaAtalho = '';

  private temporizadorAtalho:
    ReturnType<typeof setTimeout> | null = null;

  /*
   * O listener é registrado em modo de captura.
   * Dessa forma, ele recebe o evento antes do menu Nebular.
   */
  private readonly listenerTeclado =
    (event: KeyboardEvent): void => {

      this.processarTeclaAtalho(event);
    };

  private readonly rotasAtalhos:
    Record<string, string> = {

      // Cadastros
      CPP: '/pages/pessoa/pessoa-pesquisa',
      CPE: '/pages/estabelecimento/estabelecimento-pesquisa',
      CEE: '/pages/estado/estado-iud',
      CEP: '/pages/cep/cep-pesquisa',
      CEC: '/pages/cidades/cidade-iud',
      CED: '/pages/distrito/distrito-iud',
      CEB: '/pages/bairro/bairro-iud',
      CEL: '/pages/logradouro/logradouro-iud',
      CEA: '/pages/paises/pais-iud',
      CET: '/pages/tipo-logradoueo/tipo-logradouro-iud',
      CEI: '/pages/tipo-pessoa/tipo-pessoa-iud',

      // Atividades
      AUPC: '/pages/unificacao/pessoas/pes-pessoas/pes-pessoas-iud',

    };

  constructor(
    @Inject(DOCUMENT)
    private document: Document,

    private router: Router,
  ) {
  }

  ngOnInit(): void {

    this.document.addEventListener(
      'keydown',
      this.listenerTeclado,
      true,
    );
  }

  ngOnDestroy(): void {

    this.document.removeEventListener(
      'keydown',
      this.listenerTeclado,
      true,
    );

    this.reiniciarSequencia();
  }

  private processarTeclaAtalho(
    event: KeyboardEvent,
  ): void {

    if (
      event.ctrlKey ||
      event.altKey ||
      event.metaKey ||
      event.repeat ||
      this.usuarioEstaDigitando(event.target)
    ) {

      return;
    }

    const tecla =
      event.key.toUpperCase();

    if (!/^[A-Z]$/.test(tecla)) {

      return;
    }

    /*
     * A sequência somente começa com C.
     */
    if (
      this.sequenciaAtalho.length === 0 &&
      tecla !== 'C' &&
      tecla !== 'A'
    ) {
      return;
    }

    const novaSequencia =
      `${this.sequenciaAtalho}${tecla}`;

    const sequenciasValidas = [
      'C', 'CP', 'CE', 'CPP', 'CPE', 'CEE', 'CEP', 'CEC', 'CED', 'CEB', 'CEL', 'CEA', 'CET', 'CEI',
      
      'A', 'AU', 'AUP', 'AUPC'
    ];

    if (!sequenciasValidas.includes(novaSequencia)) {

      this.reiniciarSequencia();

      /*
       * Permite que um novo C reinicie imediatamente
       * uma sequência.
       */
      if (
        tecla === 'C' ||
        tecla === 'A'
      ) {

        this.sequenciaAtalho = tecla;
        this.iniciarTemporizador();
      }

      return;
    }

    this.sequenciaAtalho = novaSequencia;

    const rota =
      this.rotasAtalhos[this.sequenciaAtalho];

    if (rota) {

      event.preventDefault();

      this.reiniciarSequencia();

      this.router.navigateByUrl(rota);

      return;
    }

    this.iniciarTemporizador();
  }

  private iniciarTemporizador(): void {

    this.limparTemporizador();

    /*
     * Três segundos para digitar a próxima letra.
     */
    this.temporizadorAtalho = setTimeout(
      () => {

        this.reiniciarSequencia();
      },
      3000,
    );
  }

  private reiniciarSequencia(): void {

    this.sequenciaAtalho = '';
    this.limparTemporizador();
  }

  private limparTemporizador(): void {

    if (this.temporizadorAtalho !== null) {

      clearTimeout(this.temporizadorAtalho);
      this.temporizadorAtalho = null;
    }
  }

  private usuarioEstaDigitando(
    target: EventTarget | null,
  ): boolean {

    if (!(target instanceof HTMLElement)) {

      return false;
    }

    const tagName =
      target.tagName.toLowerCase();

    return (
      tagName === 'input' ||
      tagName === 'textarea' ||
      tagName === 'select' ||
      target.isContentEditable
    );
  }
}