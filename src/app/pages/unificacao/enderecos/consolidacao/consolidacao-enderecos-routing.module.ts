import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ConsolidacaoEnderecosComponent } from './consolidacao-enderecos.component';
import { ConsolidacaoEnderecosIudComponent } from './consolidacao-enderecos-iud/consolidacao-enderecos-iud.component';

const routes: Routes = [
  {
    path: '',
    component: ConsolidacaoEnderecosComponent,
    children: [
      {
        path: '',
        redirectTo: 'consolidacao-enderecos-iud',
        pathMatch: 'full',
      },
      {
        path: 'consolidacao-enderecos-iud',
        component: ConsolidacaoEnderecosIudComponent,
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ConsolidacaoEnderecosRoutingModule { }

export const consolidacaoEnderecosRoutedComponents = [
  ConsolidacaoEnderecosComponent,
  ConsolidacaoEnderecosIudComponent,
];
