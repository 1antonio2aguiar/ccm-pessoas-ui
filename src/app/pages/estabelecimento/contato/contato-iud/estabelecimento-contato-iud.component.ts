import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NbDialogRef, NbToastrService } from '@nebular/theme';
import { Subject } from 'rxjs';
import { startWith, takeUntil } from 'rxjs/operators';

import { ContatoIn } from '../../../../shared/models/contatoIn';
import { formatarTelefoneUtil } from '../../../../shared/utils/formatar-telefone.util';
import { EstabelecimentoContatoService } from '../estabelecimento-contato.service';

@Component({
  selector: 'ngx-estabelecimento-contato-iud',
  templateUrl: './estabelecimento-contato-iud.component.html',
  styleUrls: ['./estabelecimento-contato-iud.component.scss'],
})
export class EstabelecimentoContatoIudComponent implements OnInit, OnDestroy {
  @Input() contatoParaEdicao: any;
  @Input() estabelecimentoId: number | null = null;
  @Input() nomeEstabelecimento: string | null = null;
  @Input() pessoaId: number | null = null;

  contatoForm!: FormGroup;
  modoEdicao = false;
  isLoadingSalvar = false;

  private destroy$ = new Subject<void>();

  readonly TIPO_CONTATO = {
    FIXO: '0',
    CELULAR: '1',
    WHATSAPP: '2',
    EMAIL: '3',
    PAGINA_WEB: '4',
    RECADO: '5',
  };

  constructor(
    protected dialogRef: NbDialogRef<EstabelecimentoContatoIudComponent>,
    private toastrService: NbToastrService,
    private fb: FormBuilder,
    private contatoService: EstabelecimentoContatoService,
  ) {
  }

  ngOnInit(): void {
    this.modoEdicao = !!this.contatoParaEdicao;
    this.initForm();
    this.listenToTipoContatoChanges();

    if (this.modoEdicao) {
      this.preencherEdicao();
      this.contatoForm.get('tipoContato')?.disable({ emitEvent: false });
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initForm(): void {
    this.contatoForm = this.fb.group({
      id: [null],
      nomeEstabelecimento: [this.nomeEstabelecimento],
      dadosPessoaJuridicaId: [this.estabelecimentoId, Validators.required],
      contato: ['', Validators.required],
      complemento: [''],
      tipoContato: [null, Validators.required],
      principal: [false],
    });
  }

  private preencherEdicao(): void {
    const tipoContato = String(this.contatoParaEdicao.tipoContato ?? '');
    const contato = this.aplicarFormatacaoContato(
      tipoContato,
      String(this.contatoParaEdicao.contato ?? ''),
    );

    this.contatoForm.patchValue({
      id: this.contatoParaEdicao.id ?? null,
      nomeEstabelecimento: this.nomeEstabelecimento ?? '',
      dadosPessoaJuridicaId:
        this.estabelecimentoId ??
        this.contatoParaEdicao.dadosPessoaJuridicaId,
      tipoContato,
      contato,
      complemento: this.contatoParaEdicao.complemento ?? '',
      principal:
        this.contatoParaEdicao.principal === 'S' ||
        this.contatoParaEdicao.principal === 'SIM' ||
        this.contatoParaEdicao.principal === true,
    }, { emitEvent: false });
  }

  salvar(): void {
    if (this.contatoForm.invalid) {
      this.contatoForm.markAllAsTouched();
      this.toastrService.warning('Verifique os campos obrigatórios.', 'Atenção');
      return;
    }

    this.isLoadingSalvar = true;
    const formValue = this.contatoForm.getRawValue();
    const tipoContato = String(formValue.tipoContato ?? '');

    let contatoParaApi = String(formValue.contato ?? '');

    if (this.tipoContatoUsaTelefone(tipoContato)) {
      contatoParaApi = contatoParaApi.replace(/\D/g, '');
    }

    const payload: ContatoIn = {
      id: this.modoEdicao ? this.contatoParaEdicao.id : undefined,
      pessoaId: this.pessoaId ?? undefined,
      dadosPessoaJuridicaId:
        this.estabelecimentoId ?? formValue.dadosPessoaJuridicaId,
      tipoContato: Number(tipoContato),
      contato: contatoParaApi,
      complemento: formValue.complemento || undefined,
      principal: formValue.principal === true ? 'S' : 'N',
    };

    const operacao = this.modoEdicao
      ? this.contatoService.update(payload)
      : this.contatoService.create(payload);

    operacao.pipe(takeUntil(this.destroy$)).subscribe({
      next: resultado => {
        this.isLoadingSalvar = false;
        this.toastrService.success(
          `Contato ${this.modoEdicao ? 'atualizado' : 'cadastrado'} com sucesso.`,
          'Sucesso',
        );
        this.dialogRef.close(resultado);
      },
      error: error => {
        this.isLoadingSalvar = false;
        console.error('Erro ao salvar contato:', error);
        this.toastrService.danger(
          error?.error?.message || error?.message || 'Não foi possível salvar o contato.',
          'Erro',
        );
      },
    });
  }

  cancelar(): void {
    this.dialogRef.close();
  }

  private listenToTipoContatoChanges(): void {
    const tipoContatoControl = this.contatoForm.get('tipoContato');
    const contatoControl = this.contatoForm.get('contato');

    tipoContatoControl?.valueChanges
      .pipe(
        takeUntil(this.destroy$),
        startWith(tipoContatoControl.value),
      )
      .subscribe(() => {
        contatoControl?.setValidators([Validators.required]);
        contatoControl?.updateValueAndValidity({ emitEvent: false });
      });
  }

  onContatoInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const tipoContato = String(this.contatoForm.get('tipoContato')?.value ?? '');

    if (!this.tipoContatoUsaTelefone(tipoContato)) {
      return;
    }

    const valorFormatado = formatarTelefoneUtil(input.value, tipoContato);
    this.contatoForm.get('contato')?.setValue(valorFormatado, { emitEvent: false });
    input.value = valorFormatado;
  }

  private aplicarFormatacaoContato(tipoContato: string, contato: string): string {
    if (!this.tipoContatoUsaTelefone(tipoContato)) {
      return contato;
    }

    return formatarTelefoneUtil(contato, tipoContato);
  }

  private tipoContatoUsaTelefone(tipoContato: string): boolean {
    return tipoContato === this.TIPO_CONTATO.FIXO ||
      tipoContato === this.TIPO_CONTATO.CELULAR ||
      tipoContato === this.TIPO_CONTATO.WHATSAPP ||
      tipoContato === this.TIPO_CONTATO.RECADO;
  }
}
