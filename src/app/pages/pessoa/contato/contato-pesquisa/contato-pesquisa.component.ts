import { Component, OnInit, Input, OnDestroy } from '@angular/core'; // Adicionado OnDestroy
import { ActivatedRoute, Router, NavigationEnd, Navigation } from '@angular/router';
import { NbDialogService } from '@nebular/theme';
import { takeUntil } from 'rxjs/operators'; 
import { NbGlobalPhysicalPosition, NbToastrService, } from '@nebular/theme';
import { Subject } from 'rxjs'; 

import { ContatoOut } from "../../../../shared/models/contatoOut";
import { ContatoService } from '../contato.service';
import { PessoaContextService } from '../../../../services/pessoa-context.service';
import { ContatoIudComponent } from '../contato-iud/contato-iud.component';
import { ConfirmDeleteComponent } from '../../../components/base-resource-confirmation-delete/confirm-delete-modal.component';
import { formatarTelefoneUtil } from '../../../../shared/utils/formatar-telefone.util';

interface ContatoDisplay {
  id: number;

  tipoContato?: number;
  tipoContatoDescricao?: string;

  contato: string;
  complemento?: string;
  principal?: boolean;

  pessoaNome?: string;

  dadosPessoaJuridicaId?: number | null;
  estabelecimentoNome?: string;
  estabelecimentoCnpj?: string;

  originalApiData?: ContatoOut;
}

@Component({
  selector: 'ngx-contato-pesquisa',
  templateUrl: './contato-pesquisa.component.html',
  styleUrls: ['./contato-pesquisa.component.scss']
})

export class ContatoPesquisaComponent implements OnInit, OnDestroy {
    pessoaId: number | null = null;
    nomePessoaAtualParaDialog: string | null = null;
    private destroy$ = new Subject<void>();

    contatos: ContatoDisplay[] = [];
    tipoContatoStr = '';
    contatosParaExibir: ContatoDisplay[] = [];
    isLoadingContatos = false;

