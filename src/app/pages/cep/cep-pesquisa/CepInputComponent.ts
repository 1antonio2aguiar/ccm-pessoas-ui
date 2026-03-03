import { Component, ElementRef, forwardRef, ViewChild, Input } from '@angular/core';
import { ControlValueAccessor, FormControl, NG_VALUE_ACCESSOR, NG_VALIDATORS, Validator, AbstractControl, ValidationErrors } from '@angular/forms';
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
export class CepInputComponent implements ControlValueAccessor, Validator {
  @ViewChild('cepInput', { static: true }) cepInput!: ElementRef<HTMLInputElement>;

  /** se estiver editando, não valida duplicidade */
  @Input() editMode = false;

  inputCtrl = new FormControl('');
  private cepPipe = new CepPipe();
  private applyingMask = false;
  private lastChecked = '';
  private duplicated = false;

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
  }

  registerOnChange(fn: any): void { this.onChange = fn; }
  registerOnTouched(fn: any): void { this.onTouched = fn; }

  setDisabledState(isDisabled: boolean): void {
    if (isDisabled) this.inputCtrl.disable({ emitEvent: false });
    else this.inputCtrl.enable({ emitEvent: false });
  }

  validate(_: AbstractControl): ValidationErrors | null {
    return this.duplicated ? { cepDuplicado: true } : null;
  }

  ngOnInit(): void {
    // máscara + limite 8
    this.inputCtrl.valueChanges
      .pipe(debounceTime(0), distinctUntilChanged())
      .subscribe((value: string) => {
        if (this.applyingMask) return;

        const digits = this.onlyDigits(value ?? '').slice(0, 8);

        // atualiza model (SEM máscara)
        this.onChange(digits);

        // aplica máscara na tela
        this.applyingMask = true;
        this.inputCtrl.setValue(this.cepPipe.transform(digits), { emitEvent: false });
        this.applyingMask = false;

        // se mudou, limpa flag duplicado
        this.duplicated = false;
      });

    // valida duplicidade (só no create)
    this.inputCtrl.valueChanges
      .pipe(
        debounceTime(350),
        filter(() => !this.applyingMask),
        switchMap(() => {
          const digits = this.onlyDigits(String(this.inputCtrl.value ?? '')).slice(0, 8);

          if (this.editMode) return of(null);
          if (digits.length !== 8) { this.duplicated = false; this.lastChecked = ''; return of(null); }
          if (digits === this.lastChecked) return of(null);
          this.lastChecked = digits;

          return this.cepService.filtrarPorCep(digits).pipe(
            catchError((err) => { console.error(err); return of(null); }),
          );
        }),
      )
      .subscribe((lista: any[] | null) => {
        if (!lista) return;

        if (lista.length > 0) {
          this.duplicated = true;

          this.toastr.show(
            'Este CEP já está cadastrado. Informe outro.',
            'CEP duplicado',
            { status: 'warning', icon: 'alert-circle-outline' },
          );

          // limpa e devolve foco
          this.applyingMask = true;
          this.inputCtrl.setValue('', { emitEvent: false });
          this.applyingMask = false;

          this.onChange('');
          this.lastChecked = '';

          setTimeout(() => this.cepInput?.nativeElement?.focus(), 0);
        } else {
          this.duplicated = false;
        }
      });
  }

  onBlur() {
    this.onTouched();
    const digits = this.onlyDigits(String(this.inputCtrl.value ?? '')).slice(0, 8);
    this.applyingMask = true;
    this.inputCtrl.setValue(this.cepPipe.transform(digits), { emitEvent: false });
    this.applyingMask = false;
    this.onChange(digits);
  }

  private onlyDigits(v: string): string {
    return (v ?? '').replace(/\D/g, '');
  }
}