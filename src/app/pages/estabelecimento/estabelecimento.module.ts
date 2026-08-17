import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import {
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';

import { Ng2SmartTableModule } from 'ng2-smart-table';

import {
  NbActionsModule,
  NbAutocompleteModule,
  NbButtonModule,
  NbCardModule,
  NbCheckboxModule,
  NbDialogModule,
  NbIconModule,
  NbInputModule,
  NbLayoutModule,
  NbMenuModule,
  NbRadioModule,
  NbSelectModule,
  NbSpinnerModule,
  NbTreeGridModule,
  NbUserModule,
} from '@nebular/theme';

import {
  ThemeModule,
} from '../../@theme/theme.module';

import {
  MeuSharedModule,
} from '../../shared/meu-shared.module';

import {
  CepInputModule,
} from '../cep/cep-input.module';

import {
  EstabelecimentoRoutingModule,
  estabelecimentoRoutedComponents,
} from './estabelecimento-routing.module';

@NgModule({
  declarations: [
    ...estabelecimentoRoutedComponents,
  ],

  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,

    ThemeModule,
    MeuSharedModule,

    Ng2SmartTableModule,

    NbActionsModule,
    NbAutocompleteModule,
    NbButtonModule,
    NbCardModule,
    NbCheckboxModule,
    NbDialogModule.forChild(),
    NbIconModule,
    NbInputModule,
    NbLayoutModule,
    NbMenuModule,
    NbRadioModule,
    NbSelectModule,
    NbSpinnerModule,
    NbTreeGridModule,
    NbUserModule,

    CepInputModule,
    EstabelecimentoRoutingModule,
  ],
})
export class EstabelecimentoModule {
}