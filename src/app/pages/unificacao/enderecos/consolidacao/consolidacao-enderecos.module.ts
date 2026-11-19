import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ThemeModule } from '../../../../@theme/theme.module';

import { FormsModule as ngFormsModule } from '@angular/forms';

import {
  NbButtonModule,
  NbCardModule,
  NbIconModule,
  NbToastrModule,
} from '@nebular/theme';

import {
  ConsolidacaoEnderecosRoutingModule,
  consolidacaoEnderecosRoutedComponents,
} from './consolidacao-enderecos-routing.module';

@NgModule({
  declarations: [
    ...consolidacaoEnderecosRoutedComponents,
  ],
  imports: [
    CommonModule,
    NbCardModule,
    NbIconModule,
    ThemeModule,
    NbButtonModule,
    ngFormsModule,
    NbToastrModule.forRoot(),

    ConsolidacaoEnderecosRoutingModule,
  ],
})
export class ConsolidacaoEnderecosModule {}
