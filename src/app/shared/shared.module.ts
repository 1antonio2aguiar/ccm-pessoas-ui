import { ReactiveFormsModule } from '@angular/forms';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BreadCrumbComponent } from './components/bread-crumb/bread-crumb.component';
import { RouterModule } from '@angular/router';
import { PageHeaderComponent } from './components/page-header/page-header.component';
import { FormFieldErrorComponent } from './components/form-field-error/form-field-error.component';
import { ServerErrorMessagesComponent } from './components/server-error-messages/server-error-messages.component';
import { MessagesModule } from 'primeng/messages';
import { MessageModule } from 'primeng/message';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { BaseResourceConfirmationComponent } from './components/base-resource-confirmation/base-resource-confirmation.component';
import { TelefonePipe } from './pipes/telefone.pipe';
import { CnpjPipe } from './pipes/cnpj.pipe';
import { CpfPipe } from './pipes/cpf.pipe';
import { SexoPipe } from './pipes/sexo.pipe';
import { SimNaoPipe } from './pipes/sim-nao.pipe';
import { CepPipe } from './pipes/cep.pipe';
import { ToastModule } from "primeng/toast";
import { LOCALE_ID } from '@angular/core';


import { OwlDateTimeModule, OwlNativeDateTimeModule } from 'ng-pick-datetime';
import { Ng2SmartTableModule } from 'ng2-smart-table';

import { ThemeModule } from '../@theme/theme.module';
import { FormsModule as ngFormsModule } from '@angular/forms';



@NgModule({
  declarations: [
  BreadCrumbComponent,
  PageHeaderComponent,
  FormFieldErrorComponent,
  ServerErrorMessagesComponent,
  TelefonePipe,
  CpfPipe,
  CnpjPipe,
  SexoPipe,
  SimNaoPipe,
  CepPipe,
  
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    BreadcrumbModule,
    MessagesModule,
    ButtonModule,
    ConfirmDialogModule,
    MessageModule,
    ToastModule,

    ThemeModule,
    Ng2SmartTableModule,
    ReactiveFormsModule,
    ngFormsModule,
    OwlDateTimeModule,
    OwlNativeDateTimeModule,
   
  ], 
  exports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MessagesModule,
    MessageModule,
    BreadCrumbComponent,
    PageHeaderComponent,
    FormFieldErrorComponent,
    ServerErrorMessagesComponent,
    TelefonePipe,
    CpfPipe,
    CnpjPipe,
    SexoPipe,
    SimNaoPipe,
    CepPipe,

    

  ]/*,
  providers:[
    { provide: LOCALE_ID, useValue: 'pt-BR' }
  ]*/
})
export class SharedModule { }
