import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { PessoaPesquisaComponent } from './pessoa-pesquisa/pessoa-pesquisa.component';
import { PessoaComponent } from './pessoa.component';
import { PessoaIudComponent } from './pessoa-iud/pessoa-iud.component';
import { PessoaPerfilFormComponent } from './pessoa-perfil/pessoa-perfil-form.component';
import { EnderecoPesquisaComponent } from './endereco/endereco-pesquisa/endereco-pesquisa.component';
import { EnderecoIudComponent } from './endereco/endereco-iud/endereco-iud.component';
import { CepInputModule } from '../cep/cep-input.module';

//import { CepInputComponent } from '../cep/cep-pesquisa/CepInputComponent';

//import { PessoaIudComponent } from './pessoa-iud/pessoa-iud.component';
//import { PessoaPerfilFormComponent } from './pessoa-iud/pessoa-perfil-form.component';
//import { PessoaContatosComponent } from './pessoa-iud/pessoa-contatos.component';
//import { PessoaDocumentosComponent } from './pessoa-iud/pessoa-documentos.component';

const routes: Routes = [{
  path: '',
  component: PessoaComponent,
  children: 
  [

    // ✅ rota padrão (evita tela em branco ao entrar em /pages/pessoas-api)
    { path: '', redirectTo: 'pessoa-pesquisa', pathMatch: 'full' },
    
    {
      path: 'pessoa-pesquisa',
      component: PessoaPesquisaComponent,
    },

    {
      path: 'cadastrar', // Para criar uma nova pessoa (carrega o container)
      component: PessoaIudComponent,
      children: [
        { path: '', redirectTo: 'perfil', pathMatch: 'full' },
        { path: 'perfil', component: PessoaPerfilFormComponent },
        { path: 'enderecos', component: EnderecoPesquisaComponent },
      ]
    },

    {
      path: 'editar/:id', // Para editar uma pessoa existente (carrega o mesmo container)
      component: PessoaIudComponent,
      children: [
        { path: '', redirectTo: 'perfil', pathMatch: 'full' },
        { path: 'perfil', component: PessoaPerfilFormComponent },
        { path: 'enderecos', component: EnderecoPesquisaComponent },
      ]
    },

  ],
}];


@NgModule({
  imports: [RouterModule.forChild(routes)],

  exports: [RouterModule,
    CepInputModule,
  ],
})

export class PessoaRoutingModule {}

export const pessoaRoutedComponents = [
  PessoaComponent,
  PessoaPesquisaComponent,
  PessoaIudComponent,
  PessoaPerfilFormComponent,
  EnderecoPesquisaComponent,
  EnderecoIudComponent,
  //CepInputComponent
];