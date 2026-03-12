import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { NbGlobalPhysicalPosition, NbToastrService } from '@nebular/theme';
import { HttpParams } from '@angular/common/http';

import { PessoaService } from '../pessoa.service';
import { PessoaContextService } from '../../../services/pessoa-context.service';
import { PessoaIn } from '../../../shared/models/pessoaIn';
import { PessoaOut } from '../../../shared/models/pessoaOut';
import { TipoPessoa } from '../../../shared/models/tipoPessoa';
import { Filters } from '../../../shared/filters/filters';
import { TipoPessoaService } from '../../tipo-pessoa/tipo-pessoa.service';
import { FiltroPaginado } from '../../../shared/filters/filtro-paginado';

// Ajuste estes valores se seu backend usa outro enum/IDs.
interface SituacaoOpcao { valor: number; descricao: string; }

@Component({
  selector: 'ngx-pessoa-perfil-form',
  templateUrl: './pessoa-perfil-form.component.html',
  styleUrls: ['./pessoa-perfil-form.component.scss'],
})

export class PessoaPerfilFormComponent implements OnInit, OnDestroy {
  @ViewChild('cpfInput') cpfInputRef!: ElementRef<HTMLInputElement>;
  @ViewChild('cnpjInput') cnpjInputRef!: ElementRef<HTMLInputElement>;
  @ViewChild('dataNascimentoInput') dataNascimentoInputRef!: ElementRef<HTMLInputElement>;

  modoEdicao = false;
  pessoaId: number | null = null;
  pessoaNome: string | null = null;

  pessoaForm!: FormGroup;
  isLoading = false;
  isLoadingDados = false;
  private destroy$ = new Subject<void>();

  tiposPessoas: TipoPessoa[] = [];
  filtro: Filters = new Filters();

  situacoes: SituacaoOpcao[] = [
    { valor: 1, descricao: 'ATIVO' },
    { valor: 2, descricao: 'INATIVO' },
    { valor: 3, descricao: 'BLOQUEADO' },
    { valor: 4, descricao: 'OUTRO' },
  ];

  cardHeaderTitle = 'Dados do Perfil';

  constructor(
    private fb: FormBuilder,
    private pessoaService: PessoaService,
    private tipoPessoaService: TipoPessoaService,
    private route: ActivatedRoute,
    private router: Router,
    private toastrService: NbToastrService,
    private pessoaContext: PessoaContextService,
  ) { }

  ngOnInit(): void {
    this.carregarTiposPessoas();
    this.initForm(); // Inicializar o formulário primeiro
    this.pessoaNome = this.pessoaContext.getCurrentPessoaNome();

    // Obter o pessoaId da rota PAI (PessoaApiIudComponent)
    this.route.parent?.params.pipe(takeUntil(this.destroy$)).subscribe(parentParams => {
      
      if (parentParams['id']) {
      this.modoEdicao = true;
      this.pessoaId = +parentParams['id'];
      this.cardHeaderTitle = `${this.pessoaNome}`;
      this.pessoaForm.get('fisicaJuridica')?.disable();
      this.carregarDadosPessoaParaEdicao(this.pessoaId);

    } else {
      // MODO CRIAÇÃO
      this.modoEdicao = false;
      this.pessoaId = null;
      this.cardHeaderTitle = 'Cadastrar Novo Perfil';
      this.pessoaForm.get('fisicaJuridica')?.enable();

      this.configurarValidadoresDinamicos(); 
    }
    });

    // Listener de mudanças no tipo de pessoa
    this.pessoaForm.get('fisicaJuridica')?.valueChanges.pipe(
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.configurarValidadoresDinamicos(); 
    });

