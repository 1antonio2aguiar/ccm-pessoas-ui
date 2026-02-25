import { RouterModule, Routes } from '@angular/router';
import { NgModule } from '@angular/core';

import { PagesComponent } from './pages.component';

const routes: Routes = [{
  path: '',
  component: PagesComponent,
  children: [

    {
      path: 'bairro',
      loadChildren: () => import('./bairro/bairro.module').then(m => m.BairroModule),
    },
    
    {
      path: 'cidades',
      loadChildren: () => import('./cidades/cidade.module').then(m => m.CidadeModule),
    },

    {
      path: 'distrito',
      loadChildren: () => import('./distrito/distrito.module').then(m => m.DistritoModule),
    },
    
    {
      path: 'estado',
      loadChildren: () => import('./estado/estado.module').then(m => m.EstadoModule),
    },

    {
      path: 'logradouro',
      loadChildren: () => import('./logradouro/logradouro.module')
        .then(m => m.LogradouroModule),
    },

    {
      path: 'paises',
      loadChildren: () => import('./paises/pais.module').then(m => m.PaisesModule),
    },

    {
      path: 'tipo-logradouro',
      loadChildren: () => import('./tipo-logradouro/tipo-logradouro.module').then(m => m.TipoLogradouroModule),
    },

    {
      path: 'tipo-pessoa',
      loadChildren: () => import('./tipo-pessoa/tipo-pessoa.module').then(m => m.TipoPessoaModule),
    },
    
    {
      path: '',
      redirectTo: 'dashboard',
      pathMatch: 'full',
    },
    
  ],
}];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})

export class PagesRoutingModule {
}
