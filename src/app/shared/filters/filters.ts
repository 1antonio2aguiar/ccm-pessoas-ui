import { HttpParams } from '@angular/common/http';

export class Filters {
    pagina = 0;
    itensPorPagina = 5;
    totalRegistros = 0;
    params = new HttpParams();
}