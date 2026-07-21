import { Component, ElementRef, Input, OnDestroy, OnInit, ViewChild, AfterViewInit } from '@angular/core'; 
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject } from 'rxjs'; 
import { takeUntil, distinctUntilChanged, startWith } from 'rxjs/operators';
import { NbDialogRef, NbToastrService  } from '@nebular/theme';
import { formatarTelefoneUtil } from '../../../../shared/utils/formatar-telefone.util';

import { ContatoService } from '../contato.service';
import { PessoaService } from '../../pessoa.service';
import { EstabelecimentoSelect } from '../../../../shared/models/estabelecimento-select';

@Component({
    selector: 'ngx-contato-iud',
    templateUrl: './contato-iud.component.html',
    styleUrls: ['./contato-iud.component.scss']
}) 

export class ContatoIudComponent implements OnInit , OnDestroy {

  @Input() contatoParaEdicao: any;
  @Input() pessoaId: number | null = null; // Para associar o contato à pessoa
  @Input() nomePessoa: string | null = null; // Para mostrar no cabeçalho do html

  contatoForm!: FormGroup;
  modoEdicao = false;
  isLoadingCep = false;
  isLoadingSalvar = false;
  currentContactMask: string | null = null;
  
  estabelecimentos: EstabelecimentoSelect[] = []; 

  private destroy$ = new Subject<void>();

  readonly TIPO_CONTATO = {
    FIXO: '0',
    CELULAR: '1',
    WHATSAPP: '2',
    EMAIL: '3',
    PAGINA_WEB: '4',
    RECADO: '5'
  };
  
  constructor(
    protected dialogRef: NbDialogRef<ContatoIudComponent>,
    private toastrService: NbToastrService,
    private fb: FormBuilder,
    private contatoService: ContatoService ,
    private pessoaService: PessoaService,
  ) {}

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngOnInit(): void {
    this.modoEdicao = !!this.contatoParaEdicao;

    this.initForm();
    this.configurarTitularContato();
    this.listenToTipoContatoChanges();

    if (this.modoEdicao && this.contatoParaEdicao) {

      const tipoContato =
        String(this.contatoParaEdicao.tipoContato ?? '');

      const valorContato =
        String(this.contatoParaEdicao.contato ?? '');

      /*
      * A assinatura do método é:
      * aplicarFormatacaoContato(tipoContato, valorContato)
      */
      const contatoFormatado =
        this.aplicarFormatacaoContato(
          tipoContato,
          valorContato,
        );

      const titularContato =
        this.contatoParaEdicao.dadosPessoaJuridicaId != null
          ? 'ESTABELECIMENTO'
          : 'PESSOA_FISICA';

      /*
      * Não usamos "...this.contatoParaEdicao" para evitar que
      * propriedades do objeto sobrescrevam os valores preparados.
      */
      this.contatoForm.patchValue({
        id:
          this.contatoParaEdicao.id ?? null,

        nomePessoa:
          this.nomePessoa ??
          this.contatoParaEdicao.pessoaNome ??
          '',

        titularContato:
          titularContato,

        dadosPessoaJuridicaId:
          this.contatoParaEdicao.dadosPessoaJuridicaId != null
            ? Number(
                this.contatoParaEdicao.dadosPessoaJuridicaId,
              )
            : null,

        tipoContato:
          tipoContato,

        tipoContatoDescricao:
          this.contatoParaEdicao.tipoContatoDescricao ?? null,

        contato:
          contatoFormatado,

        complemento:
          this.contatoParaEdicao.complemento ?? '',

        principal:
          typeof this.contatoParaEdicao.principal === 'string'
            ? this.contatoParaEdicao.principal
                .toUpperCase() === 'S'
            : Boolean(this.contatoParaEdicao.principal),
      }, {
        emitEvent: false,
      });

      /*
      * Garante explicitamente a seleção do radio.
      */
      this.contatoForm
        .get('titularContato')
        ?.setValue(
          titularContato,
          { emitEvent: false },
        );
    }

    /*
    * Carrega as empresas depois que o formulário da edição
    * já recebeu os valores.
    */
    this.carregarEstabelecimentos();

    this.aplicarProtecaoCamposEdicao();
  }

  initForm(): void {
  this.contatoForm = this.fb.group({
    id: [null],
    nomePessoa: [this.nomePessoa],

    titularContato: [null, Validators.required],
    dadosPessoaJuridicaId: [null],

    contato: ['', Validators.required],
    complemento: [''],

    tipoContato: [null, Validators.required],
    tipoContatoDescricao: [null],

    principal: [false],
  });
}

  salvar(): void {
    this.isLoadingSalvar = true;
    const formValue = this.contatoForm.getRawValue();

    let contatoParaApi = formValue.contato;
    const tipoContatoAtual = formValue.tipoContato;

    if (tipoContatoAtual === this.TIPO_CONTATO.CELULAR ||
        tipoContatoAtual === this.TIPO_CONTATO.WHATSAPP ||
        tipoContatoAtual === this.TIPO_CONTATO.RECADO ||
        tipoContatoAtual === this.TIPO_CONTATO.FIXO) {
        contatoParaApi = formValue.contato.replace(/\D/g, ''); // Envia só números para telefones
    }

    const payload = {
  id: this.modoEdicao
    ? this.contatoParaEdicao.id
    : undefined,

  pessoaId:
    this.pessoaId ?? undefined,

  dadosPessoaJuridicaId:
    formValue.titularContato === 'ESTABELECIMENTO'
      ? formValue.dadosPessoaJuridicaId
      : null,

  tipoContato:
    Number(formValue.tipoContato),

  contato:
    contatoParaApi,

  complemento:
    formValue.complemento || null,

  principal:
    formValue.principal ? 'S' : 'N',
};

    const operacao = this.modoEdicao ?
      this.contatoService.update(payload) :
      this.contatoService.create(payload);

    operacao.pipe(takeUntil(this.destroy$)).subscribe({
      next: (resultado) => {
        this.isLoadingSalvar = false;
        this.toastrService.success(`Contato ${this.modoEdicao ? 'atualizado' : 'criado'} com sucesso!`, 'Sucesso');
        this.dialogRef.close(resultado);
      },
      error: (err) => {
        this.isLoadingSalvar = false;
        console.error('Erro ao salvar contato:', err);
        this.toastrService.danger('Falha ao salvar contato. Tente novamente.', 'Erro');
      }
    });
  }


