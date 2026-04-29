import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { CnpjUnicoComponent } from './cnpj-unico.component';
import { CnpjUnicoIudComponent } from './cnpj-unico-iud/cnpj-unico-iud.component';

const routes: Routes = [
  {
    path: '',
    component: CnpjUnicoComponent,
    children: [
      {
        path: '',
        redirectTo: 'cnpj-unico-iud',
        pathMatch: 'full',
      },
      {
        path: 'cnpj-unico-iud',
        component: CnpjUnicoIudComponent,
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class CnpjUnicoRoutingModule { }

export const cnpjUnicoRoutedComponents = [
  CnpjUnicoComponent,
  CnpjUnicoIudComponent,
];
