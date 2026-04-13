 import { Injectable, Injector, EventEmitter } from '@angular/core';
import { BaseResourceService } from '../../../shared/services/base-resource.service';
import { Observable } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { HttpParams } from '@angular/common/http';

import { environment } from '../../../../environments/environment';
import { DocumentoOut } from '../../../shared/models/documentoOut';
import { DocumentoIn } from '../../../shared/models/documentoIn';

@Injectable({
  providedIn: 'root'
})

export class DocumentoService extends BaseResourceService<DocumentoOut>{
    
    constructor(protected injector: Injector) {
        super(environment.apiUrl + 'documentos', injector, DocumentoOut.fromJson);
    } 

    getDocumentoByPessoaId(pessoaId: number): Observable<DocumentoOut[]> {
        const url = `${this.apiPath}/por-pessoa/${pessoaId}`;
        return this.http.get<any[]>(url).pipe(
            map(responseArray => {
                console.log('API Response Array:', JSON.stringify(responseArray, null, 2)); // << DEBUG
                return responseArray.map(item => {
                    //console.log('Processing item:', JSON.stringify(item, null, 2)); // << DEBUG
                    try {
                        return this.jsonDataToResource(item);
                    } catch (e) {
                        //console.error('Error processing item:', item, e); // << DEBUG MAIS DETALHADO
                        throw e; // Re-throw para não engolir o erro silenciosamente
                    }
                });
            })
        );
    }

    create(documentoData: DocumentoOut): Observable<DocumentoOut> {
        return this.http.post<DocumentoOut>(this.apiPath, documentoData).pipe(
            map(response => {
                console.log('Documento criado com sucesso (API retornou documentoOut):', response);
                return this.jsonDataToResource(response); // Converte para instância de EnderecoOut
            }),
            catchError(this.handleError)
        );
    }

    /*update(documentoData: DocumentoIn): Observable<DocumentoOut> {
        // Garanta que documentoData.id não seja null/undefined para um update
        if (documentoData.id == null) {
            throw new Error("ID do documento é necessário para atualização.");
        }
        const url = `${this.apiPath}/${documentoData.id}`;
        return this.http.put<DocumentoOut>(url, documentoData).pipe(
            map(response => {
                console.log('Documento atualizado com sucesso (API retornou EnderecoOut):', response);
                return this.jsonDataToResource(response); // Converte para instância de DocumentoOut
            }),
            catchError(this.handleError)
        );
    }*/

    delete(id: number): Observable<any> {
        const url = `${this.apiPath}/${id}`;
        return this.http.delete<any>(url).pipe(
            catchError(this.handleError)
        );
    }
}


