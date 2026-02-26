import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Ng2SmartTableModule } from 'ng2-smart-table';
import { ThemeModule } from '../../@theme/theme.module';

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
} from '@nebular/theme';

import { cepRoutedComponents, CepRoutingModule } from './cep-routing.module';
import { BuscaCidadeDistritoComponent } from './distrito/BuscaCidadeDistritoComponent';
import { BuscaLogradouroPorCidadeComponent } from './logradouro/BuscaLogradouroPorCidadeComponent';
import { BuscaBairroPorCidadeComponent } from './bairro/BuscaBairroPorCidadeComponent';
import { CepEditorComponent } from './cep-pesquisa/CepEditorComponent';


@NgModule({
  declarations: [
    ...cepRoutedComponents,
    BuscaCidadeDistritoComponent,
    BuscaLogradouroPorCidadeComponent,
    BuscaBairroPorCidadeComponent,
    CepEditorComponent
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
    
        ReactiveFormsModule,
        NbInputModule,

    CepRoutingModule,

  ]
})

export class CepModule { }
