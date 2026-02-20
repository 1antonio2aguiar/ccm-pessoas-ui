import { HttpParams } from '@angular/common/http';

export class FiltersEquipe {
    pagina = 0;
    itensPorPagina = 10;
    totalRegistros = 0;
    id = 0;
    nome = '';
    
    params = new HttpParams();
}