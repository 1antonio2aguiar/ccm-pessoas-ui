import { Component, OnInit, Output, EventEmitter, OnDestroy, HostBinding, Input } from '@angular/core';
import { LocalDataSource } from 'ng2-smart-table';
import { NbWindowService, NbWindowRef, NbDialogRef } from '@nebular/theme';
import { Subscription } from 'rxjs';
import { Observable, Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged  } from 'rxjs/operators';
import { HttpParams } from '@angular/common/http';

import { PessoasService } from '../pessoas.service';
import { CpfPipe } from '../../../../shared/pipes/cpf.pipe';
import { CnpjPipe } from '../../../../shared/pipes/cnpj.pipe';
//import { PorNomeComponent } from '../../../equipes/pessoas/componentes-busca/por-nome/por-nome.component';
//import { PorCpfComponent } from '../../../equipes/pessoas/componentes-busca/por-cpf/por-cpf.component';
//import { PorDataNascimentoComponent } from '../../../equipes/pessoas/componentes-busca/por-data-nascimento/por-data-nascimento.component';
//import { TelaOrigemService } from '../../../../shared/services/tela-origem.service';

export class Filters {
  pagina = 0;
  itensPorPagina = 5;
  totalRegistros = 0;
  nome = '';
  cpf: string | null = null; 
  params = new HttpParams(); 
} 

@Component({
  selector: 'ngx-pessoas-busca',
  templateUrl: './pessoas.component.html',
  styleUrls: ['./pessoas.component.scss']
})

export class PessoasComponent  {
  //width = 700;
  @Input() telaOrigem; 

    
}
