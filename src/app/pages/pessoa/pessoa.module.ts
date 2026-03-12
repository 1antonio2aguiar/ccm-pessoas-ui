import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { Ng2SmartTableModule } from 'ng2-smart-table';
import { ThemeModule } from '../../@theme/theme.module';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { NbSidebarModule, } from '@nebular/theme';
import { OwlDateTimeModule, OwlNativeDateTimeModule } from 'ng-pick-datetime';
//import { FormsRoutingModule } from '../forms/forms-routing.module';
import { NbMomentDateModule } from '@nebular/moment'; // Apenas o módulo

import { pessoaRoutedComponents } from './pessoa-routing.module';
import { PessoaRoutingModule } from './pessoa-routing.module';
import { MeuSharedModule } from '../../shared/meu-shared.module';

import { 
  NbAutocompleteModule,
  NbActionsModule,
  NbButtonModule,
  NbCardModule,
  NbCheckboxModule,
  NbDatepickerModule, 
  NbIconModule,
  NbInputModule,
  NbLayoutModule,         
  NbMenuModule,           
  NbRadioModule,
  NbSelectModule,
  NbSpinnerModule,
  NbTreeGridModule,       
  NbUserModule,
  NbButtonGroupModule, 
  NbDialogModule ,
} from '@nebular/theme';
import { MaskFormatterDirective } from '../../shared/directives/mask-formatter.directive';
import { ConfirmDeleteComponent } from '../components/base-resource-confirmation-delete/confirm-delete-modal.component';

@NgModule({
  declarations: [
    ...pessoaRoutedComponents, 
    MaskFormatterDirective,
    ConfirmDeleteComponent,
  ],

  imports: [
    CommonModule,
    FormsModule,
    ThemeModule,
    NbCardModule,
    NbTreeGridModule,
    NbIconModule,
    NbInputModule,
    Ng2SmartTableModule,
    ReactiveFormsModule,
    OwlDateTimeModule,
    OwlNativeDateTimeModule,
    NbButtonModule,
    NbButtonGroupModule,
    NbActionsModule,
    NbUserModule,
    NbCheckboxModule,
    NbRadioModule,
    NbDatepickerModule,
    NbSelectModule,
    NbSidebarModule,
    //FormsRoutingModule,
    NbDialogModule.forChild(),
    NbMomentDateModule,
    NbSpinnerModule,
    NbLayoutModule,      
    NbMenuModule,
    NbAutocompleteModule,
    
    PessoaRoutingModule,
    MeuSharedModule,
  ],

})

export class PessoaModule { }
