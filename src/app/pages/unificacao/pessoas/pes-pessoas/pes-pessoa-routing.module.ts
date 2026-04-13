import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { PesPessoaComponent } from './pes-pessoa.component';
import { PesPessoaIudComponent } from './pes-pessoa-iud/pes-pessoa-iud.component';

const routes: Routes = [
  {
    path: '',
    component: PesPessoaComponent,
    children: [
      {
        path: '',
        redirectTo: 'pes-pessoa-iud',
        pathMatch: 'full',
      },
      {
        path: 'pes-pessoa-iud',
        component: PesPessoaIudComponent,
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class PesPessoaRoutingModule { }

export const pesPessoaRoutedComponents = [
  PesPessoaComponent,
  PesPessoaIudComponent,
];