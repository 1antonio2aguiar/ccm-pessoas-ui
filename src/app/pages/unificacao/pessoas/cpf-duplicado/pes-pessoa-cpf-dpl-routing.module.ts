import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { PesPessoaCpfDplComponent } from './pes-pessoa-cpf-dpl.component';
import { PesPessoaCpfDplIudComponent } from './pessoa-cpf-dpl-iud/pes-pessoa-cpf-dpl-iud.component ';

const routes: Routes = [
  {
    path: '',
    component: PesPessoaCpfDplComponent,
    children: [
      {
        path: '',
        redirectTo: 'pes-pessoa-cpf-dpl-iud',
        pathMatch: 'full',
      },
      {
        path: 'pes-pessoa-cpf-dpl-iud',
        component: PesPessoaCpfDplIudComponent,
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class PesPessoaCpfDplRoutingModule { }

export const pesPessoaCpfDplRoutedComponents = [
  PesPessoaCpfDplComponent,
  PesPessoaCpfDplIudComponent
];