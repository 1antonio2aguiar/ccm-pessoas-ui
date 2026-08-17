import {
  Component,
  OnDestroy,
  OnInit,
} from '@angular/core';
import {
  ActivatedRoute,
} from '@angular/router';
import {
  NbDialogService,
  NbGlobalPhysicalPosition,
  NbToastrService,
} from '@nebular/theme';
import {
  Subject,
} from 'rxjs';
import {
  takeUntil,
} from 'rxjs/operators';

import {
  EnderecoService,
} from '../../../pessoa/endereco/endereco.service';
import {
  EnderecoOut,
} from '../../../../shared/models/enderecoOut';
import {
  EstabelecimentoContextService,
} from '../../../../services/estabelecimento-context.service';
import {
  ConfirmationDialogComponent,
} from '../../../components/base-resource-confirmation-delete/confirmation-dialog/confirmation-dialog.component';
import {
  EstabelecimentoEnderecoIudComponent,
} from '../endereco-iud/estabelecimento-endereco-iud.component';

interface EnderecoEstabelecimentoDisplay {

  id: number;

  tipoEndereco?: number;
  tipoEnderecoDescricao?: string;

  tipoLogradouro?: string;
  logradouroNome?: string;

  numero?: string;
  complemento?: string;

  bairroNome?: string;
  cidadeNome?: string;
  estadoUf?: string;

  cep: string;
  principal: boolean;

  originalApiData: EnderecoOut;
}