  cancelar(): void {
    this.dialogRef.close(); // Fecha o modal sem retornar dados
  }

  listenToTipoContatoChanges(): void {
    const tipoContatoControl = this.contatoForm.get('tipoContato');
    const contatoControl = this.contatoForm.get('contato');

    if (tipoContatoControl && contatoControl) {
      tipoContatoControl.valueChanges.pipe(
        takeUntil(this.destroy$),
        startWith(tipoContatoControl.value) // Emite o valor inicial ou o valor após patchValue
      ).subscribe(tipo => {

        // Limpar validadores e máscara
        contatoControl.clearValidators();
        contatoControl.setValidators([Validators.required]);

        contatoControl.updateValueAndValidity({ emitEvent: false });
      });
    }
  }

  aplicarFormatacaoContato(
    tipoContato: string,
    valorContato?: string,
  ): string {

    const contatoControl =
      this.contatoForm.get('contato');

    const valor = String(valorContato ?? '');

    if (!valor) {
      return '';
    }

    if (
      tipoContato === '1' ||
      tipoContato === '2' ||
      tipoContato === '5' ||
      tipoContato === '0'
    ) {

      const apenasNumeros =
        valor.replace(/\D/g, '');

      let valorFormatado = apenasNumeros;

      if (apenasNumeros.length <= 10) {
        valorFormatado = apenasNumeros.replace(
          /^(\d{2})(\d{4})(\d+)/,
          '($1) $2-$3'
        );
      } else {
        valorFormatado = apenasNumeros.replace(
          /^(\d{2})(\d{5})(\d+)/,
          '($1) $2-$3'
        );
      }

      contatoControl?.setValue(
        valorFormatado,
        { emitEvent: false },
      );

      return valorFormatado;
    }

    contatoControl?.setValue(
      valor,
      { emitEvent: false },
    );

    return valor;
  }

  onContatoInput(event: Event): void {
    const inputElement = event.target as HTMLInputElement;
    const tipoContato = this.contatoForm.get('tipoContato')?.value;

    if (tipoContato === this.TIPO_CONTATO.CELULAR ||
      tipoContato === this.TIPO_CONTATO.WHATSAPP ||
      tipoContato === this.TIPO_CONTATO.RECADO ||
      tipoContato === this.TIPO_CONTATO.FIXO) {
        const valorFormatado = formatarTelefoneUtil(inputElement.value, tipoContato);
        this.contatoForm.get('contato')?.setValue(valorFormatado, { emitEvent: false });

        if (inputElement.value !== valorFormatado) {
          inputElement.value = valorFormatado;
      }
    }
  }

  private aplicarProtecaoCamposEdicao(): void {
  if (!this.modoEdicao) {
    return;
  }

  this.contatoForm
    .get('tipoContato')
    ?.disable({ emitEvent: false });

  this.contatoForm
    .get('titularContato')
    ?.disable({ emitEvent: false });

  this.contatoForm
    .get('dadosPessoaJuridicaId')
    ?.disable({ emitEvent: false });
}

  private carregarEstabelecimentos(): void {
  if (!this.pessoaId) {
    this.estabelecimentos = [];
    return;
  }

  this.pessoaService
    .getEstabelecimentos(this.pessoaId)
    .then((estabelecimentos: EstabelecimentoSelect[]) => {

      this.estabelecimentos =
        estabelecimentos ?? [];

      if (
        !this.modoEdicao ||
        this.contatoParaEdicao?.dadosPessoaJuridicaId == null
      ) {
        return;
      }

      const estabelecimentoId =
        Number(
          this.contatoParaEdicao.dadosPessoaJuridicaId,
        );

      const estabelecimentoEncontrado =
        this.estabelecimentos.find(
          estabelecimento =>
            Number(estabelecimento.id) ===
            estabelecimentoId,
        );

      if (estabelecimentoEncontrado?.id != null) {
        this.contatoForm
          .get('dadosPessoaJuridicaId')
          ?.setValue(
            Number(estabelecimentoEncontrado.id),
            { emitEvent: false },
          );
      }
    })
    .catch((erro) => {
      console.error(
        'Erro ao carregar estabelecimentos:',
        erro,
      );

      this.estabelecimentos = [];
    });
}

  private configurarTitularContato(): void {
    const titularControl =
      this.contatoForm.get('titularContato');

    const estabelecimentoControl =
      this.contatoForm.get('dadosPessoaJuridicaId');

    titularControl?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((titular: string | null) => {

        if (titular === 'ESTABELECIMENTO') {
          estabelecimentoControl?.setValidators(
            Validators.required,
          );
        } else {
          estabelecimentoControl?.clearValidators();

          estabelecimentoControl?.setValue(
            null,
            { emitEvent: false },
          );
        }

        estabelecimentoControl?.updateValueAndValidity({
          emitEvent: false,
        });
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