import { HttpParams } from '@angular/common/http';

export class FiltersPessoa {
    pagina = 0;
    itensPorPagina = 10;
    totalRegistros = 0;
    id = 0;
    nome = '';
    cpf = '';
    dataNascimento = '';
    
    params = new HttpParams();
}