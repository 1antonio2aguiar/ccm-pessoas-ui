import { Component, OnInit } from '@angular/core';
import { LocalDataSource } from 'ng2-smart-table';
import { ActivatedRoute, Router } from '@angular/router';
import { Filters } from '../../../shared/filters/filters';
import { HttpParams } from '@angular/common/http';
import { NbDialogService, NbToastrService, NbWindowControlButtonsConfig, NbWindowService, NbToastrConfig } from '@nebular/theme';

import { CepService } from '../cep.service';
import { Cep } from '../../../shared/models/cep';
import { filter } from 'rxjs/operators';
import { CepPipe } from '../../../shared/pipes/cep.pipe';
import { BuscaCidadeDistritoComponent } from '../distrito/BuscaCidadeDistritoComponent';
import { BuscaLogradouroPorCidadeComponent } from '../logradouro/BuscaLogradouroPorCidadeComponent';
import { BuscaBairroPorCidadeComponent } from '../bairro/BuscaBairroPorCidadeComponent';
import { ConfirmationDialogComponent } from '../../components/base-resource-confirmation-delete/confirmation-dialog/confirmation-dialog.component';
import { CepEditorComponent } from './CepEditorComponent';

import { FormControl } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { CidadeService } from '../../cidades/cidade.service'; 
import { Cidade } from '../../../shared/models/cidade';
 
@Component({
  selector: 'ngx-cep-pesquisa',
  templateUrl: './cep-pesquisa.component.html',
  styleUrls: ['./cep-pesquisa.component.scss']
})  

export class CepPesquisaComponent implements OnInit{
  source: LocalDataSource = new LocalDataSource();
  filtro: Filters = new Filters();
  cep: any[] = [];

  private cepPipeInstance = new CepPipe();

  cidadeCtrl = new FormControl('');
  sugestoesCidades: Cidade[] = [];
  showCidadeDropdown = false;
  estadoSiglaSelecionada: string | null = null;

  cidadeIdSelecionada: number | null = null;
  cidadeNomeSelecionada: string | null = null;
  
  selectedCampeonatoId: number;
  selectedEtapaId: number;

  settings = {
    //mode: 'external',

    pager: {
      perPage: this.filtro.itensPorPagina, // Define o número de linhas por página
      display: true, // Exibe o paginador
    },

     actions: {
      add: true,
      edit: true,
      delete: true,
    },

    add: {
      addButtonContent: '<i class="nb-plus"></i>',
      createButtonContent: '<i class="nb-checkmark"></i>',
      cancelButtonContent: '<i class="nb-close"></i>',
      confirmCreate: true,
      addMode: 'edit'
    },

    edit: {
      editButtonContent: '<i class="nb-edit"></i>',
      saveButtonContent: '<i class="nb-checkmark"></i>',
      cancelButtonContent: '<i class="nb-close"></i>',
      confirmSave: true,
    },

    delete: {
      deleteButtonContent: '<i class="nb-trash"></i>',
      confirmDelete: true,
    },

    columns: {
      id: {
        title: 'ID',
        type: 'number',
        hide: true,
      },

      cep: {
        title: 'Cep',
        type: 'string',
        width: '150px',
        editor: {
          type: 'custom',
          component: CepEditorComponent,
        },
        valuePrepareFunction: (cell: any, row: any) => {
          return this.cepPipeInstance.transform(row.cep);
        },
      },

      cidadeNome: {
        title: 'Cidade',
        type: 'object',
        editable: true,
        width: '150px',
        hide: true,

        editor: {
          type: 'custom',
          component: BuscaCidadeDistritoComponent, // <<< busca cidade/distrito pelo nome da cidade
        },
      },

      distritoNome: {
        title: 'Cidade',
        type: 'string',
        hide: true,
        width: '150px',
      },

      tipoLogradouro: {
        title: 'Tipo',
        type: 'string',
        width: '80px',
      },

      logradouroNome: {
        title: 'Logradouro',
        type: 'string',
        editable: true,
        width: '300px',

        editor: {
          type: 'custom',
          component: BuscaLogradouroPorCidadeComponent,
        },
      },

      bairroNome: {
        title: 'Bairro',
        type: 'string',
        editable: true,
        width: '300px',

        editor: {
          type: 'custom',
          component: BuscaBairroPorCidadeComponent,
        },
      },

      numeroIni: {
        title: 'Inicio',
        type: 'number',
        width: '50px',
      },

      numeroFim: {
        title: 'Fim',
        type: 'number',
        width: '50px',
      },

      identificacao: {
        title: 'Identificação',
        type: 'string',
        width: '20px',

        editor: {
          type: 'list',
          config: {
            selectText: 'Selecione',
            list: [
              { value: 'U', title: 'Ùnico' },
              { value: 'D', title: 'Direita' },
              { value: 'E', title: 'Esquerda' },
              { value: 'I', title: 'Impar' },
              { value: 'P', title: 'Par' },
              { value: 'A', title: 'Ambos' },
            ],
          },
        },
        valuePrepareFunction: (value: string) => {
          const map: any = {
            U: 'Ùnico',
            D: 'Direita',
            E: 'Esquerda',
            I: 'Impar',
            P: 'Par',
            A: 'Ambos',
          };
          return map[value] ?? value ?? '';
        },
      },
    }
  }
  
