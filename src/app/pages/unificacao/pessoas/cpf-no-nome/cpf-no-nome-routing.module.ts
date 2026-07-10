import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { CpfNoNomeComponent } from './cpf-no-nome.component';
import { CpfNoNomeIudComponent } from './cpf-no-nome-iud/cpf-no-nome-iud.component';

const routes: Routes = [
  {
    path: '',
    component: CpfNoNomeComponent,
    children: [
      {
        path: '',
        redirectTo: 'cpf-no-nome-iud',
        pathMatch: 'full',
      },
      {
        path: 'cpf-no-nome-iud',
        component: CpfNoNomeIudComponent,
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})

export class CpfNoNomeRoutingModule {}

export const cpfNoNomeRoutedComponents = [
  CpfNoNomeComponent,
  CpfNoNomeIudComponent,
]; 