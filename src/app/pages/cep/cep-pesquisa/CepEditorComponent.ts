import { Component, ElementRef, ViewChild } from '@angular/core';
import { FormControl } from '@angular/forms';
import { DefaultEditor } from 'ng2-smart-table';
import { debounceTime, distinctUntilChanged, filter, switchMap, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { NbToastrService } from '@nebular/theme';

import { CepPipe } from '../../../shared/pipes/cep.pipe';
import { CepService } from '../cep.service'; // ajuste o caminho

@Component({
  selector: 'ngx-cep-editor',
  template: `
    <input
      nbInput
      fullWidth
      class="cep-input"
      [formControl]="inputCtrl"
      placeholder="Digite o CEP..."
      (blur)="onBlur()"
    />
  `,
})

export class CepEditorComponent extends DefaultEditor {
  @ViewChild('cepInput', { static: true }) cepInput!: ElementRef<HTMLInputElement>;

  inputCtrl = new FormControl('');
  private cepPipe = new CepPipe();
  private applyingMask = false;
  private lastChecked = '';

  constructor(
    private cepService: CepService,
    private toastr: NbToastrService,
  ) {
    super();
  }

  ngOnInit(): void {
    const rawInitial = String(this.cell.newValue ?? this.cell.getValue() ?? '');
    const digitsInitial = this.onlyDigits(rawInitial).slice(0, 8);

    this.inputCtrl.setValue(this.cepPipe.transform(digitsInitial), { emitEvent: false });
    this.writeValue(digitsInitial);

    // máscara + limite 8 enquanto digita
    this.inputCtrl.valueChanges
      .pipe(debounceTime(0), distinctUntilChanged())
      .subscribe((value: string) => {
        if (this.applyingMask) return;

        const digits = this.onlyDigits(value ?? '').slice(0, 8);
        this.writeValue(digits);

        this.applyingMask = true;
        this.inputCtrl.setValue(this.cepPipe.transform(digits), { emitEvent: false });
        this.applyingMask = false;
      });

    // valida duplicidade quando tiver 8 dígitos
    this.inputCtrl.valueChanges
      .pipe(
        debounceTime(350),
        filter(() => !this.applyingMask),
        switchMap(() => {
          const digits = this.onlyDigits(String(this.inputCtrl.value ?? '')).slice(0, 8);

          // só valida com 8 dígitos
          if (digits.length !== 8) {
            this.markDuplicado(false);
            this.lastChecked = '';
            return of(null);
          }

          // evita repetir a mesma chamada
          if (digits === this.lastChecked) return of(null);
          this.lastChecked = digits;

          // se for edição (tem id), não valida duplicidade aqui
          const rowData: any = this.cell.getRow().getData();
          const isEdit = !!rowData?.id;
          if (isEdit) return of(null);

          return this.cepService.filtrarPorCep(digits).pipe(
            catchError((err) => {
              console.error('Erro ao validar CEP:', err);
              return of(null);
            }),
          );
        }),
      )
      .subscribe((lista: any[] | null) => {
        if (!lista) return;

        // existe se voltar pelo menos 1 registro
        if (lista.length > 0) {
          this.markDuplicado(true);

          this.toastr.show(
            'Este CEP já está cadastrado. Informe outro.',
            'CEP duplicado',
            { status: 'warning', icon: 'alert-circle-outline' },
          );

          // limpa e força foco no CEP
          this.applyingMask = true;
          this.inputCtrl.setValue('', { emitEvent: false });
          this.applyingMask = false;

          this.writeValue('');
          this.lastChecked = '';

          // foco no input (próximo tick)
          setTimeout(() => this.cepInput?.nativeElement?.focus(), 0);
        } else {
          this.markDuplicado(false);
        }
      });
  }

  onBlur() {
    const digits = this.onlyDigits(String(this.inputCtrl.value ?? '')).slice(0, 8);
    this.applyingMask = true;
    this.inputCtrl.setValue(this.cepPipe.transform(digits), { emitEvent: false });
    this.applyingMask = false;
    this.writeValue(digits);
  }

  private writeValue(digits: string) {
    this.cell.newValue = digits;

    if (typeof (this.cell as any).setValue === 'function') {
      (this.cell as any).setValue(digits);
    } else {
      this.cell.setValue(digits);
    }

    const data: any = this.cell.getRow().getData();
    data.cep = digits; // sem máscara
  }

  private markDuplicado(duplicado: boolean) {
    const data: any = this.cell.getRow().getData();
    data.cepDuplicado = duplicado;
  }

  private onlyDigits(v: string): string {
    return (v ?? '').replace(/\D/g, '');
  }
}