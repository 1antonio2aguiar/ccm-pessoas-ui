import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { NbCardModule, NbIconModule, NbInputModule, NbTreeGridModule } from '@nebular/theme';
import { Ng2SmartTableModule } from 'ng2-smart-table';
import { NbSelectModule } from '@nebular/theme';

import { ThemeModule } from '../../../@theme/theme.module';
import { LocalCompeticaoSelectComponent } from './locais-competicoes-select.component';

@NgModule({
  declarations: [LocalCompeticaoSelectComponent],
  imports: [
    NbCardModule,
    NbTreeGridModule,
    NbIconModule,
    NbInputModule,
    ThemeModule,
    Ng2SmartTableModule,
    NbSelectModule,
  ],
  exports:[LocalCompeticaoSelectComponent]
})

export class LocaisCompeticoesSelectModule { }
