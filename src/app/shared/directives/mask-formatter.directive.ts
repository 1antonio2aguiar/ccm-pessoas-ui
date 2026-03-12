import { Directive, ElementRef, HostListener, Input, Optional, Self } from '@angular/core';
import { NgControl } from '@angular/forms';

@Directive({
  selector: '[ngxMaskFormatter]' // O seletor que usaremos no HTML
})

export class MaskFormatterDirective {

  @Input('ngxMaskFormatter') maskType: 'cpf' | 'cnpj';

  constructor(
    private el: ElementRef<HTMLInputElement>,
    @Optional() @Self() private control: NgControl
  ) {}

  @HostListener('input', ['$event'])
  onInput(event: Event): void {

    //console.log('esta na diretiva ')

    if (!this.control) {
      return;
    }

    const inputElement = event.target as HTMLInputElement;
    let value = inputElement.value;
    let rawValue = value.replace(/\D/g, '');
    let formattedValue = '';

    if (this.maskType === 'cpf') {
      rawValue = rawValue.substring(0, 11);
      formattedValue = this.formatCpf(rawValue); // Agora o método existe
    } else if (this.maskType === 'cnpj') {
      rawValue = rawValue.substring(0, 14);
      formattedValue = this.formatCnpj(rawValue); // Agora o método existe
    }

    if (this.control.value !== rawValue) {
      this.control.control?.setValue(rawValue, { emitEvent: false });
    }

    this.el.nativeElement.value = formattedValue;
  }

  // **** MÉTODO QUE ESTAVA FALTANDO ****
  private formatCpf(value: string): string {
    if (!value) return '';
    if (value.length > 9) {
      return `${value.substring(0, 3)}.${value.substring(3, 6)}.${value.substring(6, 9)}-${value.substring(9, 11)}`;
    }
    if (value.length > 6) {
      return `${value.substring(0, 3)}.${value.substring(3, 6)}.${value.substring(6, 9)}`;
    }
    if (value.length > 3) {
      return `${value.substring(0, 3)}.${value.substring(3, 6)}`;
    }
    return value;
  }

  // **** MÉTODO QUE ESTAVA FALTANDO ****
  private formatCnpj(value: string): string {
    if (!value) return '';
    if (value.length > 12) {
      return `${value.substring(0, 2)}.${value.substring(2, 5)}.${value.substring(5, 8)}/${value.substring(8, 12)}-${value.substring(12, 14)}`;
    }
    if (value.length > 8) {
      return `${value.substring(0, 2)}.${value.substring(2, 5)}.${value.substring(5, 8)}/${value.substring(8, 12)}`;
    }
    if (value.length > 5) {
      return `${value.substring(0, 2)}.${value.substring(2, 5)}.${value.substring(5, 8)}`;
    }
    if (value.length > 2) {
      return `${value.substring(0, 2)}.${value.substring(2, 5)}`;
    }
    return value;
  }
}
