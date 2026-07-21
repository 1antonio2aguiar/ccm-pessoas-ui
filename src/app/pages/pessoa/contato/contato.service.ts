import { Injectable, Injector, EventEmitter } from '@angular/core';
import { BaseResourceService } from '../../../shared/services/base-resource.service';
import { environment } from '../../../../environments/environment';
import { Observable } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ContatoOut } from '../../../shared/models/contatoOut';
import { ContatoIn } from '../../../shared/models/contatoIn';
import { HttpParams } from '@angular/common/http';

@Injectable({
    providedIn: 'root'
})

export class ContatoService extends BaseResourceService<ContatoOut> {

    constructor(protected injector: Injector) {
        super(environment.apiUrl + 'contatos', injector, ContatoOut.fromJson);
    }

    getContatoByPessoaId(pessoaId: number): Observable<ContatoOut[]> {
        const url = `${this.apiPath}/por-pessoa/${pessoaId}`;
        return this.http.get<any[]>(url).pipe(
            map(responseArray => {
                //console.log('API Response Array:', JSON.stringify(responseArray, null, 2)); // << DEBUG
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

    create(contatoData: ContatoIn): Observable<ContatoOut> {
        return this.http.post<ContatoOut>(this.apiPath, contatoData).pipe(
            map(response => {
                console.log('Contato criado com sucesso (API retornou ContatoOut):', response);
                return this.jsonDataToResource(response); // Converte para instância de ContatoOut
            }),
            catchError(this.handleError)
        );
    }

    update(contatoData: ContatoIn): Observable<ContatoOut> {
        // Garanta que contatoData.id não seja null/undefined para um update
        if (contatoData.id == null) {
            throw new Error("ID do contato é necessário para atualização.");
        }
        const url = `${this.apiPath}/${contatoData.id}`;
        return this.http.put<ContatoOut>(url, contatoData).pipe(
            map(response => {
                console.log('Contato atualizado com sucesso (API retornou contatoData):', response);
                return this.jsonDataToResource(response); // Converte para instância de ContatoOut
            }),
            catchError(this.handleError)
        );
    }

    definirComoPrincipal(
        contatoId: number,
        pessoaId: number,
    ): Observable<void> {

        const url =
            `${this.apiPath}/${contatoId}/definir-como-principal`;

        const params = new HttpParams()
            .set('pessoaId', pessoaId.toString());

        return this.http.put<void>(
            url,
            null,
            { params },
        ).pipe(
            catchError(this.handleError),
        );
    }

    delete(id: number): Observable<any> {
        const url = `${this.apiPath}/${id}`;
        return this.http.delete<any>(url).pipe(
            catchError(this.handleError)
        );
    }

}


