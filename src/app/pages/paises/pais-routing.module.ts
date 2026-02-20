import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { PaisComponent } from './pais.component';
import { PaisIudComponent } from './pais-iud/pais-iud.component';
import { ConfirmationDialogComponent } from '../components/base-resource-confirmation-delete/confirmation-dialog/confirmation-dialog.component';

const routes: Routes = [{
  path: '',
  component: PaisComponent,
  children: [
    {
      path: 'pais-iud',
      component: PaisIudComponent,
    },
  ],
}];


@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})

export class PaisRoutingModule { }

export const paisRoutedComponents = [
  PaisComponent,
  PaisIudComponent,
  ConfirmationDialogComponent
];
