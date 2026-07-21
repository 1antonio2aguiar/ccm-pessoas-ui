import { Injectable, Injector } from '@angular/core';
import { Observable } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { BaseResourceService } from '../../../shared/services/base-resource.service';
import { environment } from '../../../../environments/environment';
import { DocumentoOut } from '../../../shared/models/documentoOut';
import { DocumentoIn } from '../../../shared/models/documentoIn';

@Injectable({
    providedIn: 'root'
})
export class DocumentoService extends BaseResourceService<DocumentoOut> {

    constructor(protected injector: Injector) {
        super(
            environment.apiUrl + 'documentos',
            injector,
            DocumentoOut.fromJson
        );
    }

    getDocumentoByPessoaId(
        pessoaId: number
    ): Observable<DocumentoOut[]> {

        const url =
            `${this.apiPath}/por-pessoa/${pessoaId}`;

        return this.http
            .get<any[]>(url)
            .pipe(
                map(responseArray =>
                    responseArray.map(item =>
                        this.jsonDataToResource(item)
                    )
                ),
                catchError(this.handleError)
            );
    }

    create(
        documentoData: DocumentoIn
    ): Observable<DocumentoOut> {

        return this.http
            .post<DocumentoOut>(
                this.apiPath,
                documentoData
            )
            .pipe(
                map(response =>
                    this.jsonDataToResource(response)
                ),
                catchError(this.handleError)
            );
    }

    update(
        documentoData: DocumentoIn
    ): Observable<DocumentoOut> {

        if (documentoData.id == null) {
            throw new Error(
                'ID do documento é necessário para atualização.'
            );
        }

        const url =
            `${this.apiPath}/${documentoData.id}`;

        return this.http
            .put<DocumentoOut>(
                url,
                documentoData
            )
            .pipe(
                map(response =>
                    this.jsonDataToResource(response)
                ),
                catchError(this.handleError)
            );
    }

    delete(
        id: number
    ): Observable<any> {

        const url =
            `${this.apiPath}/${id}`;

        return this.http
            .delete<any>(url)
            .pipe(
                catchError(this.handleError)
            );
    }
}