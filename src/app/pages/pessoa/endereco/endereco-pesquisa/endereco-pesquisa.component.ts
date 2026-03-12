import { Component, OnInit, Input, OnDestroy } from '@angular/core'; // Adicionado OnDestroy
import { Subject } from 'rxjs';                         // Adicionado Subject
import { takeUntil } from 'rxjs/operators';             // Adicionado takeUntil
import { NbDialogService } from '@nebular/theme';
import { NbGlobalPhysicalPosition, NbToastrService, NbWindowControlButtonsConfig } from '@nebular/theme';
import { ActivatedRoute, Router, NavigationEnd, Navigation } from '@angular/router';

import { EnderecoIudComponent } from '../endereco-iud/endereco-iud.component';
import { PessoaContextService } from '../../../../services/pessoa-context.service';
import { EnderecoService } from '../endereco.service';
import { EnderecoOut } from '../../../../shared/models/enderecoOut';
import { ConfirmDeleteComponent } from '../../../components/base-resource-confirmation-delete/confirm-delete-modal.component';

export interface BairroApi { // Interface para o objeto dentro do array de bairros
  id: number;
  nome: string;
}

interface EnderecoDisplay {
  id: number;
  tipoEndereco?: number; 
  tipoEnderecoDescricao?: string;
  tipoLogradouro: string;
  logradouroNome: string;
  numero: string;
  complemento?: string;

  bairroId?: number;
  bairroNome?: string;
  
  cidadeNome: string;
  estadoUf: string;
  cep: string;
  principal: boolean;
  cepId: number;
  logradouroId: number;
  originalApiData?: EnderecoOut;
}

@Component({
  selector: 'ngx-endereco-pesquisa',
  templateUrl: './endereco-pesquisa.component.html',
  styleUrls: ['./endereco-pesquisa.component.scss']
})

export class EnderecoPesquisaComponent implements OnInit, OnDestroy {
  
  pessoaId: number | null = null;
  nomePessoaAtualParaDialog: string | null = null;
  private destroy$ = new Subject<void>();

  enderecosExemplo: EnderecoDisplay[] = [];
  enderecosParaExibir: EnderecoDisplay[] = [];
  isLoadingEnderecos = false;
  
  constructor(
    private route: ActivatedRoute,
    private pessoaContextService: PessoaContextService,
    private enderecoService: EnderecoService,
    private toastrService: NbToastrService,
    private dialogService: NbDialogService ,
    private router: Router,
  ) {
  }

