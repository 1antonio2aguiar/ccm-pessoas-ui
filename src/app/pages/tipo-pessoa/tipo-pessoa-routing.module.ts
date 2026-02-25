import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { TipoPessoaComponent } from './tipo-pessoa.component';
import { TipoPessoaIudComponent } from './tipo-pessoa-iud/tipo-pessoa-iud.component';

const routes: Routes = [{
  path: '',
  component: TipoPessoaComponent,
  children: [
    {
      path: 'tipo-pessoa-iud',
      component: TipoPessoaIudComponent,
    },
  ],
}];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class TipoPessoaRoutingModule { }

export const tipoPessoaRoutedComponents = [
  TipoPessoaComponent,
  TipoPessoaIudComponent
];
