import { NbMenuItem } from '@nebular/theme';

export const MENU_ITEMS: NbMenuItem[] = [
  {
    title: 'AÇÕES',
    group: true,
  },
  {
    title: 'Cadastros',
    icon: 'layout-outline',
    children: [
      {
        title: 'Estados',
        link: '/pages/estado/estado-iud',
      },
      {
        title: 'Cidades',
        link: '/pages/cidade/cidade-iud',
      },
      {
        title: 'Distritos',
        link: '/pages/distrito/distrito-iud',
      },
      {
        title: 'Bairros',
        link: '/pages/bairro/bairro-iud',
      },
      {
        title: 'Logradouros',
        link: '/pages/logradouro/logradouro-iud',
      },
      {
        title: 'Países',
        link: '/pages/paises/pais-iud',
      },
      {
        title: 'Tipos Logradouros',
        link: '/pages/tipo-logradouro/tipo-logradouro-iud',
      },
      {
        title: 'Tipos Pessoas',
        link: '/pages/tipo-pessoa/tipo-pessoa-iud',
      },
      {
        title: 'Modalidades',
        link: '/pages/modalidades/modalidade-pesquisa',
      },
    ],
  },
  {
    title: 'Atividades',
    icon: 'edit-2-outline',
    children: [
      {
        title: 'Form Inputs',
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
        link: '/pages/ui-features/grid',
      },
    ],
  },
  {
    title: 'Relatorios',
    icon: 'browser-outline',
    children: [
      {
        title: 'Dialog',
        link: '/pages/modal-overlays/dialog',
      },
    ],
  },
];