  constructor(private cepService: CepService, 
    private cidadeService: CidadeService,
    private windowService: NbWindowService,
    private router: Router,
    private routeActive: ActivatedRoute,
    private dialogService: NbDialogService,
    private toastrService: NbToastrService
    ) {
    // Inicializar o filtro com valores padrões
    this.filtro.pagina = 1;
    this.filtro.itensPorPagina = 10;
  }
  
  ngOnInit(): void {
    // NÃO carrega nada ao entrar
    this.source.load([]);

    // autocomplete da cidade
    this.cidadeCtrl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe((value: string) => {
        const texto = (value ?? '').trim();

        // se usuário apagou/alterou, invalida seleção
        if (!this.cidadeNomeSelecionada || texto !== this.cidadeNomeSelecionada) {
          this.cidadeIdSelecionada = null;
          this.cidadeNomeSelecionada = null;
        }

        if (texto.length < 2) {
          this.sugestoesCidades = [];
          return;
        }

        this.cidadeService.filtrarPorNome(texto, 0, 20).subscribe({
          next: (lista: Cidade[]) => {
            this.sugestoesCidades = lista ?? [];
            this.showCidadeDropdown = true;
          },
          error: (err) => console.error('Erro ao buscar cidades:', err),
        });
      });

    // seus filtros do grid podem continuar, mas AGORA você vai ignorar cidadeNome porque tirou a coluna.
    this.source.onChanged().subscribe((change) => {
      if (change.action === 'filter') {
        this.onTableFilter(change.filter);
      }
    });
  }

  listar() {
    this.filtro.pagina = 0;
    this.filtro.params = new HttpParams();


    this.cepService.pesquisar(this.filtro)

      .then(response => {
        const ceps = response.ceps;
        this.source.load(ceps);
    });
  }

  onCreateConfirm(event) {
    if (!event.newData.distritoId) {
      this.toastrService.show(
        'Selecione uma cidade para preencher corretamente.',
        'Atenção',
        { status: 'warning' },
      );
      event.confirm.reject();
      return;
    }

    this.cepService.create(event.newData).subscribe({
      next: () => {
        this.listar();
        event.confirm.resolve();
        this.toastrService.show(
          'Novo cep cadastrado com sucesso!',
          'Cadastro Realizado',
          { status: 'success', icon: 'checkmark-circle-outline' },
        );
      },
      error: (error) => {
        console.error('Erro ao criar cep:', error);
        event.confirm.reject();
      },
    });
  }

  onSaveConfirm(event) {
    // mantém ids que não podem mudar
    event.newData.distritoId = event.data.distritoId;
    event.newData.distritoNome = event.data.distritoNome;

    // garante que o ID continue (muito importante pro grid)
    event.newData.id = event.data.id;

    this.cepService.update(event.newData).subscribe({
      next: () => {
        // ✅ 1) resolve primeiro (atualiza a linha no grid)
        event.confirm.resolve(event.newData);
        
        // ✅ 2) depois recarrega (próximo tick)
        //setTimeout(() => this.listar(), 0);

        this.toastrService.show(
          `Cep "${event.newData.cep}" foi atualizado com sucesso!`,
          'Atualização Realizada',
          { status: 'success', icon: 'edit-outline' },
        );
      },
      error: (error) => {
        console.error('Erro ao editar cep:', error);
        event.confirm.reject();
      },
    });
  }
  
