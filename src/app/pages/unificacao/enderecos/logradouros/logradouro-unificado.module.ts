import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Ng2SmartTableModule } from 'ng2-smart-table';
import { ThemeModule } from '../../../../@theme/theme.module';

import { FormsModule as ngFormsModule, ReactiveFormsModule } from '@angular/forms';

import {
  NbActionsModule,
  NbButtonModule,
  NbCardModule,
  NbCheckboxModule,
  NbIconModule,
  NbInputModule,
  NbSelectModule,
  NbToastrModule,
  NbButtonGroupModule,
  NbProgressBarModule,
} from '@nebular/theme';

import {
  LogradouroUnificadoRoutingModule,
  logradouroUnificadoRoutedComponents,
} from './logradouro-unificado-routing.module';

@NgModule({
  declarations: [
    ...logradouroUnificadoRoutedComponents,
  ],
  imports: [
    CommonModule,
    NbCardModule,
    NbCheckboxModule,
    NbIconModule,
    NbInputModule,
    ThemeModule,
    Ng2SmartTableModule,
    NbButtonModule,
    NbButtonGroupModule,
    NbActionsModule,
    NbSelectModule,
    ngFormsModule,
    NbToastrModule.forRoot(),
    NbProgressBarModule,

    ReactiveFormsModule,

    LogradouroUnificadoRoutingModule,
  ],
})
export class LogradouroUnificadoModule {}
