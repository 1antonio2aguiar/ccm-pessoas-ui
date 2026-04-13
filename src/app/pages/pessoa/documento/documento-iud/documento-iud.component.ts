import { Component, ElementRef, Input, OnDestroy, OnInit, ViewChild, AfterViewInit } from '@angular/core'; 
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject } from 'rxjs'; 
import { takeUntil, distinctUntilChanged, startWith } from 'rxjs/operators';
import { NbDialogRef, NbToastrService  } from '@nebular/theme';
import { DocumentoService } from '../documento.service';

@Component({
    selector: 'ngx-contato-iud',
    templateUrl: './documento-iud.component.html',
    styleUrls: ['./documento-iud.component.scss']
})

export class DocumentoIudComponent implements OnInit , OnDestroy {

  @Input() documentoParaEdicao: any;
  @Input() pessoaId: number | null = null; 
  @Input() nomePessoa: string | null = null; 

  documentoForm!: FormGroup;
  modoEdicao = false;
  isLoadingCep = false;
  isLoadingSalvar = false;
  currentContactMask: string | null = null;

  private destroy$ = new Subject<void>();

  /*readonly TIPO_DOCUMENTO = {
    CTPS: '0',
    CNH: '1',
    INSCRIÇÃO_MUNICIPAL: '2',
    PASSAPORTE: '3',
    RESERVISTA: '4',
    RG: '5',
    TÍTULOD_DE_ELEITOR: '6',
    RG_ESTRANGEIRO: '7',
  };*/
  
  constructor(
    protected dialogRef: NbDialogRef<DocumentoIudComponent>,
    private toastrService: NbToastrService,
    private fb: FormBuilder,
    private documentoService: DocumentoService
  ) {}

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngOnInit(): void {
    this.modoEdicao = !!this.documentoParaEdicao;
    this.initForm();


    if (this.modoEdicao && this.documentoParaEdicao) {

      const dadosParaPatch = {
        ...this.documentoParaEdicao, // Espalha os valores de contatoParaEdicao
        tipoDocumento: this.documentoParaEdicao.tipoDocumento?.toString(), // <<<< CONVERTE PARA STRING AQUI
        
      };

      this.documentoForm.patchValue(dadosParaPatch);
    }

    this.aplicarProtecaoCamposEdicao();

  }

  initForm(): void {

    this.documentoForm = this.fb.group({
      id: [null], // Usado para edição
      tipoDocumento: [null, Validators.required], 
      tipoDocumentoDescricao: [null], 
      numeroDocumento: ['', Validators.required],
      documentoOrigem: [null],
      orgaoExpedidor: [null],
      categoriaCnh: [null],
      
      dataDocumento: [null],
      dataExpedicao: [null],
      dataValidade: [null],
      dataPrimeiraCnh: [null],
      zona: [null],
      secao: [null],

      nomePessoa: [this.nomePessoa],

      observacao: [null],
    });
    
  } 

  salvar(): void {
    this.isLoadingSalvar = true;
    const formValue = this.documentoForm.getRawValue();

    let documentoParaApi = formValue.documento;

    const payload = {
      id: this.modoEdicao ? this.documentoParaEdicao.id : null,
      pessoaId: this.pessoaId,
      tipoDocumento: parseInt(formValue.tipoDocumento, 10),
      numeroDocumento: formValue.numeroDocumento, 
      dataDocumento: formValue.dataDocumento,
      dataExpedicao: formValue.dataExpedicao || null,
      documentoOrigem: formValue.documentoOrigem || null,
      orgaoExpedidor: formValue.orgaoExpedidor || null,
      dataPrimeiraCnh: formValue.dataPrimeiraCnh || null,
      dataValidade: formValue.dataValidade || null,
      categoriaCnh: formValue.categoriaCnh || null,
      zona: formValue.zona || null, 
      secao: formValue.secao || null,
      observacao: formValue.observacao || null,
    };

    const operacao = this.modoEdicao ?
      this.documentoService.update(payload) :
      this.documentoService.create(payload);

    operacao.pipe(takeUntil(this.destroy$)).subscribe({
      next: (resultado) => {
        this.isLoadingSalvar = false;
        this.toastrService.success(`Documento ${this.modoEdicao ? 'atualizado' : 'criado'} com sucesso!`, 'Sucesso');
        this.dialogRef.close(resultado);
      },
      error: (err) => {
        this.isLoadingSalvar = false;
        console.error('Erro ao salvar documento:', err);
        this.toastrService.danger('Falha ao salvar documento. Tente novamente.', 'Erro');
      }
    });
  }

  cancelar(): void {
    this.dialogRef.close(); // Fecha o modal sem retornar dados
  }

  private aplicarProtecaoCamposEdicao(): void {
    if (!this.modoEdicao) return;

    this.documentoForm.get('tipoDocumento')?.disable({ emitEvent: false });
}
  
}