import { Component, ElementRef, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { debounceTime, distinctUntilChanged, filter, map } from 'rxjs/operators';
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
import { Distrito } from '../../../shared/models/distrito';
import { DistritoService } from '../../distrito/distrito.service';

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

  cidadeCtrl = new FormControl('');

  modoEdicao = false;
  pessoaId: number | null = null;
  pessoaNome: string | null = null;

  @Input() mode: 'add' | 'edit' = 'add';

  pessoaForm!: FormGroup;
  isLoading = false;
  isLoadingDados = false;
  private destroy$ = new Subject<void>();

  tiposPessoas: TipoPessoa[] = [];
  sugestoesCidades: Distrito[] = [];
  filtro: Filters = new Filters();

  showCidadeDropdown = false;
  cpfDuplicado = false;
  cnpjDuplicado = false;

  // ids selecionados
  cidadeId: number | null = null;
  distritoId: number | null = null;

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
    private distritoService: DistritoService,
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

    this.configurarValidacaoCpfCnpjDuplicado();
    this.configurarAutocompletes();

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

      localNascimentoId: [null],
      ufNascimento: [''],

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
          dataParaFormulario.localNascimentoId = pf.localNascimentoId ?? null;
          dataParaFormulario.ufNascimento = pf.ufNascimento ?? '';
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

        if (tipoPessoaApi === 'F' && pf?.localNascimentoNome) {
          this.cidadeCtrl.setValue(pf.localNascimentoNome, { emitEvent: false });
        }

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

  private configurarValidacaoCpfCnpjDuplicado(): void {
    this.pessoaForm.get('cpf')?.valueChanges.pipe(
      takeUntil(this.destroy$),
      debounceTime(500),
      map((value: any) => String(value ?? '').replace(/\D/g, '')),
      distinctUntilChanged(),
      filter((cpf: string) => cpf.length === 0 || cpf.length === 11)
    ).subscribe((cpf: string) => {
      this.cpfDuplicado = false;
      this.removerErroDocumentoDuplicado('cpf');

      if (!cpf || !this.isPessoaFisica()) {
        return;
      }

      this.pessoaService.verificarCpfCnpjDuplicado(cpf, null, this.pessoaId).pipe(
        takeUntil(this.destroy$)
      ).subscribe({
        next: (duplicado: boolean) => {
          this.cpfDuplicado = duplicado;

          if (duplicado) {
            this.marcarDocumentoDuplicado('cpf');
            this.showToast(
              'CPF já cadastrado para outra pessoa.',
              'Documento duplicado',
              'warning'
            );
            return;
          }

          this.removerErroDocumentoDuplicado('cpf');
        },
        error: (erro) => {
          console.error('Erro ao validar CPF duplicado:', erro);
          this.cpfDuplicado = false;
          this.removerErroDocumentoDuplicado('cpf');
          this.showToast(
            'Não foi possível validar se o CPF já está cadastrado.',
            'Validação',
            'warning'
          );
        },
      });
    });

    this.pessoaForm.get('cnpj')?.valueChanges.pipe(
      takeUntil(this.destroy$),
      debounceTime(500),
      map((value: any) => String(value ?? '').replace(/\D/g, '')),
      distinctUntilChanged(),
      filter((cnpj: string) => cnpj.length === 0 || cnpj.length === 14)
    ).subscribe((cnpj: string) => {
      this.cnpjDuplicado = false;
      this.removerErroDocumentoDuplicado('cnpj');

      if (!cnpj || !this.isPessoaJuridica()) {
        return;
      }

      this.pessoaService.verificarCpfCnpjDuplicado(null, cnpj, this.pessoaId).pipe(
        takeUntil(this.destroy$)
      ).subscribe({
        next: (duplicado: boolean) => {
          this.cnpjDuplicado = duplicado;

          if (duplicado) {
            this.marcarDocumentoDuplicado('cnpj');
            this.showToast(
              'CNPJ já cadastrado para outra pessoa.',
              'Documento duplicado',
              'warning'
            );
            return;
          }

          this.removerErroDocumentoDuplicado('cnpj');
        },
        error: (erro) => {
          console.error('Erro ao validar CNPJ duplicado:', erro);
          this.cnpjDuplicado = false;
          this.removerErroDocumentoDuplicado('cnpj');
          this.showToast(
            'Não foi possível validar se o CNPJ já está cadastrado.',
            'Validação',
            'warning'
          );
        },
      });
    });
  }

  private marcarDocumentoDuplicado(campo: 'cpf' | 'cnpj'): void {
    const control = this.pessoaForm.get(campo);
    if (!control) {
      return;
    }

    control.setErrors({ ...(control.errors ?? {}), documentoDuplicado: true });
    control.markAsTouched();
  }

  private removerErroDocumentoDuplicado(campo: 'cpf' | 'cnpj'): void {
    const control = this.pessoaForm.get(campo);
    if (!control?.errors?.['documentoDuplicado']) {
      return;
    }

    const errors = { ...control.errors };
    delete errors['documentoDuplicado'];
    control.setErrors(Object.keys(errors).length ? errors : null);
  }

  private getDocumentoAtual(): { cpf: string | null; cnpj: string | null; tipo: 'CPF' | 'CNPJ' | null } {
    const raw = this.pessoaForm.getRawValue();

    if (this.isPessoaFisica()) {
      return {
        cpf: raw.cpf ? String(raw.cpf).replace(/\D/g, '') : null,
        cnpj: null,
        tipo: 'CPF',
      };
    }

    if (this.isPessoaJuridica()) {
      return {
        cpf: null,
        cnpj: raw.cnpj ? String(raw.cnpj).replace(/\D/g, '') : null,
        tipo: 'CNPJ',
      };
    }

    return { cpf: null, cnpj: null, tipo: null };
  }

  onSubmit(): void {
    if (this.pessoaForm.invalid) {
      if (this.pessoaForm.get('cpf')?.errors?.['documentoDuplicado'] || this.pessoaForm.get('cnpj')?.errors?.['documentoDuplicado']) {
        this.showToast('CPF/CNPJ já cadastrado para outra pessoa.', 'Documento duplicado', 'warning');
      } else {
        this.showToast('Preencha os campos obrigatórios.', 'Validação', 'warning');
      }
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
        localNascimentoId: dadosFormulario.localNascimentoId ?? null,
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

    const cpf = payload.dadosPessoaFisica?.cpf ?? null;
    const cnpj = payload.dadosPessoaJuridica?.cnpj ?? null;

    this.pessoaService.verificarCpfCnpjDuplicado(cpf, cnpj, this.pessoaId).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (duplicado: boolean) => {
        if (duplicado) {
          this.isLoading = false;
          const documento = cpf ? 'CPF' : 'CNPJ';
          this.marcarDocumentoDuplicado(cpf ? 'cpf' : 'cnpj');
          this.showToast(`${documento} já cadastrado para outra pessoa.`, 'Documento duplicado', 'warning');
          return;
        }

        this.salvarPessoa(payload);
      },
      error: (erro) => {
        this.isLoading = false;
        console.error('Erro ao validar CPF/CNPJ duplicado:', erro);
        const mensagemErro = erro.error?.message || erro.message || 'Erro ao validar CPF/CNPJ duplicado.';
        this.toastrService.danger(mensagemErro, 'Falha na Validação');
      }
    });
  }

  private salvarPessoa(payload: any): void {
    if (this.modoEdicao && this.pessoaId) {
      this.pessoaService.updatePessoa(this.pessoaId, payload).pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoading = false)
      ).subscribe({
        next: (pessoaAtualizada: PessoaOut) => {
          this.pessoaContext.setPessoaNome(pessoaAtualizada.nome);
          this.showToast('Pessoa atualizada com sucesso!', 'Sucesso', 'success');
          this.carregarDadosPessoaParaEdicao(this.pessoaId!);
        },
        error: (erro) => {
          console.error('Erro ao atualizar pessoa:', erro);
          const mensagemErro = erro.error?.message || erro.message || 'Erro desconhecido ao atualizar pessoa.';
          this.toastrService.danger(mensagemErro, 'Falha na Atualização');
        }
      });
      return;
    }

    this.pessoaService.createPessoa(payload).pipe(
      takeUntil(this.destroy$),
      finalize(() => this.isLoading = false)
    ).subscribe({
      next: (pessoaCadastrada: PessoaOut) => {
        this.pessoaId = pessoaCadastrada.id ?? null;
        this.modoEdicao = true;

        this.showToast('Pessoa inserida com sucesso! Continue o cadastro dos dados adicionais.', 'Sucesso', 'success');

        if (pessoaCadastrada.id) {
          this.pessoaContext.setPessoaId(pessoaCadastrada.id);
        }
        this.pessoaContext.setPessoaNome(pessoaCadastrada.nome);

        if (this.pessoaId) {
          // Permanece no módulo de pessoa e já abre Endereços para continuar o cadastro.
          // Uso relativo evita cair no dashboard caso o prefixo real da rota seja diferente de /pages/pessoas.
          this.router.navigate(['../../editar', this.pessoaId, 'enderecos'], { relativeTo: this.route });
        }
      },
      error: (erro) => {
        console.error('Erro ao cadastrar pessoa:', erro);
        const mensagemErro = erro.error?.message || erro.message || 'Erro desconhecido ao cadastrar pessoa.';
        this.toastrService.danger(mensagemErro, 'Falha no Cadastro');
      }
    });
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

  private configurarAutocompletes(): void {
    this.cidadeCtrl.valueChanges
      .pipe(
        debounceTime(250),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe((value: any) => {
        const texto = (value ?? '').trim();

        if (texto.length < 2) {
          this.sugestoesCidades = [];
          this.showCidadeDropdown = false;
          return;
        }

        this.distritoService.filtrarPorCidadeNome(texto, 0, 20).subscribe({
          next: (lista: Distrito[]) => {
            this.sugestoesCidades = lista ?? [];
            this.showCidadeDropdown = this.sugestoesCidades.length > 0;
          },
          error: (err: any) => {
            console.error('Erro ao buscar cidades:', err);
            this.sugestoesCidades = [];
            this.showCidadeDropdown = false;
          },
        });
      });
  }

  selecionarCidade(c: any): void {
    const localNascimentoId = c?.cidadeId ?? null;

    this.cidadeCtrl.setValue(c?.cidadeNome ?? '', { emitEvent: false });

    this.pessoaForm.patchValue({
      localNascimentoId,
      ufNascimento: c?.estadoUf ?? ''
    });

    this.cidadeId = localNascimentoId;
    this.distritoId = c?.id ?? null;

    this.showCidadeDropdown = false;
    this.sugestoesCidades = [];
  }

  onCidadeBlur() {
    setTimeout(() => (this.showCidadeDropdown = false), 150);
  }

}
