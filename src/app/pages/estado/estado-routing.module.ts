import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { EstadoComponent } from './estado.component';
import { EstadoIudComponent } from './estado-iud/estado-iud.component';

const routes: Routes = [{
  path: '',
  component: EstadoComponent,
  children: [
    {
      path: 'estado-iud',
      component: EstadoIudComponent,
    },
  ],
}];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class EstadoRoutingModule { }

export const estadoRoutedComponents = [
  EstadoComponent,
  EstadoIudComponent
];
