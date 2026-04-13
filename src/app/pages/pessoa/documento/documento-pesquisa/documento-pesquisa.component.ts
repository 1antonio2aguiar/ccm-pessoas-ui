import { Component, OnInit, Input, OnDestroy } from '@angular/core'; // Adicionado OnDestroy
import { ActivatedRoute, Router, NavigationEnd, Navigation } from '@angular/router';
import { NbDialogService } from '@nebular/theme';
import { takeUntil } from 'rxjs/operators'; 
import { NbGlobalPhysicalPosition, NbToastrService, } from '@nebular/theme';
import { Subject } from 'rxjs'; 

import { PessoaContextService } from '../../../../services/pessoa-context.service';
import { ConfirmDeleteComponent } from '../../../components/base-resource-confirmation-delete/confirm-delete-modal.component';
import { DocumentoOut } from '../../../../shared/models/documentoOut';
import { DocumentoService } from '../documento.service';
import { DocumentoIudComponent } from '../documento-iud/documento-iud.component';


interface DocumentoDisplay {
  id: number;
  tipoDocumento?: number; 
  tipoDocumentoDescricao?: string,
  numeroDocumento: string;
  dataDocumento?: Date;
  dataExpedicao?: Date;  
  documentoOrigem?: string;
  orgaoExpedidor?: string;
  dataPrimeiraCnh?: Date;
  dataValidade?: Date;
  pessoaNome?: string;
  categoriaCnh?: string;
  zona?: number; 
  secao?: number; 
  observacao?: string;

  originalApiData?: DocumentoOut;
}

@Component({
  selector: 'ngx-documento-pesquisa',
  templateUrl: './documento-pesquisa.component.html',
  styleUrls: ['./documento-pesquisa.component.scss']
})

export class DocumentoPesquisaComponent implements OnInit, OnDestroy {
    pessoaId: number | null = null;
    nomePessoaAtualParaDialog: string | null = null;
    private destroy$ = new Subject<void>();

    documentos: DocumentoDisplay[] = [];
    tipoDocumentoStr = '';
    documentosParaExibir: DocumentoDisplay[] = [];
    isLoadingDocumento = false;

    constructor(
        private route: ActivatedRoute,
        private pessoaContextService: PessoaContextService,
        private documentoService: DocumentoService,
        private toastrService: NbToastrService,
        private dialogService: NbDialogService,
        private router: Router,
    ) {}


