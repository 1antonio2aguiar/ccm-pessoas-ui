import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { BairroComponent } from './bairro.component';
import { BairroIudComponent } from './bairro-iud/bairro-iud.component';

const routes: Routes = [{
  path: '',
  component: BairroComponent,
  children: [
    {
      path: 'bairro-iud',
      component: BairroIudComponent,
    },
  ],
}];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class BairroRoutingModule { }

export const bairroRoutedComponents = [
  BairroComponent,
  BairroIudComponent,
];
