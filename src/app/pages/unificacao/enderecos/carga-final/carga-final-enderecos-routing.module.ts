import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { CargaFinalEnderecosComponent } from './carga-final-enderecos.component';
import { CargaFinalEnderecosIudComponent } from './carga-final-enderecos-iud/carga-final-enderecos-iud.component';

const routes: Routes = [
  {
    path: '',
    component: CargaFinalEnderecosComponent,
    children: [
      {
        path: '',
        redirectTo: 'carga-final-enderecos-iud',
        pathMatch: 'full',
      },
      {
        path: 'carga-final-enderecos-iud',
        component: CargaFinalEnderecosIudComponent,
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class CargaFinalEnderecosRoutingModule { }

export const cargaFinalEnderecosRoutedComponents = [
  CargaFinalEnderecosComponent,
  CargaFinalEnderecosIudComponent,
];