    constructor(
        private route: ActivatedRoute,
        private pessoaContextService: PessoaContextService,
        private contatoService: ContatoService,
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
                this.carregarContatos(); // <<< CHAMAR AQUI
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

    carregarContatos(): void {

        this.isLoadingContatos = true;
        this.contatoService.getContatoByPessoaId(this.pessoaId) // Usando a versão com Promise
            .toPromise()
            .then(apiContatos => {
                const contatosMapeados = apiContatos.map(apiEnd => this.mapApiContatoToDisplay(apiEnd));
                this.atualizarContatosParaExibir(contatosMapeados);
            })
            .catch(error => {
                console.error('Erro ao carregar contatos:', error);
                this.atualizarContatosParaExibir(null); // Limpa a lista em caso de erro
            })
            .finally(() => {
                this.isLoadingContatos = false;
        });
    }

    private mapApiContatoToDisplay(
    apiContato: ContatoOut,
    ): ContatoDisplay {

    return {
        id: apiContato.id!,

        tipoContato:
        apiContato.tipoContato,

        tipoContatoDescricao:
        apiContato.tipoContatoDescricao,

        contato:
        apiContato.contato ?? '',

        complemento:
        apiContato.complemento ?? '',

        principal:
        apiContato.principal === 'S' ||
        apiContato.principal === 'SIM',

        pessoaNome:
        apiContato.pessoaNome,

        dadosPessoaJuridicaId:
        apiContato.dadosPessoaJuridicaId ?? null,

        estabelecimentoNome:
        apiContato.estabelecimentoNome ?? '',

        estabelecimentoCnpj:
        apiContato.estabelecimentoCnpj ?? '',

        originalApiData:
        apiContato,
        };
    }

    atualizarContatosParaExibir(contatosApiMapeados?: ContatoDisplay[] | null): void {
        if (this.pessoaId && contatosApiMapeados) {
            // Se tem ID e dados da API foram carregados e mapeados, usa eles
            this.contatosParaExibir = contatosApiMapeados;
        } else {
            this.contatosParaExibir = [];
        }
    }

    adicionarNovoContato(): void {

        this.dialogService.open(ContatoIudComponent, {
            context: {
                pessoaId: this.pessoaId,
                nomePessoa: this.nomePessoaAtualParaDialog
            },
        }).onClose.subscribe(contatoSalvo => {
            if (contatoSalvo) {
                console.log('Novo contato retornado pelo modal:', contatoSalvo);
                if (this.pessoaId) {
                } else {
                    this.contatos.push({ ...contatoSalvo, id: Math.floor(Math.random() * 1000) + 200 }); // Adiciona ao array de exemplos
                }
                this.carregarContatos();
            }
        });
    }

    editarContato(contato: ContatoDisplay): void {
        this.dialogService.open(ContatoIudComponent, {
            context: {
            pessoaId: this.pessoaId,
            nomePessoa: this.nomePessoaAtualParaDialog,

            contatoParaEdicao: {
                ...(contato.originalApiData ?? contato),
            },
            },
            closeOnBackdropClick: false,
        }).onClose.subscribe(contatoAtualizado => {
            if (contatoAtualizado) {
            this.carregarContatos();
            }
        });
    }

    excluirContatoWrapper(contato: ContatoDisplay): void {
        
        const tipoContatoComoString = contato.tipoContato?.toString() || '';
        this.tipoContatoStr = tipoContatoComoString;
        const valorFormatado = formatarTelefoneUtil(contato.contato, this.tipoContatoStr);

        let contatoDescricao = `${valorFormatado || ''}`;
        if (contato.complemento && contato.complemento !== 'S/N') {
            contatoDescricao += `, ${contato.complemento}`;
        }

        this.dialogService.open(ConfirmDeleteComponent, {
            context: {
                title: 'Excluir Contato',
                message: `Tem certeza que deseja excluir o contato "${contatoDescricao}"?`,
            },
        }).onClose.subscribe(confirmed => { // 'confirmed' será true ou false/undefined
            if (confirmed) { // Se o usuário confirmou (retornou true)
                this.isLoadingContatos = true;
                this.contatoService.delete(contato.id).subscribe({ // <<-- USAMOS O ID DO 'contato' ORIGINAL
                    next: () => {
                        this.showToast('Contato excluído com sucesso!', 'Sucesso', 'success');
                        this.carregarContatos();
                    },
                    error: (err) => {
                        console.error('Erro ao excluir contato:', err);
                        const errorMessage = err.error?.message || err.message || 'Falha ao excluir o contato. Tente novamente.';
                        this.showToast(errorMessage, 'Erro', 'danger');
                        this.isLoadingContatos = false;
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

    definirComoPadraoWrapper(
    contato: ContatoDisplay,
    ): void {

    if (!this.pessoaId) {
        this.showToast(
        'Código da pessoa não encontrado.',
        'Erro',
        'danger',
        );

        return;
    }

    if (!contato.id) {
        this.showToast(
        'Código do contato não encontrado.',
        'Erro',
        'danger',
        );

        return;
    }

    this.isLoadingContatos = true;

    this.contatoService
        .definirComoPrincipal(
        contato.id,
        this.pessoaId,
        )
        .pipe(
        takeUntil(this.destroy$),
        )
        .subscribe({
        next: () => {
            this.showToast(
            `${contato.tipoContatoDescricao ?? 'Contato'} definido como principal com sucesso!`,
            'Sucesso',
            'success',
            );

            this.carregarContatos();
        },

        error: (err) => {
            console.error(
            'Erro ao definir contato como principal:',
            err,
            );

            const errorMessage =
            err?.error?.message ||
            err?.message ||
            'Falha ao definir o contato como principal. Tente novamente.';

            this.showToast(
            errorMessage,
            'Erro',
            'danger',
            );

            this.isLoadingContatos = false;
        },
        });
    }

    formatarCnpj(value: any): string {
        if (!value) {
            return '';
        }

        const cnpj = String(value).replace(/\D/g, '');

        if (cnpj.length !== 14) {
            return String(value);
        }

        return cnpj.replace(
            /(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/,
            '$1.$2.$3/$4-$5',
        );
    }
}