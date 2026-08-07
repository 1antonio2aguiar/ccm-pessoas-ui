import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Ng2SmartTableModule } from 'ng2-smart-table';
import { ThemeModule } from '../../../../@theme/theme.module';

import { FormsModule as ngFormsModule, ReactiveFormsModule } from '@angular/forms';
import {
  ConfirmarUnificacaoDialogModule,
} from '../../../../shared/components/confirmar-unificacao-dialog/confirmar-unificacao-dialog.module';


import {
  NbActionsModule,
  NbButtonModule,
  NbCardModule,
  NbCheckboxModule,
  NbDatepickerModule,
  NbDialogModule,
  NbTreeGridModule,
  NbIconModule,
  NbInputModule,
  NbRadioModule,
  NbSelectModule,
  NbUserModule,
  NbToastrModule,
  NbButtonGroupModule,
  NbProgressBarModule,
  
} from '@nebular/theme';

import { rhPessoaRoutedComponents } from './rh-pessoa-routing.module';
import { RhPessoaRoutingModule } from './rh-pessoa-routing.module';

@NgModule({
  declarations: [
    ...rhPessoaRoutedComponents
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

    RhPessoaRoutingModule,
    ConfirmarUnificacaoDialogModule,
  ],
})
export class RhPessoaModule {}
