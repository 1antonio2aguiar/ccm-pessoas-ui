import { Component, ElementRef, Input, OnDestroy, OnInit, ViewChild, AfterViewInit } from '@angular/core'; 
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject } from 'rxjs'; 
import { takeUntil, distinctUntilChanged, startWith } from 'rxjs/operators';
import { NbDialogRef, NbToastrService  } from '@nebular/theme';
import { ContatoService } from '../contato.service';
import { formatarTelefoneUtil } from '../../../../shared/utils/formatar-telefone.util';

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
    private contatoService: ContatoService 
  ) {}

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngOnInit(): void {
    this.modoEdicao = !!this.contatoParaEdicao;
    this.initForm();


    if (this.modoEdicao && this.contatoParaEdicao) {
      this.listenToTipoContatoChanges();

      // Formata
      this.contatoParaEdicao.contato =
      this.aplicarFormatacaoContatoBaseadoNoTipo(this.contatoParaEdicao.contato,this.contatoParaEdicao.tipoContato)

      const dadosParaPatch = {
        ...this.contatoParaEdicao, // Espalha os valores de contatoParaEdicao
        tipoContato: this.contatoParaEdicao.tipoContato?.toString(), // <<<< CONVERTE PARA STRING AQUI
        principal: typeof this.contatoParaEdicao.principal === 'string' ?
                    this.contatoParaEdicao.principal.toUpperCase() === 'S' :
                    Boolean(this.contatoParaEdicao.principal) // Converte para booleano
      };

      this.contatoForm.patchValue(dadosParaPatch);
    }

    // 🔒 BLOQUEIA O TIPO CONTATO NO EDIT
    this.aplicarProtecaoCamposEdicao();

  }

  initForm(): void {

    this.contatoForm = this.fb.group({
      id: [null], // Usado para edição
      nomePessoa: [this.nomePessoa],
      contato: ['', Validators.required],
      complemento: [''],
      tipoContato: [null, Validators.required], 
      tipoContatoDescricao: [null], 
      principal: [null],
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
      id: this.modoEdicao ? this.contatoParaEdicao.id : null,
      pessoaId: this.pessoaId,
      tipoContato: parseInt(formValue.tipoContato, 10), // Converte para número
      contato: contatoParaApi,
      complemento: formValue.complemento || null,
      principal: formValue.principal ? 'S' : 'N' // Converte booleano para 'S'/'N'
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

  aplicarFormatacaoContatoBaseadoNoTipo(valorContato: string, tipoContato: string): string {
    const contatoControl = this.contatoForm.get('contato');

    if (!valorContato) return;

    if (tipoContato == "1" ||
      tipoContato == "2" ||
      tipoContato == "5" ||
      tipoContato == "0") {

      const apenasNumeros = (valorContato || '').replace(/\D/g, ''); // Garante que é string e remove não dígitos
      const valorFormatado =formatarTelefoneUtil(apenasNumeros, tipoContato);
      //console.log(`Aplicando formatação para tipo ${tipoContato}. Original: "${valorContato}", Numérico: "${apenasNumeros}", Formatado: "${valorFormatado}"`);
      contatoControl.setValue(valorFormatado, { emitEvent: false });
      return valorFormatado;
    } else {
      return valorContato;
    }
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
    if (!this.modoEdicao) return;

    this.contatoForm.get('tipoContato')?.disable({ emitEvent: false });
  }

}