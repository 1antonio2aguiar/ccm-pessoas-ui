import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import {
  NbButtonModule,
  NbCardModule,
} from '@nebular/theme';

import {
  ConfirmarUnificacaoDialogComponent,
} from './confirmar-unificacao-dialog.component';

@NgModule({
  declarations: [
    ConfirmarUnificacaoDialogComponent,
  ],
  imports: [
    CommonModule,
    NbCardModule,
    NbButtonModule,
  ],
  exports: [
    ConfirmarUnificacaoDialogComponent,
  ],
})
export class ConfirmarUnificacaoDialogModule {}