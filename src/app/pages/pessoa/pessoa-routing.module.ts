import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { PessoaPesquisaComponent } from './pessoa-pesquisa/pessoa-pesquisa.component';
import { PessoaComponent } from './pessoa.component';
import { PessoaIudComponent } from './pessoa-iud/pessoa-iud.component';
import { PessoaPerfilFormComponent } from './pessoa-perfil/pessoa-perfil-form.component';
import { EnderecoPesquisaComponent } from './endereco/endereco-pesquisa/endereco-pesquisa.component';
import { EnderecoIudComponent } from './endereco/endereco-iud/endereco-iud.component';
import { CepInputModule } from '../cep/cep-input.module';
import { ContatoPesquisaComponent } from './contato/contato-pesquisa/contato-pesquisa.component';
import { ContatoIudComponent } from './contato/contato-iud/contato-iud.component';
import { DocumentoPesquisaComponent } from './documento/documento-pesquisa/documento-pesquisa.component';
import { DocumentoIudComponent } from './documento/documento-iud/documento-iud.component';
import { OrigemPesquisaComponent } from './origem/origem-pesquisa/origem-pesquisa.component';

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
        { path: 'contatos', component: ContatoPesquisaComponent },
        { path: 'documentos', component: DocumentoPesquisaComponent },
        { path: 'origem', component: OrigemPesquisaComponent },
      ]
    },

    {
      path: 'editar/:id', // Para editar uma pessoa existente (carrega o mesmo container)
      component: PessoaIudComponent,
      children: [
        { path: '', redirectTo: 'perfil', pathMatch: 'full' },
        { path: 'perfil', component: PessoaPerfilFormComponent },
        { path: 'enderecos', component: EnderecoPesquisaComponent },
        { path: 'contatos', component: ContatoPesquisaComponent },
        { path: 'documentos', component: DocumentoPesquisaComponent },
        { path: 'origem', component: OrigemPesquisaComponent },
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
  ContatoPesquisaComponent,
  ContatoIudComponent,
  DocumentoPesquisaComponent,
  DocumentoIudComponent,
  OrigemPesquisaComponent
];