  onDeleteConfirm(event): void {
    const item = event.data;

    this.dialogService.open(ConfirmationDialogComponent, {
      context: {
        title: 'Confirmar Exclusão',
        message: `Você tem certeza que deseja excluir o cep <strong>"${item.cep}"</strong>?`,
        confirmButtonText: 'Sim, Excluir',
        cancelButtonText: 'Cancelar',
        status: 'danger',
        icon: 'trash-2-outline',
      },
      closeOnBackdropClick: false,
    }).onClose.subscribe((confirmado) => {
      if (confirmado) {
        this.cepService.delete(item.id)
          .subscribe({
            next: () => {
              this.listar();
              event.confirm.resolve();

              this.toastrService.show(
                `Cep "${item.nome}" foi excluído com sucesso.`,
                'Exclusão Realizada',
                { status: 'success', icon: 'trash-2-outline' },
              );
            },
            error: (error) => {
              console.error('Erro ao deletar cep:', error);
              event.confirm.reject();

              this.toastrService.show(
                'Não foi possível excluir o cep. Verifique se ele não está sendo usado em outras partes do sistema.',
                'Erro na Exclusão',
                { status: 'danger', icon: 'alert-circle-outline' },
              );
            },
          });
      } else {
        event.confirm.reject();
      }
    });
  }

  selecionarCidade(c: any) {
    this.cidadeIdSelecionada = c?.id ?? null;
    this.cidadeNomeSelecionada = c?.nome ?? null;

    // ✅ seta o UF no input
    this.estadoSiglaSelecionada = c?.estadoUf ?? null;

    this.cidadeCtrl.setValue(this.cidadeNomeSelecionada ?? '', { emitEvent: false });

    this.sugestoesCidades = [];
    this.showCidadeDropdown = false;

    // se você está buscando automático ao selecionar:
    this.buscarPorCidade();
  }

  onCidadeBlur() {
    setTimeout(() => (this.showCidadeDropdown = false), 150);
  }

  buscarPorCidade() {
    if (!this.cidadeIdSelecionada) {
      this.toastrService.show('Selecione uma cidade válida.', 'Atenção', { status: 'warning' });
      return;
    }

    this.filtro.pagina = 0;
    let params = new HttpParams()
      .set('cidadeId', String(this.cidadeIdSelecionada));

    // se quiser manter filtros já digitados na tabela (cep, logradouro, bairro...), você pode mesclar aqui depois
    this.filtro.params = params;

    this.cepService.pesquisar({ ...this.filtro, params } as any)
      .then((response) => {
        const ceps = response.ceps ?? [];
        this.source.load(ceps);
      });
  }

  limparCidade() {
    this.cidadeCtrl.setValue('', { emitEvent: false });
    this.cidadeIdSelecionada = null;
    this.cidadeNomeSelecionada = null;
    this.sugestoesCidades = [];
    this.showCidadeDropdown = false;
    this.estadoSiglaSelecionada = null;

    // limpa tabela
    this.source.load([]);
  }

  onTableFilter(filters: any) {
    // ✅ regra: sem cidade selecionada, não busca
    if (!this.cidadeIdSelecionada) {
      this.source.load([]);
      return;
    }

    let params = new HttpParams().set('cidadeId', String(this.cidadeIdSelecionada));

    const filtersArray = (filters && filters.filters && Array.isArray(filters.filters)) ? filters.filters : [];
    const idFilter = filtersArray.find(f => f.field === 'id');
    const cepFilter = filtersArray.find(f => f.field === 'cep');
    const logradouroFilter = filtersArray.find(f => f.field === 'logradouroNome');
    const bairroFilter = filtersArray.find(f => f.field === 'bairroNome');

    if (idFilter?.search) params = params.set('id', idFilter.search);

    // ✅ CEP: manda limpo (só dígitos)
    if (cepFilter?.search) {
      const cepDigits = String(cepFilter.search).replace(/\D/g, '');
      params = params.set('cep', cepDigits);
    }

    if (logradouroFilter?.search) params = params.set('logradouroNome', logradouroFilter.search);
    if (bairroFilter?.search) params = params.set('bairroNome', bairroFilter.search);

    this.filtro.params = params;

    this.cepService.pesquisar({ ...this.filtro, params } as any)
      .then((response) => {
        const ceps = response.ceps ?? [];
        this.source.load(ceps);
      });
  }
}

