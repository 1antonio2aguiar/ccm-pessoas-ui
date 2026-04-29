import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { PesPessoaCnpjDplComponent } from './pes-pessoa-cnpj-dpl.component';
import { PesPessoaCnpjDplIudComponent } from './pessoa-cnpj-dpl-iud/pes-pessoa-cnpj-dpl-iud.component';

const routes: Routes = [
  {
    path: '',
    component: PesPessoaCnpjDplComponent,
    children: [
      { path: '', redirectTo: 'pes-pessoa-cnpj-dpl-iud', pathMatch: 'full' },
      { path: 'pes-pessoa-cnpj-dpl-iud', component: PesPessoaCnpjDplIudComponent },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class PesPessoaCnpjDplRoutingModule { }

export const pesPessoaCnpjDplRoutedComponents = [
  PesPessoaCnpjDplComponent,
  PesPessoaCnpjDplIudComponent,
];
