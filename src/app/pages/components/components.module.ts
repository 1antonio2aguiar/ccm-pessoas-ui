import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { NbThemeModule } from '@nebular/theme';

import { OwlDateTimeModule, OwlNativeDateTimeModule } from 'ng-pick-datetime';
import { Ng2SmartTableModule } from 'ng2-smart-table';
import { ThemeModule } from '../../@theme/theme.module';
import { FormsModule as ngFormsModule } from '@angular/forms';
import { FormsRoutingModule } from '../forms/forms-routing.module';


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

//import { PessoasComponent } from './pessoas/pessoas-busca/pessoas.component';
import { ConfirmDeleteComponent } from './base-resource-confirmation-delete/confirm-delete-modal.component';
import { ConfirmationDialogComponent } from './base-resource-confirmation-delete/confirmation-dialog/confirmation-dialog.component';

@NgModule({
  declarations: [
    ConfirmDeleteComponent,
    ConfirmationDialogComponent,
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

    FormsRoutingModule,
  ]
})

export class EquipesModule { }

