import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { LogradouroComponent } from './logradouro.component';
import { LogradouroIudComponent } from './logradouro-iud/logradouro-iud.component';

const routes: Routes = [
  {
    path: '',
    component: LogradouroComponent,
    children: [
      {
        path: 'logradouro-iud',
        component: LogradouroIudComponent,
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class LogradouroRoutingModule {}

export const logradouroRoutedComponents = [
  LogradouroComponent,
  LogradouroIudComponent,
];
