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
        title: 'Campeonatos',
        link: '/pages/campeonatos/campeonato-pesquisa',
      },
      {
        title: 'Etapas',
        link: '/pages/etapas/etapas-pesquisa',
      },
      {
        title: 'Países',
        link: '/pages/paises/pais-iud',
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
    link: '/pages/ui-features',
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
