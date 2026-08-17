import { NgModule } from '@angular/core';
import {
  RouterModule,
  Routes,
} from '@angular/router';

import {
  EstabelecimentoComponent,
} from './estabelecimento.component';

import {
  EstabelecimentoPesquisaComponent,
} from './estabelecimento-pesquisa/estabelecimento-pesquisa.component';

import {
  EstabelecimentoIudComponent,
} from './estabelecimento-iud/estabelecimento-iud.component';

import {
  EstabelecimentoPerfilFormComponent,
} from './estabelecimento-perfil/estabelecimento-perfil-form.component';

import {
  EstabelecimentoEnderecoPesquisaComponent,
} from './endereco/endereco-pesquisa/estabelecimento-endereco-pesquisa.component';
import {
  EstabelecimentoEnderecoIudComponent,
} from './endereco/endereco-iud/estabelecimento-endereco-iud.component';
import {
  EstabelecimentoContatoPesquisaComponent,
} from './contato/contato-pesquisa/estabelecimento-contato-pesquisa.component';
import {
  EstabelecimentoContatoIudComponent,
} from './contato/contato-iud/estabelecimento-contato-iud.component';
import {
  EstabelecimentoDocumentoPesquisaComponent,
} from './documento/documento-pesquisa/estabelecimento-documento-pesquisa.component';
import {
  EstabelecimentoDocumentoIudComponent,
} from './documento/documento-iud/estabelecimento-documento-iud.component';

const routes: Routes = [
  {
    path: '',
    component: EstabelecimentoComponent,
    children: [
      {
        path: '',
        redirectTo: 'estabelecimento-pesquisa',
        pathMatch: 'full',
      },

      {
        path: 'estabelecimento-pesquisa',
        component: EstabelecimentoPesquisaComponent,
      },

      {
        path: 'cadastrar',
        component: EstabelecimentoIudComponent,
        children: [
          {
            path: '',
            redirectTo: 'perfil',
            pathMatch: 'full',
          },
          {
            path: 'perfil',
            component: EstabelecimentoPerfilFormComponent,
          },
        ],
      },

      {
        path: 'editar/:id',
        component: EstabelecimentoIudComponent,
        children: [
          {
            path: '',
            redirectTo: 'perfil',
            pathMatch: 'full',
          },
          {
            path: 'perfil',
            component: EstabelecimentoPerfilFormComponent,
          },
          {
            path: 'enderecos',
            component: EstabelecimentoEnderecoPesquisaComponent,
          },
          {
            path: 'contatos',
            component: EstabelecimentoContatoPesquisaComponent,
          },
          {
            path: 'documentos',
            component: EstabelecimentoDocumentoPesquisaComponent,
          },
        ],
      },
    ],
  },
];

@NgModule({
  imports: [
    RouterModule.forChild(routes),
  ],

  exports: [
    RouterModule,
  ],
})
export class EstabelecimentoRoutingModule {
}

export const estabelecimentoRoutedComponents = [
  EstabelecimentoComponent,
  EstabelecimentoPesquisaComponent,
  EstabelecimentoIudComponent,
  EstabelecimentoPerfilFormComponent,
  EstabelecimentoEnderecoPesquisaComponent,
  EstabelecimentoEnderecoIudComponent,
  EstabelecimentoContatoPesquisaComponent,
  EstabelecimentoContatoIudComponent,
  EstabelecimentoDocumentoPesquisaComponent,
  EstabelecimentoDocumentoIudComponent,
];
