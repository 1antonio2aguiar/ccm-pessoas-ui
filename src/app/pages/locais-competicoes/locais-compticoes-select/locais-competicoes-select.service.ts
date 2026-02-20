import { Injectable, Injector, EventEmitter } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, from } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { BaseResourceService } from '../../../shared/services/base-resource.service';
import { LocaisCompeticoes } from '../../../shared/models/locaisCompeticoes';


@Injectable({
  providedIn: 'root'
})

@Injectable()
export class LocaisCompeticoesService extends BaseResourceService<LocaisCompeticoes>{

  private locaisCompeticoesEventHendlerId: EventEmitter<LocaisCompeticoes>;

  constructor(protected injector: Injector) {
    super(environment.apiUrl + 'locaisCompeticoes', injector, LocaisCompeticoes.fromJson);
    this.locaisCompeticoesEventHendlerId = new EventEmitter<LocaisCompeticoes>;
  }

  
  // 1. Listar todos os registros (READ)
  listAll(): Promise<LocaisCompeticoes[]> {
    //console.log('Chegou no service! ',this.apiPath + '/list' )
    return this.http
      .get<LocaisCompeticoes[]>(this.apiPath + '/list')
      .toPromise();
  }

  onLocaisCompeticoesChangeService(event) {
    this.locaisCompeticoesEventHendlerId.emit(event); // Emitir o ID da local competicao selecionada
  }

  onLocaisCompeticoesChangeId(callBack:(locaisCompeticoes: LocaisCompeticoes) => void){
    this.locaisCompeticoesEventHendlerId.subscribe(callBack);
  }
}