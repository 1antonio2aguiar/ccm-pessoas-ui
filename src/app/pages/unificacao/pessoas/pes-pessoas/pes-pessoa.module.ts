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

import { pesPessoaRoutedComponents } from './pes-pessoa-routing.module';
import { PesPessoaRoutingModule } from './pes-pessoa-routing.module';
import {
  ConfirmarUnificacaoDialogModule,
} from '../../../../shared/components/confirmar-unificacao-dialog/confirmar-unificacao-dialog.module';

@NgModule({
  declarations: [
    ...pesPessoaRoutedComponents
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

    PesPessoaRoutingModule,
    ConfirmarUnificacaoDialogModule,
  ],
})
export class PesPessoaModule {}
