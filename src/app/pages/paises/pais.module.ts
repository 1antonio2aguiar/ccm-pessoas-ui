
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Ng2SmartTableModule } from 'ng2-smart-table';
import { ThemeModule } from '../../@theme/theme.module';

import { FormsModule as ngFormsModule } from '@angular/forms';

import { paisRoutedComponents } from './pais-routing.module';
import { PaisRoutingModule } from './pais-routing.module';

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
  NbToastrModule ,
  NbButtonGroupModule,
} from '@nebular/theme';

@NgModule({
  declarations: [
    ...paisRoutedComponents,
    
  ],
  imports: [
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
    NbToastrModule.forRoot() ,

    PaisRoutingModule
  ]
})

export class PaisesModule { }
