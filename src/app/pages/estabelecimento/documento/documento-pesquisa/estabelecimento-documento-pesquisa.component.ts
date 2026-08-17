import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import {
  NbDialogService,
  NbGlobalPhysicalPosition,
  NbToastrService,
} from '@nebular/theme';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { EstabelecimentoContextService } from '../../../../services/estabelecimento-context.service';
import { DocumentoOut } from '../../../../shared/models/documentoOut';
import { ConfirmationDialogComponent } from '../../../components/base-resource-confirmation-delete/confirmation-dialog/confirmation-dialog.component';
import { EstabelecimentoDocumentoIudComponent } from '../documento-iud/estabelecimento-documento-iud.component';
import { EstabelecimentoDocumentoService } from '../estabelecimento-documento.service';

interface DocumentoEstabelecimentoDisplay {
  id: number;
  tipoDocumento?: number;
  tipoDocumentoDescricao: string;
  numeroDocumento: string;
  dataDocumento?: Date;
  dataExpedicao?: Date;
  documentoOrigem: string;
  orgaoExpedidor: string;
  dataPrimeiraCnh?: Date;
  dataValidade?: Date;
  categoriaCnh: string;
  zona?: number;
  secao?: number;
  observacao: string;
  originalApiData: DocumentoOut;
}

@Component({
  selector: 'ngx-estabelecimento-documento-pesquisa',
  templateUrl: './estabelecimento-documento-pesquisa.component.html',
  styleUrls: ['./estabelecimento-documento-pesquisa.component.scss'],
})
export class EstabelecimentoDocumentoPesquisaComponent
  implements OnInit, OnDestroy {

  estabelecimentoId: number | null = null;
  estabelecimentoNome: string | null = null;
  pessoaId: number | null = null;
  documentos: DocumentoEstabelecimentoDisplay[] = [];
  isLoadingDocumento = false;

  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private estabelecimentoContext: EstabelecimentoContextService,
    private documentoService: EstabelecimentoDocumentoService,
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
          this.documentos = [];
          return;
        }

        this.estabelecimentoId = id;
        this.carregarDocumentos();
      });
  }

  carregarDocumentos(): void {
    if (this.estabelecimentoId === null) {
      this.documentos = [];
      return;
    }

    this.isLoadingDocumento = true;

    this.documentoService.getDocumentoByEstabelecimentoId(this.estabelecimentoId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: documentosApi => {
          this.documentos = (documentosApi ?? [])
            .map(documento => this.mapearDocumento(documento));
          this.isLoadingDocumento = false;
        },
        error: error => {
          console.error('Erro ao carregar documentos do estabelecimento:', error);
          this.documentos = [];
          this.isLoadingDocumento = false;
          this.exibirToast('Não foi possível carregar os documentos do estabelecimento.', 'Erro', 'danger');
        },
      });
  }

  adicionarNovoDocumento(): void {
    if (this.estabelecimentoId === null || this.pessoaId === null) {
      this.exibirToast('Não foi possível identificar o estabelecimento ou seu proprietário.', 'Atenção', 'warning');
      return;
    }

    this.dialogService.open(EstabelecimentoDocumentoIudComponent, {
      context: {
        estabelecimentoId: this.estabelecimentoId,
        nomeEstabelecimento: this.estabelecimentoNome,
        pessoaId: this.pessoaId,
      },
      closeOnBackdropClick: false,
    }).onClose
      .pipe(takeUntil(this.destroy$))
      .subscribe(documentoSalvo => {
        if (documentoSalvo) {
          this.carregarDocumentos();
        }
      });
  }

  editarDocumento(documento: DocumentoEstabelecimentoDisplay): void {
    if (this.estabelecimentoId === null || this.pessoaId === null) {
      this.exibirToast('Não foi possível identificar o estabelecimento ou seu proprietário.', 'Atenção', 'warning');
      return;
    }

    this.dialogService.open(EstabelecimentoDocumentoIudComponent, {
      context: {
        estabelecimentoId: this.estabelecimentoId,
        nomeEstabelecimento: this.estabelecimentoNome,
        pessoaId: this.pessoaId,
        documentoParaEdicao: { ...documento.originalApiData },
      },
      closeOnBackdropClick: false,
    }).onClose
      .pipe(takeUntil(this.destroy$))
      .subscribe(documentoAtualizado => {
        if (documentoAtualizado) {
          this.carregarDocumentos();
        }
      });
  }

  excluirDocumento(documento: DocumentoEstabelecimentoDisplay): void {
    const descricao = documento.numeroDocumento
      ? `${documento.tipoDocumentoDescricao} ${documento.numeroDocumento}`
      : documento.tipoDocumentoDescricao || 'Documento';

    this.dialogService.open(ConfirmationDialogComponent, {
      context: {
        title: 'Excluir Documento',
        message: `Você tem certeza que deseja excluir o documento <strong>"${descricao}"</strong>?`,
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

        this.isLoadingDocumento = true;

        this.documentoService.delete(documento.id)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: () => {
              this.exibirToast('Documento excluído com sucesso.', 'Sucesso', 'success');
              this.carregarDocumentos();
            },
            error: error => {
              console.error('Erro ao excluir documento:', error);
              this.isLoadingDocumento = false;
              this.exibirToast(error?.error?.message || error?.message || 'Não foi possível excluir o documento.', 'Erro', 'danger');
            },
          });
      });
  }

  private mapearDocumento(documento: DocumentoOut): DocumentoEstabelecimentoDisplay {
    return {
      id: documento.id!,
      tipoDocumento: documento.tipoDocumento,
      tipoDocumentoDescricao: documento.tipoDocumentoDescricao ?? '',
      numeroDocumento: documento.numeroDocumento ?? '',
      dataDocumento: documento.dataDocumento,
      dataExpedicao: documento.dataExpedicao,
      documentoOrigem: documento.documentoOrigem ?? '',
      orgaoExpedidor: documento.orgaoExpedidor ?? '',
      dataPrimeiraCnh: documento.dataPrimeiraCnh,
      dataValidade: documento.dataValidade,
      categoriaCnh: documento.categoriaCnh ?? '',
      zona: documento.zona,
      secao: documento.secao,
      observacao: documento.observacao ?? '',
      originalApiData: documento,
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
