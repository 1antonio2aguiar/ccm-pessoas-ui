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
  CargaFinalEnderecosRoutingModule,
  cargaFinalEnderecosRoutedComponents,
} from './carga-final-enderecos-routing.module';

@NgModule({
  declarations: [
    ...cargaFinalEnderecosRoutedComponents,
  ],
  imports: [
    CommonModule,
    NbCardModule,
    NbIconModule,
    ThemeModule,
    NbButtonModule,
    ngFormsModule,
    NbToastrModule.forRoot(),

    CargaFinalEnderecosRoutingModule,
  ],
})
export class CargaFinalEnderecosModule {}