@Component({
  selector: 'ngx-estabelecimento-endereco-pesquisa',
  templateUrl: './estabelecimento-endereco-pesquisa.component.html',
  styleUrls: ['./estabelecimento-endereco-pesquisa.component.scss'],
})
export class EstabelecimentoEnderecoPesquisaComponent
        implements OnInit, OnDestroy {

  estabelecimentoId: number | null = null;
  estabelecimentoNome: string | null = null;
  pessoaId: number | null = null;

  enderecos: EnderecoEstabelecimentoDisplay[] = [];

  isLoading = false;

  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private enderecoService: EnderecoService,
    private estabelecimentoContext:
      EstabelecimentoContextService,
    private dialogService: NbDialogService,
    private toastrService: NbToastrService,
  ) {
  }

  ngOnInit(): void {

    this.observarContexto();
    this.obterEstabelecimentoDaRota();
  }

  ngOnDestroy(): void {

    this.destroy$.next();
    this.destroy$.complete();
  }

  private observarContexto(): void {

    this.estabelecimentoContext
      .estabelecimentoNome$
      .pipe(takeUntil(this.destroy$))
      .subscribe(nome => {

        this.estabelecimentoNome = nome;
      });

    this.estabelecimentoContext
      .pessoaId$
      .pipe(takeUntil(this.destroy$))
      .subscribe(pessoaId => {

        this.pessoaId = pessoaId;
      });
  }

  private obterEstabelecimentoDaRota(): void {

    this.route.parent?.params
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {

        const id = params['id']
          ? Number(params['id'])
          : null;

        if (
          id === null ||
          !Number.isFinite(id)
        ) {

          this.estabelecimentoId = null;
          this.enderecos = [];
          return;
        }

        this.estabelecimentoId = id;
        this.carregarEnderecos();
      });
  }

  carregarEnderecos(): void {

    if (this.estabelecimentoId === null) {

      this.enderecos = [];
      return;
    }

    this.isLoading = true;

    this.enderecoService
      .getEnderecoByEstabelecimentoId(
        this.estabelecimentoId,
      )
      .pipe(takeUntil(this.destroy$))
      .subscribe({

        next: enderecosApi => {

          this.enderecos =
            (enderecosApi ?? []).map(
              endereco =>
                this.mapearEndereco(endereco),
            );

          this.isLoading = false;
        },

        error: error => {

          console.error(
            'Erro ao carregar endereços do estabelecimento:',
            error,
          );

          this.enderecos = [];
          this.isLoading = false;

          this.exibirToast(
            'Não foi possível carregar os endereços do estabelecimento.',
            'Erro',
            'danger',
          );
        },
      });
  }

  adicionarNovoEndereco(): void {

    if (
      this.estabelecimentoId === null ||
      this.pessoaId === null
    ) {

      this.exibirToast(
        'Não foi possível identificar o estabelecimento ou seu proprietário.',
        'Atenção',
        'warning',
      );

      return;
    }

    this.dialogService.open(
      EstabelecimentoEnderecoIudComponent,
      {
        context: {
          estabelecimentoId:
            this.estabelecimentoId,

          nomeEstabelecimento:
            this.estabelecimentoNome,

          pessoaId:
            this.pessoaId,

          mode: 'add',
        },
        closeOnBackdropClick: false,
      },
    ).onClose
      .pipe(takeUntil(this.destroy$))
      .subscribe((enderecoSalvo: EnderecoOut | null) => {

        if (!enderecoSalvo) {
          return;
        }

        this.exibirToast(
          'Endereço cadastrado com sucesso.',
          'Sucesso',
          'success',
        );

        this.carregarEnderecos();
      });
  }

  editarEndereco(
    endereco: EnderecoEstabelecimentoDisplay,
  ): void {

    if (
      this.estabelecimentoId === null ||
      this.pessoaId === null
    ) {

      this.exibirToast(
        'Não foi possível identificar o estabelecimento ou seu proprietário.',
        'Atenção',
        'warning',
      );

      return;
    }

    this.dialogService.open(
      EstabelecimentoEnderecoIudComponent,
      {
        context: {
          estabelecimentoId:
            this.estabelecimentoId,

          nomeEstabelecimento:
            this.estabelecimentoNome,

          pessoaId:
            this.pessoaId,

          enderecoParaEdicao: {
            ...endereco.originalApiData,
          },

          mode: 'edit',
        },
        closeOnBackdropClick: false,
      },
    ).onClose
      .pipe(takeUntil(this.destroy$))
      .subscribe((enderecoAtualizado: EnderecoOut | null) => {

        if (!enderecoAtualizado) {
          return;
        }

        this.exibirToast(
          'Endereço atualizado com sucesso.',
          'Sucesso',
          'success',
        );

        this.carregarEnderecos();
      });
  }

  excluirEndereco(
    endereco: EnderecoEstabelecimentoDisplay,
  ): void {

    const descricao =
      this.montarDescricaoEndereco(endereco);

    this.dialogService.open(
      ConfirmationDialogComponent,
      {
        context: {
          title: 'Excluir Endereço',
          message: `
            Você tem certeza que deseja excluir o endereço
            <strong>"${descricao}"</strong>?
          `,
          confirmButtonText: 'Sim, Excluir',
          cancelButtonText: 'Cancelar',
          status: 'danger',
          icon: 'trash-2-outline',
        },
        closeOnBackdropClick: false,
      },
    ).onClose.subscribe(
      (confirmado: boolean) => {

        if (!confirmado) {
          return;
        }

        this.isLoading = true;

        this.enderecoService
          .delete(endereco.id)
          .pipe(takeUntil(this.destroy$))
          .subscribe({

            next: () => {

              this.exibirToast(
                'Endereço excluído com sucesso.',
                'Sucesso',
                'success',
              );

              this.carregarEnderecos();
            },

            error: error => {

              console.error(
                'Erro ao excluir endereço:',
                error,
              );

              this.isLoading = false;

              const mensagem =
                error?.error?.message ||
                error?.message ||
                'Não foi possível excluir o endereço.';

              this.exibirToast(
                mensagem,
                'Erro',
                'danger',
              );
            },
          });
      },
    );
  }

  definirComoPrincipal(
    endereco: EnderecoEstabelecimentoDisplay,
  ): void {

    if (this.pessoaId === null) {

      this.exibirToast(
        'Não foi possível identificar o proprietário do estabelecimento.',
        'Atenção',
        'warning',
      );

      return;
    }

    this.isLoading = true;

    this.enderecoService
      .definirComoPrincipal(
        endereco.id,
        this.pessoaId,
      )
      .pipe(takeUntil(this.destroy$))
      .subscribe({

        next: () => {

          this.exibirToast(
            'Endereço definido como principal.',
            'Sucesso',
            'success',
          );

          this.carregarEnderecos();
        },

        error: error => {

          console.error(
            'Erro ao definir endereço principal:',
            error,
          );

          this.isLoading = false;

          const mensagem =
            error?.error?.message ||
            error?.message ||
            'Não foi possível definir o endereço como principal.';

          this.exibirToast(
            mensagem,
            'Erro',
            'danger',
          );
        },
      });
  }

  private mapearEndereco(
    endereco: EnderecoOut,
  ): EnderecoEstabelecimentoDisplay {

    return {
      id: endereco.id!,
      tipoEndereco: endereco.tipoEndereco,
      tipoEnderecoDescricao:
        this.obterTipoEnderecoDescricao(
          endereco.tipoEndereco,
        ),
      tipoLogradouro:
        endereco.tipoLogradouro ?? '',
      logradouroNome:
        endereco.logradouroNome ?? '',
      numero:
        endereco.numero?.toString() || 'S/N',
      complemento:
        endereco.complemento ?? '',
      bairroNome:
        endereco.bairroNome ?? '',
      cidadeNome:
        endereco.cidadeNome ?? '',
      estadoUf:
        endereco.estadoUf ?? '',
      cep:
        endereco.cep ?? '',
      principal:
        endereco.principal === 'S' ||
        endereco.principal === 'SIM',
      originalApiData: endereco,
    };
  }

  private obterTipoEnderecoDescricao(
    tipoEndereco:
      number |
      undefined,
  ): string {

    switch (tipoEndereco) {

      case 0:
        return 'CASA';

      case 1:
        return 'TRABALHO';

      case 2:
        return 'ESTABELECIMENTO';

      default:
        return '';
    }
  }

  private montarDescricaoEndereco(
    endereco: EnderecoEstabelecimentoDisplay,
  ): string {

    const logradouro =
      endereco.logradouroNome ||
      'Logradouro não informado';

    const numero =
      endereco.numero &&
      endereco.numero !== 'S/N'
        ? `, ${endereco.numero}`
        : '';

    return `${logradouro}${numero}`;
  }

  private exibirToast(
    mensagem: string,
    titulo: string,
    status:
      | 'success'
      | 'danger'
      | 'warning'
      | 'info',
  ): void {

    this.toastrService.show(
      mensagem,
      titulo,
      {
        status,
        position:
          NbGlobalPhysicalPosition.TOP_RIGHT,
        duration: 3000,
      },
    );
  }
}