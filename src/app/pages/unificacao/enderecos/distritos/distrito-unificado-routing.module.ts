import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { DistritoUnificadoComponent } from './distrito-unificado.component';
import { DistritoUnificadoIudComponent } from './distrito-unificado-iud/distrito-unificado-iud.component';
import { DistritoCandidatosDialogComponent } from './distrito-candidatos-dialog/distrito-candidatos-dialog.component';
import { ZerarBaseDistritosDialogComponent } from './zerar-base-distritos-dialog/zerar-base-distritos-dialog.component';

const routes: Routes = [
  {
    path: '',
    component: DistritoUnificadoComponent,
    children: [
      {
        path: '',
        redirectTo: 'distrito-unificado-iud',
        pathMatch: 'full',
      },
      {
        path: 'distrito-unificado-iud',
        component: DistritoUnificadoIudComponent,
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class DistritoUnificadoRoutingModule { }

export const distritoUnificadoRoutedComponents = [
  DistritoUnificadoComponent,
  DistritoUnificadoIudComponent,
  DistritoCandidatosDialogComponent,
  ZerarBaseDistritosDialogComponent,
];
