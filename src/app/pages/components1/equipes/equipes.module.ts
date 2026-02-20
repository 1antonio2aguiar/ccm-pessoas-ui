import { CommonModule } from '@angular/common';
import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { NbCardModule, NbIconModule, NbInputModule, NbTreeGridModule } from '@nebular/theme';
import { Ng2SmartTableModule } from 'ng2-smart-table';
import { NbSelectModule } from '@nebular/theme';
import { ThemeModule } from '../../../@theme/theme.module';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { ConfirmDeleteComponent } from '../confirm-delete/confirm-delete-modal.component';
//import { EquipesBuscaComponent } from './equipes-busca/equipes-busca.component';
//import { EquipesPorNomeComponent } from './equipes-por-nome/equipes-por-nome.component';

@NgModule({
  declarations: [
    //EquipesBuscaComponent,
    //EquipesPorNomeComponent,
    ConfirmDeleteComponent
  ],
  imports: [
    CommonModule,
    HttpClientModule,
    NbCardModule,
    NbTreeGridModule,
    NbIconModule,
    NbInputModule,
    ThemeModule,
    Ng2SmartTableModule,
    NbSelectModule,
    FormsModule
  ],

  exports: [], // Exporte o componente para usar em outros módulos
})

export class EquipesModule { }