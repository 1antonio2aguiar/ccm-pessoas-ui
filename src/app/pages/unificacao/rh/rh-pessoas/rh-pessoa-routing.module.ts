import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { RhPessoaComponent } from './rh-pessoa.component';
import { RhPessoaIudComponent } from './rh-pessoa-iud/rh-pessoa-iud.component';

const routes: Routes = [
  {
    path: '',
    component: RhPessoaComponent,
    children: [
      {
        path: '',
        redirectTo: 'rh-pessoa-iud',
        pathMatch: 'full',
      },
      {
        path: 'rh-pessoa-iud',
        component: RhPessoaIudComponent,
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class RhPessoaRoutingModule { }

export const rhPessoaRoutedComponents = [
  RhPessoaComponent,
  RhPessoaIudComponent,
];
