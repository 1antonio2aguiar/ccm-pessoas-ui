import { Component, Input, Output, EventEmitter } from '@angular/core';
import { NbSelectComponent } from '@nebular/theme';

/*@Component({
  selector: 'app-custom-select-button',
  template: `
    <nb-select (selectedChange)="onSelectionChange($event)">
      <nb-option *ngFor="let option of options" [value]="option.value">{{ option.label }}</nb-option>
    </nb-select>
  `,
  styles: [`
     Adicione seus estilos personalizados aqui, utilizando as classes do ngx-admin 
  `]
})
export class CustomSelectButtonComponent {
  @Input() options = [];
  @Input() selectedValue;
  @Output() selectedChange = new EventEmitter<any>();

  onSelectionChange(event) {
    this.selectedChange.emit(event);
  }
}*/