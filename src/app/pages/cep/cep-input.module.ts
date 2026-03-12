import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { NbInputModule, NbToastrModule } from '@nebular/theme';

import { CepInputComponent } from './cep-pesquisa/CepInputComponent';

@NgModule({
  declarations: [CepInputComponent],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NbInputModule,
    NbToastrModule,
  ],
  exports: [CepInputComponent],
})
export class CepInputModule {}