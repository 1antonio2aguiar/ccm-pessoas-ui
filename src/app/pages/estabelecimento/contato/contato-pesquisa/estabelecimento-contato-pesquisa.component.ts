import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NbDialogService, NbGlobalPhysicalPosition, NbToastrService } from '@nebular/theme';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { EstabelecimentoContextService } from '../../../../services/estabelecimento-context.service';
import { ContatoOut } from '../../../../shared/models/contatoOut';
import { formatarTelefoneUtil } from '../../../../shared/utils/formatar-telefone.util';
import { ConfirmationDialogComponent } from '../../../components/base-resource-confirmation-delete/confirmation-dialog/confirmation-dialog.component';
import { EstabelecimentoContatoIudComponent } from '../contato-iud/estabelecimento-contato-iud.component';
import { EstabelecimentoContatoService } from '../estabelecimento-contato.service';

interface ContatoEstabelecimentoDisplay {
  id: number;
  tipoContato: number;
  tipoContatoDescricao: string;
  contato: string;
  complemento: string;
  principal: boolean;
  originalApiData: ContatoOut;
}

@Component({
  selector: 'ngx-estabelecimento-contato-pesquisa',
  templateUrl: './estabelecimento-contato-pesquisa.component.html',
  styleUrls: ['./estabelecimento-contato-pesquisa.component.scss'],
})
export class EstabelecimentoContatoPesquisaComponent implements OnInit, OnDestroy {
  estabelecimentoId: number | null = null;
  estabelecimentoNome: string | null = null;
  pessoaId: number | null = null;
  contatos: ContatoEstabelecimentoDisplay[] = [];
  isLoadingContatos = false;

  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private estabelecimentoContext: EstabelecimentoContextService,
    private contatoService: EstabelecimentoContatoService,
    private toastrService: NbToastrService,
    private dialogService: NbDialogService,
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
    this.estabelecimentoContext.estabelecimentoNome$
      .pipe(takeUntil(this.destroy$))
      .subscribe(nome => this.estabelecimentoNome = nome);

    this.estabelecimentoContext.pessoaId$
      .pipe(takeUntil(this.destroy$))
      .subscribe(pessoaId => this.pessoaId = pessoaId);
  }

  private obterEstabelecimentoDaRota(): void {
    this.route.parent?.params
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        const id = params['id'] ? Number(params['id']) : null;

        if (id === null || !Number.isFinite(id)) {
          this.estabelecimentoId = null;
          this.contatos = [];
          return;
        }

        this.estabelecimentoId = id;
        this.carregarContatos();
      });
  }

  carregarContatos(): void {
    if (this.estabelecimentoId === null) {
      this.contatos = [];
      return;
    }

    this.isLoadingContatos = true;

    this.contatoService.getContatoByEstabelecimentoId(this.estabelecimentoId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: contatosApi => {
          this.contatos = (contatosApi ?? []).map(contato => this.mapearContato(contato));
          this.isLoadingContatos = false;
        },
        error: error => {
          console.error('Erro ao carregar contatos do estabelecimento:', error);
          this.contatos = [];
          this.isLoadingContatos = false;
          this.exibirToast('Não foi possível carregar os contatos do estabelecimento.', 'Erro', 'danger');
        },
      });
  }

  adicionarNovoContato(): void {
    if (this.estabelecimentoId === null || this.pessoaId === null) {
      this.exibirToast('Não foi possível identificar o estabelecimento ou seu proprietário.', 'Atenção', 'warning');
      return;
    }

    this.dialogService.open(EstabelecimentoContatoIudComponent, {
      context: {
        estabelecimentoId: this.estabelecimentoId,
        nomeEstabelecimento: this.estabelecimentoNome,
        pessoaId: this.pessoaId,
      },
      closeOnBackdropClick: false,
    }).onClose
      .pipe(takeUntil(this.destroy$))
      .subscribe(contatoSalvo => {
        if (contatoSalvo) {
          this.carregarContatos();
        }
      });
  }

  editarContato(contato: ContatoEstabelecimentoDisplay): void {
    if (this.estabelecimentoId === null || this.pessoaId === null) {
      this.exibirToast('Não foi possível identificar o estabelecimento ou seu proprietário.', 'Atenção', 'warning');
      return;
    }

    this.dialogService.open(EstabelecimentoContatoIudComponent, {
      context: {
        estabelecimentoId: this.estabelecimentoId,
        nomeEstabelecimento: this.estabelecimentoNome,
        pessoaId: this.pessoaId,
        contatoParaEdicao: { ...contato.originalApiData },
      },
      closeOnBackdropClick: false,
    }).onClose
      .pipe(takeUntil(this.destroy$))
      .subscribe(contatoAtualizado => {
        if (contatoAtualizado) {
          this.carregarContatos();
        }
      });
  }

  excluirContato(contato: ContatoEstabelecimentoDisplay): void {
    const tipo = String(contato.tipoContato ?? '');
    const valor = formatarTelefoneUtil(contato.contato, tipo);

    this.dialogService.open(ConfirmationDialogComponent, {
      context: {
        title: 'Excluir Contato',
        message: `Você tem certeza que deseja excluir o contato <strong>"${valor}"</strong>?`,
        confirmButtonText: 'Sim, Excluir',
        cancelButtonText: 'Cancelar',
        status: 'danger',
        icon: 'trash-2-outline',
      },
      closeOnBackdropClick: false,
    }).onClose
      .pipe(takeUntil(this.destroy$))
      .subscribe((confirmado: boolean) => {
        if (!confirmado) {
          return;
        }

        this.isLoadingContatos = true;

        this.contatoService.delete(contato.id)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: () => {
              this.exibirToast('Contato excluído com sucesso.', 'Sucesso', 'success');
              this.carregarContatos();
            },
            error: error => {
              console.error('Erro ao excluir contato:', error);
              this.isLoadingContatos = false;
              this.exibirToast(error?.error?.message || error?.message || 'Não foi possível excluir o contato.', 'Erro', 'danger');
            },
          });
      });
  }

  definirComoPrincipal(contato: ContatoEstabelecimentoDisplay): void {
    if (this.pessoaId === null) {
      this.exibirToast('Não foi possível identificar o proprietário.', 'Atenção', 'warning');
      return;
    }

    this.isLoadingContatos = true;

    this.contatoService.definirComoPrincipal(contato.id, this.pessoaId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.exibirToast('Contato definido como principal.', 'Sucesso', 'success');
          this.carregarContatos();
        },
        error: error => {
          console.error('Erro ao definir contato principal:', error);
          this.isLoadingContatos = false;
          this.exibirToast(error?.error?.message || error?.message || 'Não foi possível definir o contato como principal.', 'Erro', 'danger');
        },
      });
  }

  private mapearContato(contato: ContatoOut): ContatoEstabelecimentoDisplay {
    return {
      id: contato.id!,
      tipoContato: Number(contato.tipoContato ?? -1),
      tipoContatoDescricao: contato.tipoContatoDescricao ?? '',
      contato: contato.contato ?? '',
      complemento: contato.complemento ?? '',
      principal: contato.principal === 'S' || contato.principal === 'SIM',
      originalApiData: contato,
    };
  }

  private exibirToast(
    mensagem: string,
    titulo: string,
    status: 'success' | 'danger' | 'warning' | 'info',
  ): void {
    this.toastrService.show(mensagem, titulo, {
      status,
      position: NbGlobalPhysicalPosition.TOP_RIGHT,
      duration: 3000,
    });
  }
}
