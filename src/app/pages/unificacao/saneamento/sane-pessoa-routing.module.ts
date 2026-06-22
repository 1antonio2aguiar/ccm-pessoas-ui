import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { SaneCpfUnicoComponent } from '../saneamento/cpf-unico/sane-cpf-unico.component';
import { SanePessoaIudComponent } from '../saneamento/sane-pessoa.component';
import { SaneCnpjUnicoComponent } from './cnpj-unico/sane-cnpj-unico.component';

const routes: Routes = [
  {
    path: '',
    component: SanePessoaIudComponent,
    children: [
      {
        path: '',
        redirectTo: 'sane-pessoa-iud',
        pathMatch: 'full',
      },
      {
        path: 'sane-pessoa-iud',
        component: SaneCpfUnicoComponent,
      },
      {
        path: 'sane-cnpj-unico',
        component: SaneCnpjUnicoComponent,
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class SanePessoaRoutingModule { }

export const sanePessoaRoutedComponents = [
  SaneCpfUnicoComponent,
  SaneCnpjUnicoComponent,
  SanePessoaIudComponent,
];