    ngOnInit(): void {

        this.route.parent?.params.pipe(
            takeUntil(this.destroy$)
        ).subscribe(parentParams => {
            if (parentParams['id']) {
                this.pessoaId = +parentParams['id'];
                this.carregarDocumentos(); // <<< CHAMAR AQUI
            }
        });

        this.pessoaContextService.pessoaNome$.pipe(
            takeUntil(this.destroy$)
        ).subscribe(nome => {
            this.nomePessoaAtualParaDialog = nome;
        });
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    carregarDocumentos(): void {

        this.isLoadingDocumento = true;
        this.documentoService.getDocumentoByPessoaId(this.pessoaId) // Usando a versão com Promise
            .toPromise()
            .then(apiDocumento => {
                const documentosMapeados = apiDocumento.map(apiEnd => this.mapApiDocumentoToDisplay(apiEnd));
                this.atualizarDocumentosParaExibir(documentosMapeados);
            })
            .catch(error => {
                console.error('Erro ao carregar Documentos:', error);
                this.atualizarDocumentosParaExibir(null); // Limpa a lista em caso de erro
            })
            .finally(() => {
                this.isLoadingDocumento = false;
        });
    }

    private mapApiDocumentoToDisplay(apiDocumento: DocumentoOut): DocumentoDisplay {

        return {
            id: apiDocumento.id!, // '!' assume que o ID sempre existirá após vir da API
            tipoDocumento: apiDocumento.tipoDocumento,
            tipoDocumentoDescricao: apiDocumento.tipoDocumentoDescricao,
             dataExpedicao: apiDocumento.dataExpedicao,
            
            numeroDocumento: apiDocumento.numeroDocumento,
            dataDocumento: apiDocumento.dataDocumento,
            documentoOrigem: apiDocumento.documentoOrigem || null,
            orgaoExpedidor: apiDocumento.orgaoExpedidor,
            dataPrimeiraCnh: apiDocumento.dataPrimeiraCnh || null,
            dataValidade: apiDocumento.dataValidade,
            pessoaNome: apiDocumento.pessoaNome,

            categoriaCnh: apiDocumento.categoriaCnh || null,
            zona: apiDocumento.zona || null, 
            secao: apiDocumento.secao || null,

            observacao: apiDocumento.observacao || '',

            originalApiData: apiDocumento // Guardar o objeto original pode ser útil
        };
    }

    atualizarDocumentosParaExibir(documentosApiMapeados?: DocumentoDisplay[] | null): void {
        if (this.pessoaId && documentosApiMapeados) {
            // Se tem ID e dados da API foram carregados e mapeados, usa eles
            this.documentosParaExibir = documentosApiMapeados;
        } else {
            this.documentosParaExibir = [];
        }
    }

    adicionarNovoDocumento(): void {

        this.dialogService.open(DocumentoIudComponent, {
            context: {
                pessoaId: this.pessoaId,
                nomePessoa: this.nomePessoaAtualParaDialog
            },
        }).onClose.subscribe(documentoSalvo => {
            if (documentoSalvo) {
                console.log('Novo Documento retornado pelo modal:', documentoSalvo);
                if (this.pessoaId) {
                } else {
                    this.documentos.push({ ...documentoSalvo, id: Math.floor(Math.random() * 1000) + 200 }); 
                }
                this.carregarDocumentos();
            }
        });
    }

    editarDocumento(documento: any): void {
        console.log('Editando documento : ', documento, ' ', this.nomePessoaAtualParaDialog);
        this.dialogService.open(DocumentoIudComponent, {
            context: {
                pessoaId: this.pessoaId,
                nomePessoa: this.nomePessoaAtualParaDialog,
                documentoParaEdicao: { ...documento }, // Passa uma cópia para evitar mutação direta
            }
        }).onClose.subscribe(documentoAtualizado => {
            if (documentoAtualizado) {
                // Atualizar na lista correta (real ou exemplo)
                const atualizarArray = (arr: any[]) => {
                    const index = arr.findIndex(e => e.id === documentoAtualizado.id);
                    if (index > -1) {
                        arr[index] = documentoAtualizado;
                    }
                };
                this.carregarDocumentos();
            }
        });
    }

    excluirDocumentoWrapper(documento: DocumentoDisplay): void {

        let documentoDescricao = `${ documento.tipoDocumentoDescricao } ${ documento.numeroDocumento }`;
        if (documento.observacao && documento.observacao !== 'S/N') {
            documentoDescricao += `, ${documento.observacao}`;
        }

        this.dialogService.open(ConfirmDeleteComponent, {
            context: {
                title: 'Excluir Documento',
                message: `Tem certeza que deseja excluir o documento "${documentoDescricao}"?`,
            },
        }).onClose.subscribe(confirmed => { // 'confirmed' será true ou false/undefined
            if (confirmed) { // Se o usuário confirmou (retornou true)
                this.isLoadingDocumento = true;
                this.documentoService.delete(documento.id).subscribe({ 
                    next: () => {
                        this.showToast('Documento excluído com sucesso!', 'Sucesso', 'success');
                        this.carregarDocumentos();
                    },
                    error: (err) => {
                        console.error('Erro ao excluir documento:', err);
                        const errorMessage = err.error?.message || err.message || 'Falha ao excluir o documento. Tente novamente.';
                        this.showToast(errorMessage, 'Erro', 'danger');
                        this.isLoadingDocumento = false;
                    }
                });
            }
        });
    }

    private showToast(message: string, title: string, status: 'success' | 'danger' | 'warning' | 'info'): void {
        this.toastrService.show(message, title, {
            status,
            position: NbGlobalPhysicalPosition.TOP_RIGHT,
            duration: 3000
        });
    }
}