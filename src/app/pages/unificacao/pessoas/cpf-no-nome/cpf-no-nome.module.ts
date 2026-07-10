import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Ng2SmartTableModule } from 'ng2-smart-table';
import { ThemeModule } from '../../../../@theme/theme.module';

import { FormsModule as ngFormsModule, ReactiveFormsModule } from '@angular/forms';

import {
  NbButtonModule,
  NbCardModule,
  NbIconModule,
  NbInputModule,
  NbToastrModule,
} from '@nebular/theme';

import {
  CpfNoNomeRoutingModule,
  cpfNoNomeRoutedComponents,
} from './cpf-no-nome-routing.module';

@NgModule({
  declarations: [
    ...cpfNoNomeRoutedComponents,
  ],
  imports: [
    CommonModule,
    NbCardModule,
    NbIconModule,
    NbInputModule,
    ThemeModule,
    Ng2SmartTableModule,
    NbButtonModule,
    ngFormsModule,
    NbToastrModule.forRoot(),
    ReactiveFormsModule,
    
    CpfNoNomeRoutingModule,
  ],
})

export class CpfNoNomeModule {
}
