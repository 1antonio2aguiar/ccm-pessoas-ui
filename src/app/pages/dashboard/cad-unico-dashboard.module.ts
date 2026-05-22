import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { NbCardModule, NbSpinnerModule } from '@nebular/theme';
import { NgxEchartsModule } from 'ngx-echarts';

import { CadUnicoDashboardComponent } from './cad-unico-dashboard/cad-unico-dashboard.component';

const routes: Routes = [
  {
    path: '',
    component: CadUnicoDashboardComponent,
  },
];

@NgModule({
  declarations: [
    CadUnicoDashboardComponent,
  ],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    NbCardModule,
    NbSpinnerModule,
    NgxEchartsModule,
  ],
})
export class CadUnicoDashboardModule { }