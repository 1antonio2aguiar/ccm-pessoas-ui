import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { CidadeUnificadoComponent } from './cidade-unificado.component';
import { CidadeUnificadoIudComponent } from './cidade-unificado-iud/cidade-unificado-iud.component';
import { CidadeCandidatosDialogComponent } from './cidade-candidatos-dialog/cidade-candidatos-dialog.component';
import { ZerarBaseDialogComponent } from './zerar-base-dialog/zerar-base-dialog.component';

const routes: Routes = [
  {
    path: '',
    component: CidadeUnificadoComponent,
    children: [
      {
        path: '',
        redirectTo: 'cidade-unificado-iud',
        pathMatch: 'full',
      },
      {
        path: 'cidade-unificado-iud',
        component: CidadeUnificadoIudComponent,
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class CidadeUnificadoRoutingModule { }

export const cidadeUnificadoRoutedComponents = [
  CidadeUnificadoComponent,
  CidadeUnificadoIudComponent,
  CidadeCandidatosDialogComponent,
  ZerarBaseDialogComponent,
];
