import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { DistritoComponent } from './distrito.component';
import { DistritoIudComponent } from './distrito-iud/distrito-iud.component';

const routes: Routes = [{
  path: '',
  component: DistritoComponent,
  children: [
    {
      path: 'distrito-iud',
      component: DistritoIudComponent,
    },
  ],
}];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class DistritoRoutingModule { }

export const distritoRoutedComponents = [
  DistritoComponent,
  DistritoIudComponent,
];
