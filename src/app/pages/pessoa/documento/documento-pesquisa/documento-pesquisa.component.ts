import {
  Component,
  OnDestroy,
  OnInit
} from '@angular/core';

import {
  ActivatedRoute
} from '@angular/router';

import {
  NbDialogService,
  NbGlobalPhysicalPosition,
  NbToastrService
} from '@nebular/theme';

import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { DocumentoOut } from '../../../../shared/models/documentoOut';
import { DocumentoService } from '../documento.service';
import { PessoaContextService } from '../../../../services/pessoa-context.service';
import { DocumentoIudComponent } from '../documento-iud/documento-iud.component';
import { ConfirmDeleteComponent } from '../../../components/base-resource-confirmation-delete/confirm-delete-modal.component';

interface DocumentoDisplay {

  id: number;

  tipoDocumento?: number;
  tipoDocumentoDescricao?: string;

  numeroDocumento?: string;
  dataDocumento?: Date;
  dataExpedicao?: Date;
  documentoOrigem?: string;
  orgaoExpedidor?: string;
  dataPrimeiraCnh?: Date;
  dataValidade?: Date;
  categoriaCnh?: string;
  zona?: number;
  secao?: number;
  observacao?: string;

  pessoaNome?: string;
  pessoaId?: number;

  dadosPessoaJuridicaId?: number | null;
  estabelecimentoNome?: string;
  estabelecimentoCnpj?: string;

  originalApiData?: DocumentoOut;
}

