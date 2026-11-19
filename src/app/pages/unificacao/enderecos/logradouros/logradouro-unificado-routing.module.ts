import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { LogradouroUnificadoComponent } from './logradouro-unificado.component';
import { LogradouroUnificadoIudComponent } from './logradouro-unificado-iud/logradouro-unificado-iud.component';
import { LogradouroCandidatosDialogComponent } from './logradouro-candidatos-dialog/logradouro-candidatos-dialog.component';
import { ZerarBaseLogradourosDialogComponent } from './zerar-base-logradouros-dialog/zerar-base-logradouros-dialog.component';

const routes: Routes = [
  {
    path: '',
    component: LogradouroUnificadoComponent,
    children: [
      {
        path: '',
        redirectTo: 'logradouro-unificado-iud',
        pathMatch: 'full',
      },
      {
        path: 'logradouro-unificado-iud',
        component: LogradouroUnificadoIudComponent,
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class LogradouroUnificadoRoutingModule { }

export const logradouroUnificadoRoutedComponents = [
  LogradouroUnificadoComponent,
  LogradouroUnificadoIudComponent,
  LogradouroCandidatosDialogComponent,
  ZerarBaseLogradourosDialogComponent,
];