    this.pessoaForm.get('cpf')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(value => {
      const control = this.pessoaForm.get('cpf');
      if (control && value && /[^\d]/.test(value)) { 
        const onlyDigits = value.replace(/\D/g, '');
        control.setValue(onlyDigits, { emitEvent: false, onlySelf: true });
      }
    });
  
  }

  initForm(): void {
    this.pessoaForm = this.fb.group({
      // --- CAMPOS COMUNS E OBRIGATÓRIOS ---
      id: [null],
      nome: ['', Validators.required], // Já começa como obrigatório
      
      // VALOR PADRÃO para "Criação": 'F' (Física)
      fisicaJuridica: ['F', Validators.required], 
      
      // VALOR PADRÃO para "Criação": 0 (ATIVO), convertido para string para o nb-select
      // Estamos assumindo que '0' é o valor para 'ATIVO' no seu HTML
      situacao: ['1', Validators.required],
      
      // VALOR PADRÃO para "Criação": 1 (Pessoa Física), se for o ID correto no seu DB
      // Se o ID for 0, ajuste aqui. Começa como obrigatório.
      tipoPessoaId: [1, Validators.required], // <<<<<< AJUSTE O VALOR '1' SE NECESSÁRIO

      observacao: [''],

      // --- CAMPOS ESPECÍFICOS (INICIAM SEM VALIDADOR) ---
      // Os validadores para estes campos serão adicionados dinamicamente
      cpf: [''], 
      sexo: [null],
      estadoCivil: [null],
      dataNascimento: [null], 
      nomeMae: [''],
      nomePai: [''],

      cnpj: [''],
      nomeFantasia: [''],
      objetoSocial: [''],
      microEmpresa: ['N'],
      tipoEmpresa: [null]
    });
  }

  carregarTiposPessoas(): void {
    const filtro = new FiltroPaginado();
    filtro.params = new HttpParams();

    this.tipoPessoaService.pesquisar(filtro)
      .then((tiposPessoas: TipoPessoa[]) => {
        this.tiposPessoas = tiposPessoas;
      })
      .catch(error => {
        console.error('Erro ao carregar tipos pessoas:', error);
        this.tiposPessoas = [];
    });
  }

  isPessoaFisica(): boolean { return this.pessoaForm.get('fisicaJuridica')?.value === 'F'; }
  isPessoaJuridica(): boolean { return this.pessoaForm.get('fisicaJuridica')?.value === 'J'; }

  carregarDadosPessoaParaEdicao(id: number): void {
  this.isLoadingDados = true;

  this.pessoaService.getPessoaById(id)
    .then((pessoa: PessoaOut) => {
      console.log('Dados da API para edição:', pessoa);

      const tipoPessoaApi = pessoa.fisicaJuridica;
      const pf = pessoa.dadosPessoaFisica ?? null;
      const pj = pessoa.dadosPessoaJuridica ?? null;

      this.pessoaForm.get('fisicaJuridica')?.setValue(tipoPessoaApi);

      const dataParaFormulario: any = {
        id: pessoa.id,
        nome: pessoa.nome ?? '',
        fisicaJuridica: pessoa.fisicaJuridica ?? 'F',
        tipoPessoaId: pessoa.tipoPessoaId ?? null,
        observacao: pessoa.observacao,
        situacao: pessoa.situacaoId !== null && pessoa.situacaoId !== undefined
          ? String(pessoa.situacaoId)
          : '1',
      };

      if (tipoPessoaApi === 'F' && pf) {
        dataParaFormulario.cpf = pf.cpf ?? '';
        dataParaFormulario.sexo = pf.sexo ?? null;
        dataParaFormulario.estadoCivil = pf.estadoCivil ?? null;
        dataParaFormulario.nomeMae = pf.mae ?? '';
        dataParaFormulario.nomePai = pf.pai ?? '';
      }

      if (tipoPessoaApi === 'J' && pj) {
        dataParaFormulario.cnpj = pj.cnpj ?? '';
        dataParaFormulario.nomeFantasia = pj.nomeFantasia ?? '';
        dataParaFormulario.objetoSocial = pj.objetoSocial ?? '';
        dataParaFormulario.microEmpresa = pj.microEmpresa ?? 'N';
        dataParaFormulario.tipoEmpresa = pj.tipoEmpresa !== null && pj.tipoEmpresa !== undefined
          ? String(pj.tipoEmpresa)
          : null;
      }

      this.pessoaForm.patchValue(dataParaFormulario);

      if (tipoPessoaApi === 'F' && pf?.dataNascimento) {
        const dataApi = String(pf.dataNascimento).substring(0, 10); // yyyy-MM-dd
        const parts = dataApi.split('-');

        if (parts.length === 3) {
          const dataFormatadaParaTela = `${parts[2]}/${parts[1]}/${parts[0]}`;

          setTimeout(() => {
            if (this.dataNascimentoInputRef?.nativeElement) {
              this.dataNascimentoInputRef.nativeElement.value = dataFormatadaParaTela;
            }
          }, 0);
        }
      }

      if (tipoPessoaApi === 'F' && pf?.cpf) {
        setTimeout(() => {
          if (this.cpfInputRef?.nativeElement) {
            this.cpfInputRef.nativeElement.value = this.formatarCpfParaDisplay(pf.cpf);
          }
        }, 0);
      }

      if (tipoPessoaApi === 'J' && pj?.cnpj) {
        setTimeout(() => {
          if (this.cnpjInputRef?.nativeElement) {
            this.cnpjInputRef.nativeElement.value = this.formatarCnpjParaDisplay(pj.cnpj);
          }
        }, 0);
      }

    this.configurarValidadoresDinamicos();

    })
    .catch(error => {
      console.error(`Erro ao carregar dados da pessoa com ID ${id}:`, error);
      this.showToast('Erro ao carregar dados do perfil.', 'Erro', 'danger');
    })
    .finally(() => {
      this.isLoadingDados = false;
    });
  }

  //-----------------------------------------------------------------

  onSubmit(): void {
    if (this.pessoaForm.invalid) {
      this.showToast('Preencha os campos obrigatórios.', 'Validação', 'warning');
      return;
    }

    this.isLoading = true;

    const dadosFormulario = this.pessoaForm.getRawValue();

    let dataNascimentoParaApi: string | null = null;

    if (this.isPessoaFisica() && this.dataNascimentoInputRef?.nativeElement) {
      const dataStringDaTela = this.dataNascimentoInputRef.nativeElement.value;

      if (dataStringDaTela && /^\d{2}\/\d{2}\/\d{4}$/.test(dataStringDaTela)) {
        const parts = dataStringDaTela.split('/');
        dataNascimentoParaApi = `${parts[2]}-${parts[1]}-${parts[0]}`;
      }
    }

    const payload: any = {
      nome: dadosFormulario.nome?.trim() ?? null,
      fisicaJuridica: this.isPessoaFisica() ? 'F' : 'J',
      tipoPessoaId: dadosFormulario.tipoPessoaId ? +dadosFormulario.tipoPessoaId : null,
      situacaoId: dadosFormulario.situacao !== null && dadosFormulario.situacao !== undefined
        ? +dadosFormulario.situacao
        : null,
      observacao: dadosFormulario.observacao ?? null,
      dadosPessoaFisica: null,
      dadosPessoaJuridica: null,
    };

    if (this.isPessoaFisica()) {
      payload.dadosPessoaFisica = {
        cpf: dadosFormulario.cpf ? String(dadosFormulario.cpf).replace(/\D/g, '') : null,
        nomeSocial: null,
        raca: null,
        etnia: null,
        cor: null,
        recebeBf: null,
        cartaoSus: null,
        sexo: dadosFormulario.sexo ?? null,
        estadoCivil: dadosFormulario.estadoCivil ?? null,
        localNascimentoId: null,
        mae: dadosFormulario.nomeMae ?? null,
        pai: dadosFormulario.nomePai ?? null,
        observacao: dadosFormulario.observacao ?? null,
        dataNascimento: dataNascimentoParaApi,
      };
    }

    if (this.isPessoaJuridica()) {
      payload.dadosPessoaJuridica = {
        cnpj: dadosFormulario.cnpj ? String(dadosFormulario.cnpj).replace(/\D/g, '') : null,
        nomeFantasia: dadosFormulario.nomeFantasia ?? null,
        objetoSocial: dadosFormulario.objetoSocial ?? null,
        microEmpresa: dadosFormulario.microEmpresa ?? 'N',
        conjuge: null,
        tipoEmpresa: dadosFormulario.tipoEmpresa !== null && dadosFormulario.tipoEmpresa !== undefined
          ? +dadosFormulario.tipoEmpresa
          : null,
      };
    }

    //console.log('PAYLOAD FINAL PARA API:', payload);

    if (this.modoEdicao && this.pessoaId) {
      this.pessoaService.updatePessoa(this.pessoaId, payload).pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoading = false)
      ).subscribe({
        next: (pessoaAtualizada: PessoaOut) => {
          this.pessoaContext.setPessoaNome(pessoaAtualizada.nome);
          this.showToast('Pessoa atualizada com sucesso!', 'Sucesso', 'success');

          // recarrega da API para preencher novamente tudo certo
          this.carregarDadosPessoaParaEdicao(this.pessoaId!);
        },
        error: (erro) => {
          console.error('Erro ao atualizar pessoa:', erro);
          const mensagemErro = erro.error?.message || erro.message || 'Erro desconhecido ao atualizar pessoa.';
          this.toastrService.danger(mensagemErro, 'Falha na Atualização');
        }
      });
    } else {
      this.pessoaService.createPessoa(payload).pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoading = false)
      ).subscribe({
        next: (pessoaCadastrada: PessoaOut) => {
          this.pessoaId = pessoaCadastrada.id ?? null;
          this.modoEdicao = true;

          this.showToast('Pessoa inserida com sucesso!', 'Sucesso', 'success');

          if (pessoaCadastrada.id) {
            this.pessoaContext.setPessoaId(pessoaCadastrada.id);
          }
          this.pessoaContext.setPessoaNome(pessoaCadastrada.nome);

          if (this.pessoaId) {
            this.router.navigate(['/pages/pessoas/editar', this.pessoaId, 'perfil']);
          }
        },
        error: (erro) => {
          console.error('Erro ao cadastrar pessoa:', erro);
          const mensagemErro = erro.error?.message || erro.message || 'Erro desconhecido ao cadastrar pessoa.';
          this.toastrService.danger(mensagemErro, 'Falha no Cadastro');
        }
      });
    }
  }

  //----------------------------------------------------------------------

  formatarCpfParaDisplay(cpfNumeros: string): string {
    console.log('chegou na função cpf ', cpfNumeros);
    if (!cpfNumeros || cpfNumeros.length !== 11) {
      return cpfNumeros; // Retorna original se não for um CPF válido para formatação
    }
    return `${cpfNumeros.substring(0, 3)}.${cpfNumeros.substring(3, 6)}.${cpfNumeros.substring(6, 9)}-${cpfNumeros.substring(9, 11)}`;
  }

  formatarCnpjParaDisplay(cnpjNumeros: string): string {
    console.log('chegou na função cnpj ', cnpjNumeros);
    if (!cnpjNumeros || cnpjNumeros.length !== 14) { 
      return cnpjNumeros; // Retorna original se não for um CNPJ válido para formatação
    }
    const cnpjFormtado = `${cnpjNumeros.substring(0, 2)}.${cnpjNumeros.substring(2, 5)}.${cnpjNumeros.substring(5, 8)}/${cnpjNumeros.substring(8, 12)}-${cnpjNumeros.substring(12, 14)}`;
    console.log('Retuen  ', cnpjFormtado);
    return cnpjFormtado;
  }

  //----------------------------------------------------------------------------------

  onCancelar(): void {
    // Volta para a pesquisa geral de pessoas
    this.router.navigate(['/pages/pessoa/pessoa-pesquisa']);
  }

  getControl(name: string): AbstractControl | null { return this.pessoaForm.get(name); }

  private configurarValidadoresDinamicos(): void {
    // --- DEFINIÇÃO DOS CAMPOS ---
    const camposPF = ['cpf', 'sexo', 'estadoCivil'];
    const camposPJ = ['cnpj', 'tipoEmpresa'];

    if (this.isPessoaFisica()) {
      // --- LÓGICA PARA PESSOA FÍSICA ---

      // 1. Define valores padrão ao mudar para PF (se estiver em modo de criação)
      if (!this.modoEdicao) {
        this.pessoaForm.get('tipoPessoaId')?.setValue(1); // Supondo que 1 é "Pessoa Física"
      }
      
      // 2. Limpa e remove validadores de PJ
      camposPJ.forEach(campo => {
        this.pessoaForm.get(campo)?.clearValidators();
        this.pessoaForm.get(campo)?.setValue(null);
      });

      // 3. Aplica validadores para PF
      camposPF.forEach(campo => {
        this.pessoaForm.get(campo)?.setValidators(Validators.required);
      });

    } else if (this.isPessoaJuridica()) {
      // --- LÓGICA PARA PESSOA JURÍDICA ---
      
      // 1. Define valores padrão ao mudar para PJ (se estiver em modo de criação)
      if (!this.modoEdicao) {
        this.pessoaForm.get('tipoPessoaId')?.setValue(2); // <<<< AJUSTE: Supondo que 2 é "Empresa Privada"
        this.pessoaForm.get('microEmpresa')?.setValue('N');
      }

      // 2. Limpa e remove validadores de PF
      camposPF.forEach(campo => {
        this.pessoaForm.get(campo)?.clearValidators();
        this.pessoaForm.get(campo)?.setValue(null);
      });
      // Limpa também o valor do input de data manualmente
      if (this.dataNascimentoInputRef && this.dataNascimentoInputRef.nativeElement) { 
          this.dataNascimentoInputRef.nativeElement.value = '';
      }

      // 3. Aplica validadores para PJ
      camposPJ.forEach(campo => {
        this.pessoaForm.get(campo)?.setValidators(Validators.required);
      });
    }

    // Atualiza o estado de validação de todos os campos afetados
    this.pessoaForm.updateValueAndValidity({ emitEvent: false });
  }

  private showToast(message: string, title: string, status: 'success' | 'danger' | 'warning' | 'info'): void {
    this.toastrService.show(message, title, {
      status,
      position: NbGlobalPhysicalPosition.TOP_RIGHT,
      duration: 3000
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