@Component({
  selector: 'ngx-documento-pesquisa',
  templateUrl: './documento-pesquisa.component.html',
  styleUrls: ['./documento-pesquisa.component.scss']
})
export class DocumentoPesquisaComponent
  implements OnInit, OnDestroy {

  pessoaId: number | null = null;
  nomePessoaAtualParaDialog: string | null = null;

  documentos: DocumentoDisplay[] = [];
  documentosParaExibir: DocumentoDisplay[] = [];

  isLoadingDocumento = false;

  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private pessoaContextService: PessoaContextService,
    private documentoService: DocumentoService,
    private toastrService: NbToastrService,
    private dialogService: NbDialogService
  ) {}

  ngOnInit(): void {

    this.route.parent?.params
      .pipe(
        takeUntil(this.destroy$)
      )
      .subscribe(parentParams => {

        if (parentParams['id']) {

          this.pessoaId =
            Number(parentParams['id']);

          this.carregarDocumentos();
        }
      });

    this.pessoaContextService.pessoaNome$
      .pipe(
        takeUntil(this.destroy$)
      )
      .subscribe(nome => {

        this.nomePessoaAtualParaDialog =
          nome;
      });
  }

  ngOnDestroy(): void {

    this.destroy$.next();
    this.destroy$.complete();
  }

  carregarDocumentos(): void {

    if (!this.pessoaId) {

      this.documentosParaExibir = [];
      return;
    }

    this.isLoadingDocumento = true;

    this.documentoService
      .getDocumentoByPessoaId(this.pessoaId)
      .pipe(
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: apiDocumentos => {

          const documentosMapeados =
            apiDocumentos.map(
              documento =>
                this.mapApiDocumentoToDisplay(
                  documento
                )
            );

          this.atualizarDocumentosParaExibir(
            documentosMapeados
          );

          this.isLoadingDocumento = false;
        },

        error: error => {

          console.error(
            'Erro ao carregar documentos:',
            error
          );

          this.atualizarDocumentosParaExibir(
            null
          );

          this.isLoadingDocumento = false;

          const errorMessage =
            error?.error?.message ||
            error?.message ||
            'Falha ao carregar os documentos.';

          this.showToast(
            errorMessage,
            'Erro',
            'danger'
          );
        }
      });
  }

  private mapApiDocumentoToDisplay(
    apiDocumento: DocumentoOut
  ): DocumentoDisplay {

    return {
      id: apiDocumento.id!,

      tipoDocumento:
        apiDocumento.tipoDocumento,

      tipoDocumentoDescricao:
        apiDocumento.tipoDocumentoDescricao,

      numeroDocumento:
        apiDocumento.numeroDocumento ?? '',

      dataDocumento:
        apiDocumento.dataDocumento,

      dataExpedicao:
        apiDocumento.dataExpedicao,

      documentoOrigem:
        apiDocumento.documentoOrigem ?? '',

      orgaoExpedidor:
        apiDocumento.orgaoExpedidor ?? '',

      dataPrimeiraCnh:
        apiDocumento.dataPrimeiraCnh,

      dataValidade:
        apiDocumento.dataValidade,

      categoriaCnh:
        apiDocumento.categoriaCnh ?? '',

      zona:
        apiDocumento.zona,

      secao:
        apiDocumento.secao,

      observacao:
        apiDocumento.observacao ?? '',

      pessoaNome:
        apiDocumento.pessoaNome,

      pessoaId:
        apiDocumento.pessoaId,

      dadosPessoaJuridicaId:
        apiDocumento.dadosPessoaJuridicaId ??
        null,

      estabelecimentoNome:
        apiDocumento.estabelecimentoNome ??
        '',

      estabelecimentoCnpj:
        apiDocumento.estabelecimentoCnpj ??
        '',

      originalApiData:
        apiDocumento
    };
  }

  private atualizarDocumentosParaExibir(
    documentosApiMapeados?:
      DocumentoDisplay[] | null
  ): void {

    if (
      this.pessoaId &&
      documentosApiMapeados
    ) {

      this.documentosParaExibir =
        documentosApiMapeados;

    } else {

      this.documentosParaExibir = [];
    }
  }

  adicionarNovoDocumento(): void {

    this.dialogService
      .open(
        DocumentoIudComponent,
        {
          context: {
            pessoaId:
              this.pessoaId,

            nomePessoa:
              this.nomePessoaAtualParaDialog
          },

          closeOnBackdropClick: false
        }
      )
      .onClose
      .pipe(
        takeUntil(this.destroy$)
      )
      .subscribe(documentoSalvo => {

        if (documentoSalvo) {
          this.carregarDocumentos();
        }
      });
  }

  editarDocumento(
    documento: DocumentoDisplay
  ): void {

    this.dialogService
      .open(
        DocumentoIudComponent,
        {
          context: {
            pessoaId:
              this.pessoaId,

            nomePessoa:
              this.nomePessoaAtualParaDialog,

            documentoParaEdicao: {
              ...(
                documento.originalApiData ??
                documento
              )
            }
          },

          closeOnBackdropClick: false
        }
      )
      .onClose
      .pipe(
        takeUntil(this.destroy$)
      )
      .subscribe(documentoAtualizado => {

        if (documentoAtualizado) {
          this.carregarDocumentos();
        }
      });
  }

  excluirDocumentoWrapper(
    documento: DocumentoDisplay
  ): void {

    let documentoDescricao =
      documento.tipoDocumentoDescricao ??
      'Documento';

    if (
      documento.numeroDocumento &&
      documento.numeroDocumento !== 'N/I'
    ) {

      documentoDescricao +=
        ` ${documento.numeroDocumento}`;
    }

    if (
      documento.dadosPessoaJuridicaId &&
      documento.estabelecimentoNome
    ) {

      documentoDescricao +=
        ` do estabelecimento ${documento.estabelecimentoNome}`;
    }

    this.dialogService
      .open(
        ConfirmDeleteComponent,
        {
          context: {
            title:
              'Excluir Documento',

            message:
              `Tem certeza que deseja excluir o documento "${documentoDescricao}"?`
          }
        }
      )
      .onClose
      .pipe(
        takeUntil(this.destroy$)
      )
      .subscribe(confirmed => {

        if (!confirmed) {
          return;
        }

        this.isLoadingDocumento = true;

        this.documentoService
          .delete(documento.id)
          .pipe(
            takeUntil(this.destroy$)
          )
          .subscribe({
            next: () => {

              this.showToast(
                'Documento excluído com sucesso!',
                'Sucesso',
                'success'
              );

              this.carregarDocumentos();
            },

            error: err => {

              console.error(
                'Erro ao excluir documento:',
                err
              );

              const errorMessage =
                err?.error?.message ||
                err?.message ||
                'Falha ao excluir o documento. Tente novamente.';

              this.showToast(
                errorMessage,
                'Erro',
                'danger'
              );

              this.isLoadingDocumento = false;
            }
          });
      });
  }

  formatarCnpj(value: any): string {

    if (!value) {
      return '';
    }

    const cnpj =
      String(value).replace(
        /\D/g,
        ''
      );

    if (cnpj.length !== 14) {
      return String(value);
    }

    return cnpj.replace(
      /(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/,
      '$1.$2.$3/$4-$5'
    );
  }

  private showToast(
    message: string,
    title: string,
    status:
      'success' |
      'danger' |
      'warning' |
      'info'
  ): void {

    this.toastrService.show(
      message,
      title,
      {
        status,
        position:
          NbGlobalPhysicalPosition.TOP_RIGHT,
        duration: 3000
      }
    );
  }
}