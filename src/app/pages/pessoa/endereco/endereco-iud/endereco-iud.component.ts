import { Component, ElementRef, Input, OnDestroy, OnInit, ViewChild, AfterViewInit } from '@angular/core'; // Adicionar OnDestroy
import { FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { NbDialogRef, NbToastrService } from '@nebular/theme';
import { Observable, of, Subject } from 'rxjs'; // Importar Subject
import { CepService } from '../../../cep/cep.service';
import { CepOut } from '../../../../shared/models/cepOut';
import { EnderecoService } from '../endereco.service';
import { EnderecoIn } from '../../../../shared/models/enderecoIn';
import { EnderecoOut } from '../../../../shared/models/enderecoOut';
import { debounceTime, distinctUntilChanged, filter, map, startWith, switchMap, takeUntil, tap } from 'rxjs/operators';

import { TipoLogradouro } from '../../../../shared/models/tipoLogradouro';
import { TipoLogradouroService } from '../../../tipo-logradouro/tipo-logradouro.service';
import { LogradouroService } from '../../../logradouro/logradouro.service';
import { LogradouroPesquisaOut } from '../../../../shared/models/logradouroPesquisaOut';
import BairroOut from '../../../../shared/models/bairroOut';
import { CidadePesquisaOut } from '../../../../shared/models/cidadePesquisaOut';
import { LogradouroSimple } from '../../../../shared/models/logradouroSimple';
import { BairroSimple } from '../../../../shared/models/bairroSimple';
import { Distrito } from '../../../../shared/models/distrito';
import { DistritoService } from '../../../distrito/distrito.service';
import { BairroService } from '../../../bairro/bairro.service';

@Component({
  selector: 'ngx-endereco-iud',
  templateUrl: './endereco-iud.component.html',
  styleUrls: ['./endereco-iud.component.scss']
})

export class EnderecoIudComponent implements OnInit, OnDestroy {

  @Input() enderecoParaEdicao: any;
  @Input() pessoaId: number | null = null; // Para associar o endereço à pessoa
  @Input() nomePessoa: string | null = null; // Para mostrar no cabeçalho do html
  @Input() mode: 'add' | 'edit' = 'add';

  isLoadingLogradouros = false;
  isLoadingCidades = false;
  usarBairroSelect = false;

  //
  showCidadeDropdown = false;
  showLogradouroDropdown = false;
  showBairroDropdown = false;

  // Autocomplete controls (fora do form pra não brigar com patchValue)
  cidadeCtrl = new FormControl('');
  logradouroCtrl = new FormControl('');
  bairroCtrl = new FormControl('');

  sugestoesCidades: Distrito[] = [];
  sugestoesLogradouros: LogradouroSimple[] = [];
  sugestoesBairros: BairroSimple[] = [];

  cepsEncontrados: string[] = [];
  mostrarSeletorCepEncontrado = false;
  isBuscandoCepPorEndereco = false;
  cepEncontradoCtrl = new FormControl<string | null>(null);

  //

  logradourosPesquisa: LogradouroPesquisaOut[] = [];
  cidadesPesquisa: CidadePesquisaOut[] = [];

  tiposLogradouro: TipoLogradouro[] = [];
  bairros: BairroOut[] = [];

  private destroy$ = new Subject<void>(); // Para desinscrição

  private cepId = 0;
  private logradouroId = 0;
  private cidadeId = 0;
  private distritoId = 0;
  private bairroId = 0;

  enderecoForm!: FormGroup;
  modoEdicao = false;
  isLoadingCep = false;
  isLoadingSalvar = false;
  private isSelectingLogradouro = false;
  private isSelectingCidade = false;
  items: any;

  constructor(
    protected dialogRef: NbDialogRef<EnderecoIudComponent>,
    private toastrService: NbToastrService,
    private fb: FormBuilder,
    private cepService: CepService,
    private enderecoService: EnderecoService,
    private logradouroService: LogradouroService,
    private bairroService: BairroService,
    private distritoService: DistritoService,
  ) { }

  ngOnInit(): void {
    this.modoEdicao = !!this.enderecoParaEdicao;
    this.initForm();

    if (this.modoEdicao && this.enderecoParaEdicao) {
      let tipoEnderecoStringParaForm: string;

      if (this.enderecoParaEdicao.tipoEndereco === 1) {
        tipoEnderecoStringParaForm = 'CASA';
      } else if (this.enderecoParaEdicao.tipoEndereco === 2) {
        tipoEnderecoStringParaForm = 'TRABALHO';
      } else {
        tipoEnderecoStringParaForm = this.enderecoForm.get('tipoEndereco')?.value || 'CASA';
      }

      const { tipoEndereco, ...dadosRestantes } = this.enderecoParaEdicao;

      const dadosParaFormulario = {
        ...dadosRestantes,
        tipoEndereco: tipoEnderecoStringParaForm,
        tipoLogradouro: this.enderecoParaEdicao.tipoLogradouro,
        cep: (this.enderecoParaEdicao.cep ?? '').trim(),
      };

      this.enderecoForm.patchValue(dadosParaFormulario, { emitEvent: false });

      // sincroniza ids internos usados no save/update e nas buscas
      this.cepId = this.enderecoParaEdicao.cepId || 0;
      this.logradouroId = this.enderecoParaEdicao.logradouroId || 0;
      this.bairroId = this.enderecoParaEdicao.bairroId || 0;

      const bairroControl = this.enderecoForm.get('bairros') as FormGroup;

      if (bairroControl) {
        if (this.enderecoParaEdicao.bairroId && this.enderecoParaEdicao.bairroNome) {
          this.bairros = [{
            id: this.enderecoParaEdicao.bairroId,
            nome: this.enderecoParaEdicao.bairroNome,
          }];

          bairroControl.patchValue({
            id: this.enderecoParaEdicao.bairroId
          }, { emitEvent: false });

          // importante para exibir corretamente no editar
          this.bairroCtrl.setValue(this.enderecoParaEdicao.bairroNome, { emitEvent: false });

          // se já existe bairro salvo, na edição deve mostrar o select
          this.usarBairroSelect = false;
        } else {
          this.bairros = [];
          bairroControl.patchValue({ id: null }, { emitEvent: false });
          this.bairroCtrl.setValue('', { emitEvent: false });
          this.usarBairroSelect = false;
        }
      }
    }

    this.setupCepListener();
    this.setupCidadeNomeListener();
    this.setupLogradouroNomeListener();
    this.setupBairroNomeListener();
    this.setupNumeroListener();

    this.aplicarProtecaoCamposEdicao();
  }

  private setupCepListener(): void {
    this.enderecoForm.get('cep')?.valueChanges.pipe(
      takeUntil(this.destroy$),
      debounceTime(400),
      distinctUntilChanged(),
      map((value: string) => (value ?? '').replace(/\D/g, '')),
      filter((cep: string) => {
        if (cep.length > 0) {
          this.limparCepsEncontrados();
        }
        return cep.length === 8;
      })
    ).subscribe(() => {
      this.buscarCep();
    });
  }

  initForm(): void {

    this.enderecoForm = this.fb.group({
      id: [null], // Usado para edição
      nomePessoa: [this.nomePessoa],
      //cep: ['', [Validators.required, Validators.pattern(/^\d{5}\d{3}$/)]],

      cep: ['', [
        //Validators.required,
        Validators.pattern(/^(\d{8}|\d{2}\.\d{3}-\d{3})$/)
      ]],

      logradouroNome: ['', Validators.required],
      tipoLogradouro: ['', Validators.required],
      numero: ['', Validators.required],
      complemento: [''],

      bairros:
        this.fb.group({
          id: [null]
        }),

      cidadeId: [4047],
      cidadeNome: [],
      estadoUf: [],
      tipoEndereco: ['CASA', Validators.required], // Valor padrão
      principal: ['S'],

      cepId: [null],
      logradouroId: [null]
    });

  }

  buscarCep(): void {
    const cepControl = this.enderecoForm.get('cep');
    const cepValue = cepControl?.value;

    if (cepValue && cepControl?.valid) {
      this.isLoadingCep = true;

      this.enderecoForm.patchValue({
        logradouroNome: '',
        tipoLogradouro: '',
        cidadeId: null,
        cidadeNome: '',
        estadoUf: '',
        cepId: null,
        logradouroId: null
      }, { emitEvent: false });

      (this.enderecoForm.get('bairros') as FormGroup).patchValue({
        id: null
      }, { emitEvent: false });

      this.bairros = [];
      this.cepId = 0;
      this.logradouroId = 0;
      this.cidadeId = 0;
      this.bairroId = 0;

      const cepNumeros = String(cepValue).replace(/\D/g, '');

      this.cepService.filtrarPorCep(cepNumeros).subscribe({
        next: (lista: CepOut[]) => {
          this.isLoadingCep = false;

          if (!lista || lista.length === 0) {
            this.limparCamposCep();

            return;
          }

          const primeiro = lista[0];
          const bairrosUnicos = this.extrairBairrosUnicos(lista);

          this.cepId = primeiro.id || 0;
          this.logradouroId = primeiro.logradouroId || 0;
          this.cidadeId = primeiro.cidadeId || 0;

          this.enderecoForm.patchValue({
            cepId: primeiro.id || null,
            logradouroId: primeiro.logradouroId || null,
            logradouroNome: primeiro.logradouroNome || '',
            tipoLogradouro: primeiro.tipoLogradouro || '',
            cidadeId: primeiro.cidadeId || null,
            cidadeNome: primeiro.cidadeNome || '',
            estadoUf: primeiro.estadoUf || ''
          }, { emitEvent: false });

          this.bairros = bairrosUnicos;
          this.usarBairroSelect = true;

          if (this.bairros.length > 0) {
            const primeiroBairro = this.bairros[0];

            (this.enderecoForm.get('bairros') as FormGroup).patchValue({
              id: primeiroBairro.id
            }, { emitEvent: false });

            this.bairroCtrl.setValue(primeiroBairro.nome ?? '', { emitEvent: false });
            this.bairroId = primeiroBairro.id || 0;
          } else {
            this.bairroCtrl.setValue('', { emitEvent: false });
          }

          this.isSelectingCidade = true;
          this.isSelectingLogradouro = true;
        },
        error: (erroHttp) => {
          this.isLoadingCep = false;
          console.error('Erro ao buscar CEP:', erroHttp);

          this.limparCamposCep();

        }
      });
    } else {
      if (cepValue && !cepControl?.valid) {
        this.toastrService.show(
          'Formato do CEP inválido. Use 8 dígitos.',
          'CEP inválido',
          { status: 'warning', duration: 4000 }
        );
      }
    }
  }

  //////////////////////////////////////////////////////////////////////////////////////

  private limparCamposCep(): void {
    this.enderecoForm.patchValue({
      logradouroNome: '',
      tipoLogradouro: '',
      cidadeId: null,
      cidadeNome: '',
      estadoUf: '',
      cepId: null,
      logradouroId: null
    }, { emitEvent: false });

    (this.enderecoForm.get('bairros') as FormGroup).patchValue({
      id: null
    }, { emitEvent: false });

    this.bairros = [];
    this.cepId = 0;
    this.logradouroId = 0;
    this.cidadeId = 0;
    this.bairroId = 0;

    this.usarBairroSelect = false;
    this.bairroCtrl.setValue('', { emitEvent: false });
    this.sugestoesBairros = [];
  }

  //////////////////////////////////////////////////////////////////////////////////////

  cancelar(): void {
    this.dialogRef.close(); // Fecha o modal sem retornar dados
  }

  salvar(): void {
    if (this.enderecoForm.invalid) {
      this.enderecoForm.markAllAsTouched();
      // Você pode querer mostrar uma notificação de erro aqui também
      // Ex: this.toastService.show('Formulário inválido. Verifique os campos.', 'Erro', { status: 'danger' });
      return;
    }

    this.isLoadingSalvar = true;
    const formValue = this.enderecoForm.getRawValue();

    // Mapear o valor do formulário para o tipo EnderecoIn
    const enderecoPayload: EnderecoIn = {
      id: null,
      cepId: this.cepId > 0 ? this.cepId : (formValue.cepId || null),
      //cepId: formValue.cepId ,
      logradouroId: this.logradouroId > 0 ? this.logradouroId : formValue.logradouroId,
      //logradouroId: formValue.logradouroId ,
      bairroId: formValue.bairros?.id || null,
      numero: formValue.numero,
      complemento: formValue.complemento || null, // Enviar null se o campo estiver vazio
      pessoaId: this.pessoaId,
      tipoEndereco: formValue.tipoEndereco === 'CASA' ? 1 : (formValue.tipoEndereco === 'TRABALHO' ? 2 : 1),
      principal: formValue.principal ? 'S' : 'N'
    };

    if (this.modoEdicao) {
      // Garantir que o ID está no payload para update
      if (enderecoPayload.id == null && this.enderecoParaEdicao?.id != null) {
        enderecoPayload.id = this.enderecoParaEdicao.id; // Garante que o ID original da edição seja usado
      }

      console.log('VALORES UPD ', enderecoPayload)

      this.enderecoService.update(enderecoPayload).subscribe({
        next: (enderecoAtualizado: EnderecoOut) => {
          this.isLoadingSalvar = false;
          console.log('Endereço atualizado com sucesso (componente):', enderecoAtualizado);
          this.dialogRef.close(enderecoAtualizado); // Retorna o EnderecoOut (resposta da API)
        },
        error: (err) => {
          this.isLoadingSalvar = false;
          console.error('Erro ao atualizar endereço:', err);
          // Ex: this.toastService.show('Falha ao atualizar endereço.', 'Erro', { status: 'danger' });
        }
      });

    } else { // Modo Criação
      console.log('VALORES INSERT ', enderecoPayload)
      this.enderecoService.create(enderecoPayload).subscribe({
        next: (novoEndereco: EnderecoOut) => {
          this.isLoadingSalvar = false;
          console.log('Endereço criado com sucesso (componente):', novoEndereco);
          this.dialogRef.close(novoEndereco); // Retorna o EnderecoOut (resposta da API)
          // Ex: this.toastService.show('Endereço cadastrado!', 'Sucesso', { status: 'success' });
        },
        error: (err) => {
          this.isLoadingSalvar = false;
          console.error('Erro ao criar endereço:', err);
          // Ex: this.toastService.show('Falha ao cadastrar endereço.', 'Erro', { status: 'danger' });
        }
      });
    }
  }

  onLogradouroSelecionado(logradouro: LogradouroPesquisaOut | string): void {

    if (typeof logradouro === 'string' || !logradouro) {
      // Se o usuário apagar o campo ou não selecionar nada, ou se for string (evento de limpar)
      this.logradourosPesquisa = []; // Limpa sugestões
      // Poderia resetar campos aqui se desejado quando o campo logradouroNome é limpo
      return;
    }

    this.isSelectingLogradouro = true;

    this.logradouroId = logradouro.id;
    this.cepId = logradouro.cepId;
    const primeiroBairro = logradouro.bairros && logradouro.bairros.length > 0 ? logradouro.bairros[0] : null;
    this.bairroId = primeiroBairro ? primeiroBairro.id : 0;


    // Importante: use patchValue com { emitEvent: false } para não disparar valueChanges novamente
    this.enderecoForm.patchValue({
      id: logradouro.id,
      logradouroNome: logradouro.logradouroNome,
      //tipoLogradouro: logradouro.tipoLogradouro,
      bairros: logradouro.bairros,
      cidadeNome: logradouro.cidadeNome,
      estadoUf: logradouro.uf,

    }, { emitEvent: false });

    const bairroControl = this.enderecoForm.get('bairros') as FormGroup;
    if (logradouro.bairros && logradouro.bairros.length > 0) {
      this.bairros = logradouro.bairros;
      const primeiroBairro = logradouro.bairros[0];

      const bairroControl = this.enderecoForm.get('bairros') as FormGroup;
      bairroControl.patchValue({
        id: primeiroBairro.id
      });
      this.bairroId = primeiroBairro.id || 0;
    } else {
      this.bairros = [];
      this.bairroId = 0;
    }

    this.logradourosPesquisa = [];
  }

  onCidadeBlur() {
    setTimeout(() => (this.showCidadeDropdown = false), 150);
  }

  /*  CIDADE POR NOME */
  selecionarCidade(c: Distrito | string): void {
    if (typeof c === 'string' || !c) {
      this.sugestoesCidades = [];
      this.showCidadeDropdown = false;
      return;
    }

    const cidadeId = c?.cidadeId ?? null;
    const distritoId = c?.id ?? null;

    this.isSelectingCidade = true;

    this.enderecoForm.patchValue({
      cidadeId: cidadeId,
      cidadeNome: c?.cidadeNome ?? '',
      estadoUf: c?.estadoUf ?? ''
    }, { emitEvent: false });

    this.cidadeId = cidadeId || 0;
    this.distritoId = distritoId || 0;

    // limpa dependentes
    this.enderecoForm.patchValue({
      logradouroId: null,
      logradouroNome: '',
      cepId: null
    }, { emitEvent: false });

    (this.enderecoForm.get('bairros') as FormGroup).patchValue({
      id: null
    }, { emitEvent: false });

    this.logradouroId = 0;
    this.cepId = 0;
    this.bairroId = 0;
    this.bairros = [];
    this.sugestoesLogradouros = [];
    this.sugestoesBairros = [];
    this.bairroCtrl.setValue('', { emitEvent: false });
    this.usarBairroSelect = false;

    this.showCidadeDropdown = false;
    this.sugestoesCidades = [];
    this.limparCepsEncontrados();
  }


  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private extrairBairrosUnicos(lista: CepOut[]): BairroOut[] {
    const mapa = new Map<number, BairroOut>();

    (lista || []).forEach((item) => {
      (item.bairros || []).forEach((bairro: any) => {
        if (bairro?.id && !mapa.has(bairro.id)) {
          mapa.set(bairro.id, {
            id: bairro.id,
            nome: bairro.nome,
          } as BairroOut);
        }
      });
    });

    return Array.from(mapa.values());
  }

  private setupCidadeNomeListener(): void {
    this.enderecoForm.get('cidadeNome')?.valueChanges.pipe(
      takeUntil(this.destroy$),
      debounceTime(400),
      distinctUntilChanged(),
      filter((term: any) => {
        if (this.isSelectingCidade) {
          this.isSelectingCidade = false;
          return false;
        }

        if (typeof term !== 'string') {
          return false;
        }

        if (term.trim().length < 3) {
          this.sugestoesCidades = [];
          this.showCidadeDropdown = false;
          return false;
        }

        return true;
      }),
      tap(() => {
        this.isLoadingCidades = true;
        this.sugestoesCidades = [];
        this.showCidadeDropdown = true;
      }),
      switchMap((texto: string) =>
        this.distritoService.filtrarPorCidadeNome(texto, 0, 20)
      )
    ).subscribe({
      next: (lista: Distrito[]) => {
        this.isLoadingCidades = false;
        this.sugestoesCidades = lista ?? [];
        this.showCidadeDropdown = true;
      },
      error: (err) => {
        this.isLoadingCidades = false;
        this.sugestoesCidades = [];
        this.showCidadeDropdown = false;
        console.error('Erro ao buscar cidades:', err);
      }
    });
  }

  private setupLogradouroNomeListener(): void {
    this.enderecoForm.get('logradouroNome')?.valueChanges.pipe(
      takeUntil(this.destroy$),
      debounceTime(400),
      distinctUntilChanged(),
      filter((term: any) => {
        if (this.isSelectingLogradouro) {
          this.isSelectingLogradouro = false;
          return false;
        }

        if (typeof term !== 'string') {
          return false;
        }

        if (!this.cidadeId || this.cidadeId <= 0) {
          if (term.trim().length > 0) {
            this.toastrService.warning(
              'Selecione uma cidade antes de buscar o logradouro.',
              'Atenção',
              { duration: 3000 }
            );
          }
          this.sugestoesLogradouros = [];
          return false;
        }

        if (term.trim().length < 3) {
          this.sugestoesLogradouros = [];
          return false;
        }

        return true;
      }),
    ).subscribe((texto: string) => {
      this.logradouroService.filtrarPorCidadeIdENome(this.cidadeId, texto, 0, 20).subscribe({
        next: (lista: LogradouroSimple[]) => {
          this.sugestoesLogradouros = lista ?? [];
          this.showLogradouroDropdown = true;
        },
        error: (err) => console.error('Erro ao buscar logradouros:', err),
      });
    });
  }

  selecionarLogradouro(logradouro: LogradouroSimple | string): void {
    if (typeof logradouro === 'string' || !logradouro) {
      this.sugestoesLogradouros = [];
      this.showLogradouroDropdown = false;
      return;
    }

    this.isSelectingLogradouro = true;
    this.logradouroId = logradouro.id || 0;

    this.enderecoForm.patchValue({
      logradouroId: logradouro.id ?? null,
      logradouroNome: logradouro.nome ?? '',
      tipoLogradouro: logradouro.tipoLogradouro
    }, { emitEvent: false });

    (this.enderecoForm.get('bairros') as FormGroup).patchValue({
      id: null
    }, { emitEvent: false });

    this.bairros = [];
    this.bairroId = 0;
    this.bairroCtrl.setValue('', { emitEvent: false });
    this.sugestoesBairros = [];
    this.usarBairroSelect = false;

    this.sugestoesLogradouros = [];
    this.showLogradouroDropdown = false;
    this.limparCepsEncontrados();
  }

  private setupBairroNomeListener(): void {
    this.bairroCtrl.valueChanges.pipe(
      takeUntil(this.destroy$),
      debounceTime(400),
      distinctUntilChanged(),
      filter((term: any) => {
        if (typeof term !== 'string') {
          return false;
        }

        if (this.usarBairroSelect) {
          return false;
        }

        if (!this.cidadeId || this.cidadeId <= 0) {
          if (term.trim().length > 0) {
            this.toastrService.warning(
              'Selecione uma cidade antes de buscar o bairro.',
              'Atenção',
              { duration: 3000 }
            );
          }
          this.sugestoesBairros = [];
          return false;
        }

        if (term.trim().length < 3) {
          this.sugestoesBairros = [];
          return false;
        }

        return true;
      }),
    ).subscribe((texto: string) => {
      this.bairroService.filtrarPorCidadeIdENome(this.cidadeId, texto, 0, 20).subscribe({
        next: (lista: BairroSimple[]) => {
          this.sugestoesBairros = lista ?? [];
          this.showBairroDropdown = true;
        },
        error: (err) => {
          this.sugestoesBairros = [];
          this.showBairroDropdown = false;
          console.error('Erro ao buscar bairros:', err);
        },
      });
    });
  }

  selecionarBairro(bairro: BairroSimple | string): void {
    if (typeof bairro === 'string' || !bairro) {
      this.sugestoesBairros = [];
      this.showBairroDropdown = false;
      return;
    }

    this.bairroId = bairro.id || 0;
    this.bairroCtrl.setValue(bairro.nome ?? '', { emitEvent: false });

    (this.enderecoForm.get('bairros') as FormGroup).patchValue({
      id: bairro.id ?? null
    }, { emitEvent: false });

    this.sugestoesBairros = [];
    this.showBairroDropdown = false;
    this.limparCepsEncontrados();

    const numero = Number(this.enderecoForm.get('numero')?.value);
    if (!isNaN(numero) && numero > 0) {
      this.tentarEncontrarCepPeloEndereco(numero);
    }
  }

  private setupNumeroListener(): void {
    this.enderecoForm.get('numero')?.valueChanges.pipe(
      takeUntil(this.destroy$),
      debounceTime(500),
      distinctUntilChanged(),
      filter((valor: any) => {
        const numero = Number(valor);
        return !isNaN(numero) && numero > 0;
      })
    ).subscribe((valor: any) => {
      const numero = Number(valor);
      this.tentarEncontrarCepPeloEndereco(numero);
    });
  }

  private tentarEncontrarCepPeloEndereco(numero: number): void {
    const cepDigitado = String(this.enderecoForm.get('cep')?.value ?? '').replace(/\D/g, '');
    const bairroId = (this.enderecoForm.get('bairros') as FormGroup)?.get('id')?.value;

    if (cepDigitado.length === 8) return;
    if (!this.logradouroId || !bairroId || !numero) return;

    this.isBuscandoCepPorEndereco = true;
    this.limparCepsEncontrados();

    this.cepService.buscarCepsPorLogradouroBairroNumero(
      this.logradouroId,
      bairroId,
      numero
    ).subscribe({
      next: (lista: string[]) => {
        this.isBuscandoCepPorEndereco = false;

        const ceps = (lista ?? [])
          .filter((c) => !!c)
          .map((c) => String(c).trim());

        if (ceps.length === 0) return;

        if (ceps.length === 1) {
          this.aplicarCepEncontrado(ceps[0]);
          return;
        }

        this.cepsEncontrados = ceps;
        this.mostrarSeletorCepEncontrado = true;
        this.cepEncontradoCtrl.setValue(null, { emitEvent: false });
      },
      error: (err) => {
        this.isBuscandoCepPorEndereco = false;
        this.limparCepsEncontrados();
        console.error('Erro ao buscar CEP por endereço:', err);
      }
    });
  }

  private aplicarCepEncontrado(cep: string): void {
    const cepLimpo = String(cep ?? '').replace(/\D/g, '');
    if (!cepLimpo) return;

    this.enderecoForm.patchValue({ cep: cepLimpo });
    this.limparCepsEncontrados();
  }

  selecionarCepEncontrado(cep: string): void {
    if (!cep) return;
    this.aplicarCepEncontrado(cep);
  }

  private limparCepsEncontrados(): void {
    this.cepsEncontrados = [];
    this.mostrarSeletorCepEncontrado = false;
    this.cepEncontradoCtrl.setValue(null, { emitEvent: false });
  }

  private aplicarProtecaoCamposEdicao(): void {
    if (!this.modoEdicao) {
      return;
    }

    this.enderecoForm.get('cep')?.disable({ emitEvent: false });
    this.enderecoForm.get('cidadeId')?.disable({ emitEvent: false });
    this.enderecoForm.get('cidadeNome')?.disable({ emitEvent: false });
    this.enderecoForm.get('estadoUf')?.disable({ emitEvent: false });
    this.enderecoForm.get('logradouroId')?.disable({ emitEvent: false });
    this.enderecoForm.get('logradouroNome')?.disable({ emitEvent: false });
    this.enderecoForm.get('tipoLogradouro')?.disable({ emitEvent: false });
    this.enderecoForm.get(['bairros', 'id'])?.disable({ emitEvent: false });

    this.bairroCtrl.disable({ emitEvent: false });
  }

}