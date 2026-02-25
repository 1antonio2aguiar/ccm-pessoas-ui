import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { TipoLogradouroComponent } from './tipo-logradouro.component';
import { TipoLogradouroIudComponent } from './tipo-logradouro-iud/tipo-logradouro-iud.component';

const routes: Routes = [{
  path: '',
  component: TipoLogradouroComponent,
  children: [
    {
      path: 'tipo-logradouro-iud',
      component: TipoLogradouroIudComponent,
    },
  ],
}];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class TipoLogradouroRoutingModule { }

export const tipoLogradouroRoutedComponents = [
  TipoLogradouroComponent,
  TipoLogradouroIudComponent,
];
