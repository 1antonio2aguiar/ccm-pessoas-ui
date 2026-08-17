import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NbDialogRef, NbToastrService } from '@nebular/theme';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { DocumentoIn } from '../../../../shared/models/documentoIn';
import { EstabelecimentoDocumentoService } from '../estabelecimento-documento.service';

@Component({
  selector: 'ngx-estabelecimento-documento-iud',
  templateUrl: './estabelecimento-documento-iud.component.html',
  styleUrls: ['./estabelecimento-documento-iud.component.scss'],
})
export class EstabelecimentoDocumentoIudComponent implements OnInit, OnDestroy {
  @Input() documentoParaEdicao: any;
  @Input() estabelecimentoId: number | null = null;
  @Input() nomeEstabelecimento: string | null = null;
  @Input() pessoaId: number | null = null;

  documentoForm!: FormGroup;
  modoEdicao = false;
  isLoadingSalvar = false;

  private destroy$ = new Subject<void>();

  constructor(
    protected dialogRef: NbDialogRef<EstabelecimentoDocumentoIudComponent>,
    private toastrService: NbToastrService,
    private fb: FormBuilder,
    private documentoService: EstabelecimentoDocumentoService,
  ) {
  }

  ngOnInit(): void {
    this.modoEdicao = !!this.documentoParaEdicao;
    this.initForm();

    if (this.modoEdicao) {
      this.preencherEdicao();
      this.documentoForm.get('tipoDocumento')?.disable({ emitEvent: false });
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initForm(): void {
    this.documentoForm = this.fb.group({
      id: [null],
      nomeEstabelecimento: [this.nomeEstabelecimento],
      dadosPessoaJuridicaId: [this.estabelecimentoId, Validators.required],
      tipoDocumento: [null, Validators.required],
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
      observacao: [null],
    });
  }

  private preencherEdicao(): void {
    this.documentoForm.patchValue({
      id: this.documentoParaEdicao.id ?? null,
      nomeEstabelecimento: this.nomeEstabelecimento ?? '',
      dadosPessoaJuridicaId:
        this.estabelecimentoId ??
        this.documentoParaEdicao.dadosPessoaJuridicaId,
      tipoDocumento:
        this.documentoParaEdicao.tipoDocumento != null
          ? String(this.documentoParaEdicao.tipoDocumento)
          : null,
      numeroDocumento: this.documentoParaEdicao.numeroDocumento ?? '',
      documentoOrigem: this.documentoParaEdicao.documentoOrigem ?? null,
      orgaoExpedidor: this.documentoParaEdicao.orgaoExpedidor ?? null,
      categoriaCnh: this.documentoParaEdicao.categoriaCnh ?? null,
      dataDocumento: this.documentoParaEdicao.dataDocumento ?? null,
      dataExpedicao: this.documentoParaEdicao.dataExpedicao ?? null,
      dataValidade: this.documentoParaEdicao.dataValidade ?? null,
      dataPrimeiraCnh: this.documentoParaEdicao.dataPrimeiraCnh ?? null,
      zona: this.documentoParaEdicao.zona ?? null,
      secao: this.documentoParaEdicao.secao ?? null,
      observacao: this.documentoParaEdicao.observacao ?? null,
    }, { emitEvent: false });
  }

  salvar(): void {
    if (this.documentoForm.invalid) {
      this.documentoForm.markAllAsTouched();
      this.toastrService.warning('Preencha os campos obrigatórios.', 'Atenção');
      return;
    }

    this.isLoadingSalvar = true;
    const formValue = this.documentoForm.getRawValue();

    const payload: DocumentoIn = {
      id: this.modoEdicao ? this.documentoParaEdicao.id : undefined,
      pessoaId: this.pessoaId ?? undefined,
      dadosPessoaJuridicaId:
        this.estabelecimentoId ?? Number(formValue.dadosPessoaJuridicaId),
      tipoDocumento:
        formValue.tipoDocumento !== null && formValue.tipoDocumento !== ''
          ? Number(formValue.tipoDocumento)
          : undefined,
      numeroDocumento: formValue.numeroDocumento,
      dataDocumento: formValue.dataDocumento || undefined,
      dataExpedicao: formValue.dataExpedicao || undefined,
      documentoOrigem: formValue.documentoOrigem || undefined,
      orgaoExpedidor: formValue.orgaoExpedidor || undefined,
      dataPrimeiraCnh: formValue.dataPrimeiraCnh || undefined,
      dataValidade: formValue.dataValidade || undefined,
      categoriaCnh: formValue.categoriaCnh || undefined,
      zona:
        formValue.zona !== null && formValue.zona !== ''
          ? Number(formValue.zona)
          : undefined,
      secao:
        formValue.secao !== null && formValue.secao !== ''
          ? Number(formValue.secao)
          : undefined,
      observacao: formValue.observacao || undefined,
    };

    const operacao = this.modoEdicao
      ? this.documentoService.update(payload)
      : this.documentoService.create(payload);

    operacao.pipe(takeUntil(this.destroy$)).subscribe({
      next: resultado => {
        this.isLoadingSalvar = false;
        this.toastrService.success(
          `Documento ${this.modoEdicao ? 'atualizado' : 'cadastrado'} com sucesso.`,
          'Sucesso',
        );
        this.dialogRef.close(resultado);
      },
      error: error => {
        this.isLoadingSalvar = false;
        console.error('Erro ao salvar documento:', error);
        this.toastrService.danger(
          error?.error?.message || error?.message || 'Não foi possível salvar o documento.',
          'Erro',
        );
      },
    });
  }

  cancelar(): void {
    this.dialogRef.close();
  }
}
