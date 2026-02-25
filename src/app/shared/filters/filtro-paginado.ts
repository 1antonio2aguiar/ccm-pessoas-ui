import { HttpParams } from '@angular/common/http';

/**
 * Filtro paginado reutilizável para telas com listagem + paginação + filtros via querystring.
 *
 * Observação: como HttpParams é imutável, sempre reatribua ao usar set/append:
 *   filtro.params = filtro.params.set('nome', 'abc');
 */
export class FiltroPaginado {
  pagina = 0;
  itensPorPagina = 5;
  totalRegistros = 0;
  params: HttpParams = new HttpParams();

  resetParams(): void {
    this.params = new HttpParams();
  }
}
