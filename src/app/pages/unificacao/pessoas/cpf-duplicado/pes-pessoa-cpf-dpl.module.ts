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
  NbDatepickerModule,
  NbTreeGridModule,
  NbIconModule,
  NbInputModule,
  NbRadioModule,
  NbSelectModule,
  NbUserModule,
  NbToastrModule,
  NbButtonGroupModule,
  NbProgressBarModule
} from '@nebular/theme';

import { pesPessoaCpfDplRoutedComponents } from './pes-pessoa-cpf-dpl-routing.module';
import { PesPessoaCpfDplRoutingModule } from './pes-pessoa-cpf-dpl-routing.module';


@NgModule({
  declarations: [
    ...pesPessoaCpfDplRoutedComponents
  ],
  imports: [
    CommonModule,
    NbCardModule,
    NbTreeGridModule,
    NbIconModule,
    NbInputModule,
    ThemeModule,
    Ng2SmartTableModule,
    NbButtonModule,
    NbButtonGroupModule,
    NbActionsModule,
    NbUserModule,
    NbCheckboxModule,
    NbRadioModule,
    NbDatepickerModule,
    NbSelectModule,
    ngFormsModule,
    NbToastrModule.forRoot(),
    NbProgressBarModule,

    ReactiveFormsModule,
    NbInputModule,

    PesPessoaCpfDplRoutingModule,
  ],
})
export class PesPessoaCpfDplModule {}
