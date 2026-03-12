import { Component, ElementRef, forwardRef, ViewChild, Input, OnInit } from '@angular/core';
import {
  ControlValueAccessor,
  FormControl,
  NG_VALUE_ACCESSOR,
  NG_VALIDATORS,
  Validator,
  AbstractControl,
  ValidationErrors
} from '@angular/forms';
import { debounceTime, distinctUntilChanged, filter, switchMap, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { NbToastrService } from '@nebular/theme';

import { CepPipe } from '../../../shared/pipes/cep.pipe';
import { CepService } from '../cep.service';

@Component({
  selector: 'ngx-cep-input',
  template: `
    <input
      #cepInput
      nbInput
      fullWidth
      class="cep-input"
      [formControl]="inputCtrl"
      placeholder="Informe o CEP"
      inputmode="numeric"
      maxlength="10"
      (blur)="onBlur()"
    />
  `,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CepInputComponent),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => CepInputComponent),
      multi: true,
    },
  ],
})
export class CepInputComponent implements ControlValueAccessor, Validator, OnInit {
  @ViewChild('cepInput', { static: true }) cepInput!: ElementRef<HTMLInputElement>;

  @Input() editMode = false;

  /**
   * none = não consulta backend
   * must-exist = CEP deve existir
   * must-not-exist = CEP não pode existir
   */
  @Input() validationMode: 'none' | 'must-exist' | 'must-not-exist' = 'none';

  inputCtrl = new FormControl('');
  private cepPipe = new CepPipe();
  private applyingMask = false;
  private lastChecked = '';

  private duplicated = false;
  private notFound = false;

  private onChange: (val: any) => void = () => {};
  private onTouched: () => void = () => {};

  constructor(
    private cepService: CepService,
    private toastr: NbToastrService,
  ) {}

  writeValue(value: any): void {
    const digits = this.onlyDigits(String(value ?? '')).slice(0, 8);
    this.applyingMask = true;
    this.inputCtrl.setValue(this.cepPipe.transform(digits), { emitEvent: false });
    this.applyingMask = false;

    this.duplicated = false;
    this.notFound = false;
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    if (isDisabled) {
      this.inputCtrl.disable({ emitEvent: false });
    } else {
      this.inputCtrl.enable({ emitEvent: false });
    }
  }

  validate(_: AbstractControl): ValidationErrors | null {
    if (this.duplicated) {
      return { cepDuplicado: true };
    }

    if (this.notFound) {
      return { cepNaoEncontrado: true };
    }

    return null;
  }

  ngOnInit(): void {
    // máscara + model
    this.inputCtrl.valueChanges
      .pipe(debounceTime(0), distinctUntilChanged())
      .subscribe((value: string) => {
        if (this.applyingMask) return;

        const digits = this.onlyDigits(value ?? '').slice(0, 8);

        this.onChange(digits);

        this.applyingMask = true;
        this.inputCtrl.setValue(this.cepPipe.transform(digits), { emitEvent: false });
        this.applyingMask = false;

        this.duplicated = false;
        this.notFound = false;
      });

    // validação backend
    this.inputCtrl.valueChanges
      .pipe(
        debounceTime(350),
        filter(() => !this.applyingMask),
        switchMap(() => {
          const digits = this.onlyDigits(String(this.inputCtrl.value ?? '')).slice(0, 8);

          if (this.editMode) return of(null);
          if (this.validationMode === 'none') return of(null);

          if (digits.length !== 8) {
            this.duplicated = false;
            this.notFound = false;
            this.lastChecked = '';
            return of(null);
          }

          if (digits === this.lastChecked) return of(null);
          this.lastChecked = digits;

          return this.cepService.filtrarPorCep(digits).pipe(
            catchError((err) => {
              console.error(err);
              return of(null);
            }),
          );
        }),
      )
      .subscribe((lista: any[] | null) => {
        if (lista === null) return;

        const exists = Array.isArray(lista) && lista.length > 0;

        this.duplicated = false;
        this.notFound = false;

        if (this.validationMode === 'must-not-exist' && exists) {
          this.duplicated = true;

          this.toastr.show(
            'Este CEP já está cadastrado. Informe outro.',
            'CEP duplicado',
            { status: 'warning', icon: 'alert-circle-outline' },
          );

          this.clearAndFocus();
          return;
        }

        if (this.validationMode === 'must-exist' && !exists) {
          this.notFound = true;

          this.toastr.show(
            'Este CEP não está cadastrado. Informe um CEP existente.',
            'CEP não encontrado',
            { status: 'warning', icon: 'alert-circle-outline' },
          );

          this.clearAndFocus();
          return;
        }
      });
  }

  onBlur(): void {
    this.onTouched();

    const digits = this.onlyDigits(String(this.inputCtrl.value ?? '')).slice(0, 8);

    this.applyingMask = true;
    this.inputCtrl.setValue(this.cepPipe.transform(digits), { emitEvent: false });
    this.applyingMask = false;

    this.onChange(digits);
  }

  private clearAndFocus(): void {
    this.applyingMask = true;
    this.inputCtrl.setValue('', { emitEvent: false });
    this.applyingMask = false;

    this.onChange('');
    this.lastChecked = '';

    setTimeout(() => this.cepInput?.nativeElement?.focus(), 0);
  }

  private onlyDigits(v: string): string {
    return (v ?? '').replace(/\D/g, '');
  }
}