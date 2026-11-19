import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { BairroUnificadoComponent } from './bairro-unificado.component';
import { BairroUnificadoIudComponent } from './bairro-unificado-iud/bairro-unificado-iud.component';
import { BairroCandidatosDialogComponent } from './bairro-candidatos-dialog/bairro-candidatos-dialog.component';
import { ZerarBaseBairrosDialogComponent } from './zerar-base-bairros-dialog/zerar-base-bairros-dialog.component';

const routes: Routes = [
  {
    path: '',
    component: BairroUnificadoComponent,
    children: [
      {
        path: '',
        redirectTo: 'bairro-unificado-iud',
        pathMatch: 'full',
      },
      {
        path: 'bairro-unificado-iud',
        component: BairroUnificadoIudComponent,
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class BairroUnificadoRoutingModule { }

export const bairroUnificadoRoutedComponents = [
  BairroUnificadoComponent,
  BairroUnificadoIudComponent,
  BairroCandidatosDialogComponent,
  ZerarBaseBairrosDialogComponent,
];
