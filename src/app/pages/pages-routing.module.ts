import { RouterModule, Routes } from '@angular/router';
import { NgModule } from '@angular/core';

import { PagesComponent } from './pages.component';

const routes: Routes = [{
  path: '',
  component: PagesComponent,
  children: [

    {
      path: 'dashboard',
      loadChildren: () =>
        import('./dashboard/cad-unico-dashboard.module')
          .then(m => m.CadUnicoDashboardModule),
    },

    {
      path: 'bairro',
      loadChildren: () => import('./bairro/bairro.module').then(m => m.BairroModule),
    },
    
    {
      path: 'cidades',
      loadChildren: () => import('./cidades/cidade.module').then(m => m.CidadeModule),
    },

    {
      path: 'cep',
      loadChildren: () => import('./cep/cep.module').then(m => m.CepModule),
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
      path: 'pessoa',
      loadChildren: () => import('./pessoa/pessoa.module').then(m => m.PessoaModule),
    },

    {
      path: 'estabelecimento',
      loadChildren: () => import('./estabelecimento/estabelecimento.module').then(m => m.EstabelecimentoModule),
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
      path: 'unificacao/pessoas/cpf-no-nome',
      loadChildren: () =>
        import('./unificacao/pessoas/cpf-no-nome/cpf-no-nome.module') 
          .then(m => m.CpfNoNomeModule),
    },

    {
      path: 'unificacao/pessoas/pes-pessoa',
      loadChildren: () => import('./unificacao/pessoas/pes-pessoas/pes-pessoa.module').then(m => m.PesPessoaModule),
    },

    {
      path: 'unificacao/pessoas/cpf-duplicado',
      loadChildren: () => 
        import('./unificacao/pessoas/cpf-duplicado/pes-pessoa-cpf-dpl.module').then(m => m.PesPessoaCpfDplModule),
    },

    {
      path: 'unificacao/pessoas/cnpj-unico',
      loadChildren: () => 
        import('./unificacao/pessoas/cnpj-unico/cnpj-unico.module').then(m => m.CnpjUnicoModule),
    },

    {
      path: 'unificacao/pessoas/cnpj-duplicado',
      loadChildren: () => 
        import('./unificacao/pessoas/cnpj-duplicado/pes-pessoa-cnpj-dpl.module').then(m => m.PesPessoaCnpjDplModule),
    },

    {
      path: 'unificacao/rh',
      loadChildren: () =>
        import('./unificacao/rh/rh-pessoas/rh-pessoa.module')
          .then(m => m.RhPessoaModule),
    }, 

     {
      path: 'unificacao/saneamento',
      loadChildren: () =>
        import('./unificacao/saneamento/sane-pessoa.module')
          .then(m => m.SanePessoaModule),
    },

    {
      path: 'unificacao/enderecos/cidades',
      loadChildren: () =>
        import('./unificacao/enderecos/cidades/cidade-unificado.module')
          .then(m => m.CidadeUnificadoModule),
    },

    {
      path: 'unificacao/enderecos/distritos',
      loadChildren: () =>
        import('./unificacao/enderecos/distritos/distrito-unificado.module')
          .then(m => m.DistritoUnificadoModule),
    },

    {
      path: 'unificacao/enderecos/bairros',
      loadChildren: () =>
        import('./unificacao/enderecos/bairros/bairro-unificado.module')
          .then(m => m.BairroUnificadoModule),
    },

    {
      path: 'unificacao/enderecos/logradouros',
      loadChildren: () =>
        import('./unificacao/enderecos/logradouros/logradouro-unificado.module')
          .then(m => m.LogradouroUnificadoModule),
    },

    {
      path: 'unificacao/enderecos/consolidacao',
      loadChildren: () =>
        import('./unificacao/enderecos/consolidacao/consolidacao-enderecos.module')
          .then(m => m.ConsolidacaoEnderecosModule),
    },

    {
      path: 'unificacao/enderecos/carga-final',
      loadChildren: () =>
        import('./unificacao/enderecos/carga-final/carga-final-enderecos.module')
          .then(m => m.CargaFinalEnderecosModule),
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