  ngOnInit(): void {

    this.route.parent?.params.pipe(
      takeUntil(this.destroy$)
    ).subscribe(parentParams => {
      if (parentParams['id']) {
        this.pessoaId = +parentParams['id'];
        this.carregarEnderecos(); // <<< CHAMAR AQUI
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

  carregarEnderecos(): void {
    this.isLoadingEnderecos = true;
    this.enderecoService.getEnderecoByPessoaId(this.pessoaId) // Usando a versão com Promise
      .toPromise()
      .then(apiEnderecos => {
        const enderecosMapeados = apiEnderecos.map(apiEnd => this.mapApiEnderecoToDisplay(apiEnd));
        this.atualizarEnderecosParaExibir(enderecosMapeados);
      })
      .catch(error => {
        console.error('Erro ao carregar endereços:', error);
        this.atualizarEnderecosParaExibir(null); // Limpa a lista em caso de erro
      })
      .finally(() => {
        this.isLoadingEnderecos = false;
    });
  }

  atualizarEnderecosParaExibir(enderecosApiMapeados?: EnderecoDisplay[] | null): void {
    if (this.pessoaId && enderecosApiMapeados) {
      // Se tem ID e dados da API foram carregados e mapeados, usa eles
      this.enderecosParaExibir = enderecosApiMapeados;
    } else if (!this.pessoaId && this.enderecosExemplo.length > 0) {
      // Se não tem ID de pessoa (novo cadastro), mostra exemplos
      this.enderecosParaExibir = this.enderecosExemplo;
    } else {
      // Nenhum para exibir (ex: erro ao carregar, ou pessoaId existe mas não há endereços)
      this.enderecosParaExibir = [];
    }
  }

  private mapApiEnderecoToDisplay(apiEndereco: EnderecoOut): EnderecoDisplay {
    
     let tipoEnderecoDescricao = '';
    if (apiEndereco.tipoEndereco === 0) { 
      tipoEnderecoDescricao = 'CASA';
    } else if (apiEndereco.tipoEndereco === 1) {
      tipoEnderecoDescricao = 'TRABALHO';
    } else if (apiEndereco.tipoEndereco) { 
        console.warn(`Tipo de endereço não mapeado: ${apiEndereco.tipoEndereco}`);
    }

    return {
      id: apiEndereco.id!, // '!' assume que o ID sempre existirá após vir da API
      tipoEndereco: apiEndereco.tipoEndereco,
      tipoEnderecoDescricao: tipoEnderecoDescricao,
      tipoLogradouro: apiEndereco.tipoLogradouro || apiEndereco.tipoLogradouro || 'N/I', 
      logradouroNome: apiEndereco.logradouroNome || apiEndereco.logradouroNome || 'N/I', 
      numero: apiEndereco.numero?.toString() || 'S/N',
      complemento: apiEndereco.complemento || '',

      bairroNome: apiEndereco.bairroNome,
      bairroId: apiEndereco.bairroId,
      
      cidadeNome: apiEndereco.cidadeNome || 'N/I', 
      estadoUf: apiEndereco.estadoUf || 'N/I', 
      cep: apiEndereco.cep || 'N/I', 
      principal: apiEndereco.principal === 'S' || apiEndereco.principal === 'SIM', 
      cepId: apiEndereco.cepId,
      logradouroId: apiEndereco.logradouroId,
      originalApiData: apiEndereco // Guardar o objeto original pode ser útil
    };
  }

  adicionarNovoEndereco(): void {
    const buttonsConfig: NbWindowControlButtonsConfig = {
      minimize: false,
      maximize: false,
      fullScreen: true,
      close: true
    };

    this.dialogService.open(EnderecoIudComponent, {
      context: {
        pessoaId: this.pessoaId, 
        nomePessoa: this.nomePessoaAtualParaDialog
      },
      closeOnBackdropClick: false, // Impede que o diálogo feche ao clicar fora

    }).onClose.subscribe(enderecoSalvo => {
      if (enderecoSalvo) {
        console.log('Novo endereço retornado pelo modal:', enderecoSalvo);
        if (this.pessoaId) {
        } else {
          this.enderecosExemplo.push({ ...enderecoSalvo, id: Math.floor(Math.random() * 1000) + 200 }); // Adiciona ao array de exemplos
        }
        this.carregarEnderecos();
      }
    });
  } 

  editarEndereco(endereco: any): void {
    //console.log('Editando endereço : ', endereco, ' ', this.nomePessoaAtualParaDialog);

    const buttonsConfig: NbWindowControlButtonsConfig = {
      minimize: false,
      maximize: false,
      fullScreen: true,
      close: true
    };
    this.dialogService.open(EnderecoIudComponent, {
      context: {
        pessoaId: this.pessoaId,
        nomePessoa: this.nomePessoaAtualParaDialog,
        enderecoParaEdicao: { ...endereco }, // Passa uma cópia para evitar mutação direta
      },
      closeOnBackdropClick: false, // Impede que o diálogo feche ao clicar fora
      
    }).onClose.subscribe(enderecoAtualizado => {
      if (enderecoAtualizado) {
        console.log('Endereço atualizado retornado pelo modal:', enderecoAtualizado);
        // Atualizar na lista correta (real ou exemplo)
        const atualizarArray = (arr: any[]) => {
          const index = arr.findIndex(e => e.id === enderecoAtualizado.id);
          if (index > -1) {
            arr[index] = enderecoAtualizado;
          }
        };
        this.carregarEnderecos();
      }
    });
  }

  excluirEnderecoWrapper(endereco: EnderecoDisplay): void {
    // Lógica para endereços de exemplo (quando não há pessoaId)

    let enderecoDescricao = `${endereco.logradouroNome || 'Logradouro não informado'}`;
    if (endereco.numero && endereco.numero !== 'S/N') {
      enderecoDescricao += `, ${endereco.numero}`;
    }

    const buttonsConfig: NbWindowControlButtonsConfig = {
      minimize: false,
      maximize: false,
      fullScreen: true,
      close: true
    };

    this.dialogService.open(ConfirmDeleteComponent, {
      context: {
        title: 'Excluir Endereço',
        message: `Tem certeza que deseja excluir o endereço "${enderecoDescricao}"?`,
        // data: endereco // O dialog não precisa retornar 'data' para esta lógica
      },
      closeOnBackdropClick: false, // Impede que o diálogo feche ao clicar fora

    }).onClose.subscribe(confirmed => { // 'confirmed' será true ou false/undefined
      if (confirmed) { // Se o usuário confirmou (retornou true)
        this.isLoadingEnderecos = true;
        this.enderecoService.delete(endereco.id).subscribe({ // <<-- USAMOS O ID DO 'endereco' ORIGINAL
          next: () => {
            this.showToast('Endereço excluído com sucesso!', 'Sucesso', 'success');
            this.carregarEnderecos();
          },
          error: (err) => {
            console.error('Erro ao excluir endereço:', err);
            const errorMessage = err.error?.message || err.message || 'Falha ao excluir o endereço. Tente novamente.';
            this.showToast(errorMessage, 'Erro', 'danger');
            this.isLoadingEnderecos = false;
          }
        });
      }
    });
  }

  definirComoPadraoWrapper(endereco: EnderecoDisplay): void {
    if (!this.pessoaId) {
      this.showToast('Operação não permitida. ID da pessoa não encontrado.', 'Atenção', 'warning');
      return;
    }

    this.isLoadingEnderecos = true; // Mostrar feedback de carregamento
    this.enderecoService.definirComoPrincipal(endereco.id, this.pessoaId).subscribe({
      next: () => {
        this.showToast(`Endereço "${endereco.logradouroNome}" definido como principal.`, 'Sucesso', 'success');
        this.carregarEnderecos(); // Recarrega TODOS os endereços para refletir a mudança
        // O carregarEnderecos já lida com isLoadingEnderecos = false
      },
      error: (err) => {
        console.error('Erro ao definir endereço como principal:', err);
        const errorMessage = err.error?.message || err.message || 'Falha ao definir o endereço como principal.';
        this.showToast(errorMessage, 'Erro', 'danger');
        this.isLoadingEnderecos = false; // Garantir que o loader seja desativado em caso de erro aqui
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