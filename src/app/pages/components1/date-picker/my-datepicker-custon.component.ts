import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { DefaultFilter } from 'ng2-smart-table'; // MUITO IMPORTANTE
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';

@Component({
  selector: 'ngx-your-datepicker-filter', // Certifique-se que o seletor é único
  template: `
    <input
      #inputField
      nbInput
      fullWidth
      [placeholder]="column.getFilterConfig()?.placeholder || 'Data'"
      [nbDatepicker]="picker"
      [(ngModel)]="selectedDate"
      (ngModelChange)="onModelChange()"
      readonly
    />
    <nb-datepicker #picker (dateChange)="onDateChange($event)" format="dd/MM/yyyy"></nb-datepicker>
  `,

  styles: [`
    :host {
      display: block;
      width: 100%;
    }

    /* Usando ::ng-deep para garantir que o estilo alcance o input interno */
    /* Este seletor mira no input DENTRO do componente atual */
    ::ng-deep .custom-date-filter-input,
    ::ng-deep input[nbInput] { /* Aplica-se a qualquer input com nbInput neste componente */
      background-color: #ffffff !important;
      border: 1px solid #e4e9f2 !important;
      padding: 0.4375rem 1.125rem !important;
      font-size: 0.9375rem !important;
      line-height: 1.5 !important;
      color: var(--text-basic-color, #222b45) !important;
      border-radius: var(--input-medium-border-radius, 0.25rem) !important;
      width: 100% !important;
      box-sizing: border-box !important;
      -webkit-appearance: none;
      -moz-appearance: none;
      appearance: none;
    }

    ::ng-deep .custom-date-filter-input:focus,
    ::ng-deep input[nbInput]:focus {
      border-color: var(--input-focus-border-color, #3366ff) !important;
      outline: 0 !important;
      box-shadow: var(--input-focus-box-shadow, 0 0 0 0.2rem rgba(51, 102, 255, 0.25)) !important;
    }
  `]
})

export class MyDatepickerCustonComponent extends DefaultFilter implements OnInit, OnDestroy { // ESTENDER DEFAULTFILTER
  selectedDate: Date | null = null;

  // Usaremos um Subject para debounce, como no exemplo anterior, é uma boa prática
  private valueChanged = new Subject<string | null>();
  private destroy$ = new Subject<void>();

  // query: string; // Herdado de DefaultFilter, não precisa redeclarar se for público lá

  constructor() {
    super(); // Chama o construtor da classe DefaultFilter
  }

  ngOnInit() {
    // Se um valor de filtro já existir (this.query), inicialize o datepicker
    if (this.query && typeof this.query === 'string') {
      const [year, month, day] = this.query.split('-').map(Number);
      if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
        // Cuidado com o mês em JavaScript Date (0-indexado)
        this.selectedDate = new Date(year, month - 1, day);
      }
    }

    // Debounce para evitar múltiplas emissões rápidas
    this.valueChanged.pipe(
      debounceTime(this.delay), // delay é herdado de DefaultFilter (padrão 300ms)
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe((filterValue) => {
      this.query = filterValue !== null ? filterValue : ''; // Atualiza this.query
      //console.log(`DatepickerComponent: Chamando setFilter() com query: '${this.query}'`);
      this.setFilter(); // <--- ESTE É O PONTO CRÍTICO PARA NOTIFICAR A TABELA
    });

  }

  onModelChange(): void {
    // Chamado quando o ngModel do input muda
    this.updateAndEmitQuery();
  }

  onDateChange(date: Date | null): void {
    // Chamado quando o nb-datepicker emite diretamente
    this.selectedDate = date;
    this.updateAndEmitQuery();
  }

  private updateAndEmitQuery(): void {
    let queryValue: string | null = null;
    if (this.selectedDate) {
      const day = ('0' + this.selectedDate.getDate()).slice(-2);
      const month = ('0' + (this.selectedDate.getMonth() + 1)).slice(-2); // Mês é 0-indexado
      const year = this.selectedDate.getFullYear();

      // NOVO FORMATO: MM/dd/yyyy
      queryValue = `${month}/${day}/${year}`;
      //console.log('DatepickerComponent: Data formatada para query (MM/dd/yyyy):', queryValue);
    } else {
      //console.log('DatepickerComponent: Data limpa, query será vazia.');
    }
    // this.query será atualizado dentro do subscribe do valueChanged
    this.valueChanged.next(queryValue);
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

}