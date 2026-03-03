import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CepComponent } from './cep.component';
import { CepPesquisaComponent } from './cep-pesquisa/cep-pesquisa.component';
import { CepIudComponent } from './cep-iud/cep-iud.component';
import { CepInputComponent } from './cep-pesquisa/CepInputComponent';

const routes: Routes = [{
  path: '',
  component: CepComponent,
  children: [{
    path: 'cep-pesquisa',
    component: CepPesquisaComponent,
  },],
}];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})

export class CepRoutingModule { }

export const cepRoutedComponents = [
  CepComponent,
  CepPesquisaComponent,
  CepIudComponent,
  CepInputComponent
];
