import { FormBuilder, FormControl, FormGroup, Validators, } from '@angular/forms';
import { ActivatedRoute, Router, } from '@angular/router';
import { NbToastrService, } from '@nebular/theme';
import { Subject, } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil, } from 'rxjs/operators';
import { HttpParams } from '@angular/common/http';
import { Component, ElementRef, OnDestroy, OnInit, ViewChild, } from '@angular/core';

import { EstabelecimentoService, } from '../estabelecimento.service';
import { EstabelecimentoContextService, } from '../../../services/estabelecimento-context.service';
import { EstabelecimentoIn, } from '../../../shared/models/estabelecimentoIn';
import { EstabelecimentoOut, } from '../../../shared/models/estabelecimentoOut';
import { PessoaService, } from '../../pessoa/pessoa.service';

interface PessoaProprietaria {
  id: number;
  nome: string;
  cpf: string;
}

@Component({
  selector: 'ngx-estabelecimento-perfil-form',
  templateUrl: './estabelecimento-perfil-form.component.html',
  styleUrls: ['./estabelecimento-perfil-form.component.scss'],
})

export class EstabelecimentoPerfilFormComponent
  implements OnInit, OnDestroy {

  @ViewChild('cnpjInput')
  cnpjInputRef!: ElementRef<HTMLInputElement>;

  @ViewChild('proprietarioCpfInput')
  proprietarioCpfInputRef!: ElementRef<HTMLInputElement>;

  estabelecimentoForm!: FormGroup;
  proprietarioCpfCtrl = new FormControl('');

  proprietarioCtrl = new FormControl('');

  estabelecimentoId: number | null = null;
  pessoaId: number | null = null;
  pessoaNome: string | null = null;
  pessoaCpf: string | null = null;

  modoEdicao = false;
  isLoading = false;
  isLoadingDados = false;
  pesquisandoProprietarios = false;

  sugestoesProprietarios: PessoaProprietaria[] = [];
  mostrarSugestoesProprietarios = false;

  cardHeaderTitle = 'Cadastrar Estabelecimento';

  private destroy$ = new Subject<void>();

  /*
   * Evita que uma pesquisa mais antiga sobrescreva o resultado
   * de uma pesquisa mais recente do proprietário.
   */
  private numeroPesquisaProprietario = 0;

  constructor(
    private formBuilder: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private estabelecimentoService: EstabelecimentoService,
    private estabelecimentoContext:
      EstabelecimentoContextService,
    private pessoaService: PessoaService,
    private toastrService: NbToastrService,
  ) {
  }

  ngOnInit(): void {

    this.inicializarFormulario();
    this.configurarPesquisaProprietario();

    this.route.parent?.params
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {

        const id = params['id']
          ? Number(params['id'])
          : null;

        if (id === null) {

          this.prepararInclusao();
          return;
        }

        this.prepararEdicao(id);
      });
  }

  ngOnDestroy(): void {

    this.destroy$.next();
    this.destroy$.complete();
  }

  private inicializarFormulario(): void {

    this.estabelecimentoForm =
      this.formBuilder.group({

        id: [null],

        cnpj: [
          '',
          [
            Validators.required,
            Validators.pattern(/^\d{14}$/),
          ],
        ],

        nome: [
          '',
          Validators.required,
        ],

        estabelecimento: [null],
        nomeFantasia: [''],
        objetoSocial: [''],

        microEmpresa: [
          'N',
          Validators.required,
        ],

        conjuge: [''],
        tipoEmpresa: [null],
      });
  }

  private prepararInclusao(): void {

    this.modoEdicao = false;
    this.estabelecimentoId = null;
    this.pessoaId = null;
    this.pessoaCpf = null;

    this.cardHeaderTitle = 'Novo CNPJ';

    this.proprietarioCtrl.enable({
      emitEvent: false,
    });

    this.proprietarioCpfCtrl.enable({
      emitEvent: false,
    });

    this.proprietarioCtrl.setValue(
      '',
      {
        emitEvent: false,
      },
    );

    this.proprietarioCpfCtrl.setValue(
      '',
      {
        emitEvent: false,
      },
    );
  }

  private prepararEdicao(
    id: number,
  ): void {

    this.modoEdicao = true;
    this.estabelecimentoId = id;

    this.cardHeaderTitle = 'Editar CNPJ';

    /*
     * O proprietário é apenas consultado na edição.
     * A transferência para outra pessoa não pertence a este CRUD.
     */
    this.proprietarioCtrl.disable({
      emitEvent: false,
    });

    this.proprietarioCpfCtrl.disable({
      emitEvent: false,
    });

    this.carregarEstabelecimento(id);
  }

  private carregarEstabelecimento(id: number,): void {

    this.isLoadingDados = true;

    this.estabelecimentoService
      .getEstabelecimentoById(id)
      .then(
        (
          estabelecimento: EstabelecimentoOut,
        ) => {

           this.cardHeaderTitle =
            estabelecimento.nome ||
            'Editar CNPJ';

          this.pessoaId =
            estabelecimento.pessoaId ?? null;

          this.pessoaNome =
            estabelecimento.pessoaNome ?? null;

          this.pessoaCpf =
            estabelecimento.pessoaCpf ?? null;

          this.estabelecimentoForm.patchValue({

            id: estabelecimento.id ?? null,

            cnpj: this.somenteNumeros(
              estabelecimento.cnpj,
            ),

            nome:
              estabelecimento.nome ?? '',

            estabelecimento:
              estabelecimento.estabelecimento ?? null,

            nomeFantasia:
              estabelecimento.nomeFantasia ?? '',

            objetoSocial:
              estabelecimento.objetoSocial ?? '',

            microEmpresa:
              estabelecimento.microEmpresa ?? 'N',

            conjuge:
              estabelecimento.conjuge ?? '',

            tipoEmpresa:
              estabelecimento.tipoEmpresa ?? null,
          });

          setTimeout(() => {

            if (this.cnpjInputRef?.nativeElement) {

              this.cnpjInputRef.nativeElement.value =
                this.formatarCnpj(
                  estabelecimento.cnpj,
                );
            }
          }, 0);

          this.estabelecimentoContext.definirContexto(
            estabelecimento.id ?? id,
            estabelecimento.nome ?? null,
            estabelecimento.pessoaId ?? null,
          );
        },
      )
      .catch(error => {

        console.error(
          `Erro ao carregar estabelecimento ${id}:`,
          error,
        );

        this.exibirToast(
          'Não foi possível carregar os dados do estabelecimento.',
          'Erro',
          'danger',
        );
      })
      .finally(() => {

        this.isLoadingDados = false;
      });
  }

  private configurarPesquisaProprietario(): void {

    /*
     * Pesquisa independente pelo nome do proprietário.
     */
    this.proprietarioCtrl.valueChanges
      .pipe(
        debounceTime(400),
        distinctUntilChanged(),
        takeUntil(this.destroy$),
      )
      .subscribe(valor => {

        if (this.modoEdicao) {
          return;
        }

        const nome = String(
          valor ?? '',
        ).trim();

        this.limparProprietarioSelecionado();

        if (nome.length < 3) {

          this.limparSugestoesProprietarios();
          return;
        }

        this.pesquisarProprietarios(
          nome,
          '',
        );
      });

    /*
     * Pesquisa independente pelo CPF do proprietário.
     */
    this.proprietarioCpfCtrl.valueChanges
      .pipe(
        debounceTime(400),
        distinctUntilChanged(),
        takeUntil(this.destroy$),
      )
      .subscribe(valor => {

        if (this.modoEdicao) {
          return;
        }

        const cpf =
          this.somenteNumeros(valor);

        this.limparProprietarioSelecionado();

        if (cpf.length < 4) {

          this.limparSugestoesProprietarios();
          return;
        }

        this.pesquisarProprietarios(
          '',
          cpf,
        );
      });
  }

  private pesquisarProprietarios(
    termo: string,
    digitos: string,
  ): void {

    const numeroPesquisa =
      ++this.numeroPesquisaProprietario;

    let params = new HttpParams()
      .set('page', '0')
      .set('size', '20')
      .set('sort', 'nome,asc');

    if (digitos.length > 0) {

      params = params.set(
        'cpf',
        digitos,
      );

    } else {

      params = params.set(
        'nome',
        termo,
      );
    }

    this.pesquisandoProprietarios = true;

    this.pessoaService
      .pesquisar({
        params,
      } as any)
      .then(({ pessoas }) => {

        if (
          numeroPesquisa !==
          this.numeroPesquisaProprietario
        ) {

          return;
        }

        this.sugestoesProprietarios =
          (pessoas ?? [])
            .map((pessoa: any) => {

              const cpf =
                pessoa?.cpf ??
                pessoa?.dadosPessoaFisica?.cpf ??
                '';

              return {
                id: Number(pessoa.id),
                nome: pessoa.nome ?? '',
                cpf: this.somenteNumeros(cpf),
              };
            })
            .filter(
              (pessoa: PessoaProprietaria) =>
                Number.isFinite(pessoa.id),
            );

        this.mostrarSugestoesProprietarios =
          this.sugestoesProprietarios.length > 0;
      })
      .catch(error => {

        console.error(
          'Erro ao pesquisar proprietário:',
          error,
        );

        this.limparSugestoesProprietarios();

        this.exibirToast(
          'Não foi possível pesquisar os proprietários.',
          'Pesquisa',
          'warning',
        );
      })
      .finally(() => {

        if (
          numeroPesquisa ===
          this.numeroPesquisaProprietario
        ) {

          this.pesquisandoProprietarios = false;
        }
      });
  }

  selecionarProprietario(
    proprietario: PessoaProprietaria,
  ): void {

    if (!proprietario) {
      return;
    }

    this.pessoaId = proprietario.id;
    this.pessoaCpf = proprietario.cpf;
    this.pessoaNome = proprietario.nome;

    this.proprietarioCtrl.setValue(
      proprietario.nome,
      {
        emitEvent: false,
      },
    );

    this.proprietarioCpfCtrl.setValue(
      proprietario.cpf,
      {
        emitEvent: false,
      },
    );

    setTimeout(() => {

      if (
        this.proprietarioCpfInputRef
          ?.nativeElement
      ) {

        this.proprietarioCpfInputRef
          .nativeElement
          .value =
          this.formatarCpf(
            proprietario.cpf,
          );
      }
    }, 0);

    this.mostrarSugestoesProprietarios = false;
  }

  onCpfProprietarioInput(
    event: Event,
  ): void {

    const input =
      event.target as HTMLInputElement;

    const cpf =
      this.somenteNumeros(
        input.value,
      ).substring(0, 11);

    this.proprietarioCpfCtrl.setValue(
      cpf,
    );

    input.value =
      this.formatarCpf(cpf);
  }

  private limparProprietarioSelecionado(): void {

    this.pessoaId = null;
    this.pessoaCpf = null;
    this.pessoaNome = null;
  }

  formatarCpf(
    cpf: string | null | undefined,
  ): string {

    const digitos =
      this.somenteNumeros(cpf);

    if (digitos.length !== 11) {
      return digitos;
    }

    return digitos.replace(
      /(\d{3})(\d{3})(\d{3})(\d{2})/,
      '$1.$2.$3-$4',
    );
  }

  onCnpjInput(
    event: Event,
  ): void {

    const input =
      event.target as HTMLInputElement;

    const digitos =
      this.somenteNumeros(input.value)
        .substring(0, 14);

    this.estabelecimentoForm
      .get('cnpj')
      ?.setValue(
        digitos,
        {
          emitEvent: false,
        },
      );

    input.value =
      this.formatarCnpj(digitos);
  }

  formatarCnpj(
    cnpj: string | null | undefined,
  ): string {

    const digitos =
      this.somenteNumeros(cnpj)
        .substring(0, 14);

    const parte1 = digitos.substring(0, 2);
    const parte2 = digitos.substring(2, 5);
    const parte3 = digitos.substring(5, 8);
    const parte4 = digitos.substring(8, 12);
    const parte5 = digitos.substring(12, 14);

    let resultado = parte1;

    if (parte2) {
      resultado += '.' + parte2;
    }

    if (parte3) {
      resultado += '.' + parte3;
    }

    if (parte4) {
      resultado += '/' + parte4;
    }

    if (parte5) {
      resultado += '-' + parte5;
    }

    return resultado;
  }

  salvar(): void {

    this.estabelecimentoForm.markAllAsTouched();

    if (!this.pessoaId) {

      this.exibirToast(
        'Selecione o proprietário do estabelecimento.',
        'Validação',
        'warning',
      );

      return;
    }

    if (this.estabelecimentoForm.invalid) {

      this.exibirToast(
        'Preencha corretamente os campos obrigatórios.',
        'Validação',
        'warning',
      );

      return;
    }

    const dados =
      this.estabelecimentoForm.getRawValue();

    const estabelecimento =
      new EstabelecimentoIn(

        this.pessoaId,
        this.somenteNumeros(dados.cnpj),
        dados.nome?.trim(),
        dados.estabelecimento,
        dados.nomeFantasia?.trim(),
        dados.objetoSocial?.trim(),
        dados.microEmpresa,
        dados.conjuge?.trim(),
        dados.tipoEmpresa,
      );

    if (
      this.modoEdicao &&
      this.estabelecimentoId !== null
    ) {

      this.atualizarEstabelecimento(
        this.estabelecimentoId,
        estabelecimento,
      );

      return;
    }

    this.inserirEstabelecimento(
      estabelecimento,
    );
  }

  private inserirEstabelecimento(
    estabelecimento: EstabelecimentoIn,
  ): void {

    this.isLoading = true;

    this.estabelecimentoService
      .createEstabelecimento(estabelecimento)
      .pipe(takeUntil(this.destroy$))
      .subscribe({

        next: estabelecimentoSalvo => {

          this.estabelecimentoId =
            estabelecimentoSalvo.id ?? null;

          this.modoEdicao =
            this.estabelecimentoId !== null;

          this.estabelecimentoContext.definirContexto(
            this.estabelecimentoId,
            estabelecimentoSalvo.nome ?? null,
            estabelecimentoSalvo.pessoaId ??
            this.pessoaId,
          );

          this.exibirToast(
            'Estabelecimento cadastrado com sucesso.',
            'Sucesso',
            'success',
          );

          this.isLoading = false;
        },

        error: error => {

          console.error(
            'Erro ao cadastrar estabelecimento:',
            error,
          );

          this.tratarErroSalvamento(error);
          this.isLoading = false;
        },
      });
  }

  private atualizarEstabelecimento(
    id: number,
    estabelecimento: EstabelecimentoIn,
  ): void {

    this.isLoading = true;

    this.estabelecimentoService
      .updateEstabelecimento(
        id,
        estabelecimento,
      )
      .pipe(takeUntil(this.destroy$))
      .subscribe({

        next: estabelecimentoAtualizado => {

          this.estabelecimentoContext.definirContexto(
            id,
            estabelecimentoAtualizado.nome ?? null,
            estabelecimentoAtualizado.pessoaId ??
            this.pessoaId,
          );

          this.exibirToast(
            'Estabelecimento atualizado com sucesso.',
            'Sucesso',
            'success',
          );

          this.isLoading = false;
        },

        error: error => {

          console.error(
            'Erro ao atualizar estabelecimento:',
            error,
          );

          this.tratarErroSalvamento(error);
          this.isLoading = false;
        },
      });
  }

  voltar(): void {

    this.router.navigate([
      '/pages/estabelecimento/estabelecimento-pesquisa',
    ]);
  }

  campoInvalido(
    nomeCampo: string,
  ): boolean {

    const campo =
      this.estabelecimentoForm.get(nomeCampo);

    return !!(
      campo &&
      campo.invalid &&
      (
        campo.dirty ||
        campo.touched
      )
    );
  }

  private tratarErroSalvamento(
    error: any,
  ): void {

    const mensagem =
      error?.error?.message ||
      error?.error?.detail ||
      error?.message ||
      'Não foi possível salvar o estabelecimento.';

    this.exibirToast(
      mensagem,
      'Erro',
      'danger',
    );
  }

  private limparSugestoesProprietarios(): void {

    this.sugestoesProprietarios = [];
    this.mostrarSugestoesProprietarios = false;
    this.pesquisandoProprietarios = false;
  }

  private somenteNumeros(
    valor: any,
  ): string {

    return String(
      valor ?? '',
    ).replace(/\D/g, '');
  }

  private exibirToast(
    mensagem: string,
    titulo: string,
    status:
      | 'basic'
      | 'primary'
      | 'success'
      | 'info'
      | 'warning'
      | 'danger',
  ): void {

    this.toastrService.show(
      mensagem,
      titulo,
      {
        status,
        duration: 5000,
      },
    );
  }
}
