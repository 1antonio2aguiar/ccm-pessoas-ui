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

import { cidadeRoutedComponents, CidadeRoutingModule } from './cidade-routing.module';
import { EstadoNomeEditorComponent } from './estado/EstadoNomeEditorComponent';


@NgModule({
  declarations: [
      ...cidadeRoutedComponents,
      EstadoNomeEditorComponent
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
  
      CidadeRoutingModule
    ]

})
export class CidadeModule {}
