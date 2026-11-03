import { NbMenuItem } from '@nebular/theme';

export const MENU_ITEMS: NbMenuItem[] = [

  {
    title: 'Dashboard',
    icon: 'pie-chart-outline',
    link: '/pages/dashboard',
  },

  {
    title: 'Cadastros',
    icon: 'layout-outline',
    children: [

      {
        title: 'Pessoas',
        icon: 'people-outline',
        children: [
          {
            title: 'Pessoas',
            icon: 'person-outline',
            link: '/pages/pessoa/pessoa-pesquisa',
          },
          {
            title: 'Estabelecimentos',
            icon: 'briefcase-outline',
            link: '/pages/estabelecimento/estabelecimento-pesquisa',
          },
          {
            title: 'Tipos Pessoas',
            icon: 'person-add-outline',
            link: '/pages/tipo-pessoa/tipo-pessoa-iud',
          },
        ],
      },

      {
        title: 'Endereços',
        icon: 'pin-outline',
        children: [
          {
            title: 'Estados',
            icon: 'map-outline',
            link: '/pages/estado/estado-iud',
          },
          {
            title: 'CEPs',
            icon: 'navigation-2-outline',
            link: '/pages/cep/cep-pesquisa',
          },
          {
            title: 'Cidades',
            icon: 'home-outline',
            link: '/pages/cidades/cidade-iud',
          },
          {
            title: 'Distritos',
            icon: 'compass-outline',
            link: '/pages/distrito/distrito-iud',
          },
          {
            title: 'Bairros',
            icon: 'pin-outline',
            link: '/pages/bairro/bairro-iud',
          },
          {
            title: 'Logradouros',
            icon: 'navigation-outline',
            link: '/pages/logradouro/logradouro-iud',
          },
          {
            title: 'Países',
            icon: 'globe-2-outline',
            link: '/pages/paises/pais-iud',
          },
          {
            title: 'Tipos Logradouros',
            icon: 'list-outline',
            link: '/pages/tipo-logradouro/tipo-logradouro-iud',
          },
          {
            title: 'Modalidades',
            icon: 'layers-outline',
            link: '/pages/modalidades/modalidade-pesquisa',
          },
        ],
      },

    ],
  },

  {
    title: 'Atividades',
    icon: 'edit-2-outline',
    children: [

      {
        title: 'Unifica Pessoas',
        icon: 'shuffle-2-outline',
        children: [

          {
            title: 'Pessoas',
            icon: 'people-outline',
            children: [
              {
                title: 'CPF ÚNICO',
                icon: 'person-done-outline',
                link: '/pages/unificacao/pessoas/pes-pessoa',
              },
              {
                title: 'CPF DUPLICADO',
                icon: 'people-outline',
                link: '/pages/unificacao/pessoas/cpf-duplicado',
              },
            ],
          },

          {
            title: 'RH',
            icon: 'briefcase-outline',
            children: [
              {
                title: 'Pessoas RH',
                icon: 'person-outline',
                link: '/pages/unificacao/rh',
              },
            ],
          },

          {
            title: 'SANEAMENTO',
            icon: 'checkmark-circle-2-outline',
            children: [
              {
                title: 'CPF ÚNICO',
                icon: 'person-done-outline',
                link: '/pages/unificacao/saneamento',
              },
              {
                title: 'CPF DUPLICADO',
                icon: 'people-outline',
                link: '/pages/unificacao/saneamento/sane-cpf-duplicado',
              },
            ],
          },

        ],
      },

      {
        title: 'Form Inputs',
        icon: 'edit-outline',
        link: '/pages/forms/inputs',
      },

    ],
  },

  {
    title: 'Consultas',
    icon: 'keypad-outline',
    children: [
      {
        title: 'Grid',
        icon: 'grid-outline',
        link: '/pages/ui-features/grid',
      },
    ],
  },

  {
    title: 'Relatórios',
    icon: 'browser-outline',
    children: [
      {
        title: 'Dialog',
        icon: 'message-square-outline',
        link: '/pages/modal-overlays/dialog',
      },
    ],
  },

];