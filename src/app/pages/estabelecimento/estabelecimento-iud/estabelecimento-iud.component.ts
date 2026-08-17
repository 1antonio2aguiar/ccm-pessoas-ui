import {
  Component,
  OnDestroy,
  OnInit,
} from '@angular/core';
import {
  ActivatedRoute,
  NavigationEnd,
  Router,
} from '@angular/router';
import { NbMenuItem } from '@nebular/theme';
import { Subject } from 'rxjs';
import {
  filter,
  startWith,
  takeUntil,
} from 'rxjs/operators';

import {
  EstabelecimentoContextService,
} from '../../../services/estabelecimento-context.service';
import {
  EstabelecimentoService,
} from '../estabelecimento.service';

@Component({
  selector: 'ngx-estabelecimento-iud',
  templateUrl: './estabelecimento-iud.component.html',
  styleUrls: ['./estabelecimento-iud.component.scss'],
})
export class EstabelecimentoIudComponent
  implements OnInit, OnDestroy {

  estabelecimentoId: number | null = null;
  estabelecimentoNome: string | null = null;
  pessoaId: number | null = null;

  modoEdicao = false;
  isLoading = false;

  private destroy$ = new Subject<void>();

  menuItems: NbMenuItem[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private estabelecimentoService: EstabelecimentoService,
    private estabelecimentoContext:
      EstabelecimentoContextService,
  ) {

    /*
     * Ao abrir um cadastro novo, elimina qualquer estabelecimento
     * que tenha permanecido no contexto da navegação anterior.
     */
    if (!this.route.snapshot.params['id']) {
      this.estabelecimentoContext.clearContext();
    }
  }

  ngOnInit(): void {

    this.observarParametrosDaRota();
    this.observarContexto();
    this.observarNavegacao();
  }

  ngOnDestroy(): void {

    this.destroy$.next();
    this.destroy$.complete();
  }

  private observarParametrosDaRota(): void {

    this.route.params
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {

        const id = params['id']
          ? Number(params['id'])
          : null;

        if (id === null) {

          this.modoEdicao = false;
          this.estabelecimentoId = null;
          this.estabelecimentoNome = null;
          this.pessoaId = null;

          this.estabelecimentoContext.clearContext();
          this.montarMenu(null);
          return;
        }

        this.modoEdicao = true;
        this.estabelecimentoId = id;

        this.montarMenu(id);
        this.carregarEstabelecimento(id);
      });
  }

  private observarContexto(): void {

    this.estabelecimentoContext.estabelecimentoId$
      .pipe(takeUntil(this.destroy$))
      .subscribe(id => {

        /*
         * Quando o perfil de um cadastro novo for salvo,
         * o backend devolverá o ID. A navegação passa então
         * do modo cadastrar para editar e libera as outras abas.
         */
        if (
          id !== null &&
          !this.modoEdicao &&
          this.estabelecimentoId === null
        ) {

          this.estabelecimentoId = id;
          this.modoEdicao = true;
          this.montarMenu(id);

          this.router.navigate(
            [
              './editar',
              id,
              'enderecos',
            ],
            {
              relativeTo: this.route.parent,
            },
          );
        }
      });

    this.estabelecimentoContext.estabelecimentoNome$
      .pipe(takeUntil(this.destroy$))
      .subscribe(nome => {

        this.estabelecimentoNome = nome;
      });

    this.estabelecimentoContext.pessoaId$
      .pipe(takeUntil(this.destroy$))
      .subscribe(pessoaId => {

        this.pessoaId = pessoaId;
      });
  }

  private carregarEstabelecimento(
    id: number,
  ): void {

    this.isLoading = true;

    this.estabelecimentoService
      .getEstabelecimentoById(id)
      .then(estabelecimento => {

        this.estabelecimentoId =
          estabelecimento.id ?? id;

        this.estabelecimentoNome =
          estabelecimento.nome ?? null;

        this.pessoaId =
          estabelecimento.pessoaId ?? null;

        this.estabelecimentoContext.definirContexto(
          this.estabelecimentoId,
          this.estabelecimentoNome,
          this.pessoaId,
        );
      })
      .catch(error => {

        console.error(
          `Erro ao carregar estabelecimento ${id}:`,
          error,
        );
      })
      .finally(() => {

        this.isLoading = false;
      });
  }

  private observarNavegacao(): void {

    this.router.events
      .pipe(
        filter(
          event => event instanceof NavigationEnd,
        ),
        startWith(null),
        takeUntil(this.destroy$),
      )
      .subscribe(() => {

        this.atualizarItemSelecionado();
      });
  }

  private atualizarItemSelecionado(): void {

    const urlAtual =
      this.router.url.split('?')[0];

    this.menuItems = this.menuItems.map(
      item => ({
        ...item,
        selected:
          item.link?.toString() === urlAtual,
      }),
    );
  }

  private montarMenu(estabelecimentoId: number | null,): void {

    /*
    * Enquanto o estabelecimento ainda não foi salvo,
    * somente o Perfil pode ser acessado.
    */
    if (estabelecimentoId === null) {

      this.menuItems = [
        {
          title: 'Perfil',
          icon: 'briefcase-outline',
          link:
            '/pages/estabelecimento/cadastrar/perfil',
        },
      ];

      this.atualizarItemSelecionado();
      return;
    }

    const baseEdicao =
      `/pages/estabelecimento/editar/${estabelecimentoId}`;

    this.menuItems = [
      {
        title: 'Perfil',
        icon: 'briefcase-outline',
        link: `${baseEdicao}/perfil`,
      },
      {
        title: 'Endereços',
        icon: 'pin-outline',
        link: `${baseEdicao}/enderecos`,
      },
      {
        title: 'Contatos',
        icon: 'phone-outline',
        link: `${baseEdicao}/contatos`,
      },
      {
        title: 'Documentos',
        icon: 'file-text-outline',
        link: `${baseEdicao}/documentos`,
      },
    ];

    this.atualizarItemSelecionado();
  }
}