import { NgModule } from '@angular/core';

import { TelefonePipe } from './pipes/telefone.pipe';
import { CnpjPipe } from './pipes/cnpj.pipe';
import { CpfPipe } from './pipes/cpf.pipe';
import { SexoPipe } from './pipes/sexo.pipe';
import { SimNaoPipe } from './pipes/sim-nao.pipe';
import { CepPipe } from './pipes/cep.pipe';

@NgModule({
  declarations: [
  TelefonePipe,
  CpfPipe,
  CnpjPipe,
  SexoPipe,
  SimNaoPipe,
  CepPipe,

  ],
  imports: [
    
  ],
  exports: [
    TelefonePipe,
    CpfPipe,
    CnpjPipe,
    SexoPipe,
    SimNaoPipe,
    CepPipe,
  ]
})

export class MeuSharedModule { }
