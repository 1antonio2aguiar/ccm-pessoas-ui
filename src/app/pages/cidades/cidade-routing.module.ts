import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { CidadeComponent } from './cidade.component';
import { CidadeIudComponent } from './cidade-iud/cidade-iud.component';

const routes: Routes = [{
  path: '',
  component: CidadeComponent,
  children: [
    {
      path: 'cidade-iud',
      component: CidadeIudComponent,
    },
  ],
}]; 

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class CidadeRoutingModule { }

export const cidadeRoutedComponents = [
  CidadeComponent,
  CidadeIudComponent
];
