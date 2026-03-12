import { Injectable, Injector } from '@angular/core';
import { BaseResourceService } from '../../../shared/services/base-resource.service';
import { environment } from '../../../../environments/environment';
import { Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { EnderecoOut } from '../../../shared/models/enderecoOut';
import { EnderecoIn } from '../../../shared/models/enderecoIn';
import { HttpParams } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})  

export class EnderecoService extends BaseResourceService<EnderecoOut>{
    
    constructor(protected injector: Injector) {
        super(environment.apiUrl + 'enderecos', injector, EnderecoOut.fromJson);
    } 

    getEnderecoByPessoaId(pessoaId: number): Observable<EnderecoOut[]> {
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

    create(enderecoData: EnderecoIn): Observable<EnderecoOut> {

        const url = `${this.apiPath}`;

        return this.http.post<EnderecoOut>(url, enderecoData).pipe(
            map(response => {
                console.log('Endereço criado com sucesso (API retornou EnderecoOut):', response);
                return this.jsonDataToResource(response); // Converte para instância de EnderecoOut
            }),
            catchError(this.handleError)
        );
    }

     update(enderecoData: EnderecoIn): Observable<EnderecoOut> {
        // Garanta que enderecoData.id não seja null/undefined para um update
        if (enderecoData.id == null) {
            throw new Error("ID do endereço é necessário para atualização.");
        }
        const url = `${this.apiPath}/${enderecoData.id}`;

        return this.http.put<EnderecoOut>(url, enderecoData).pipe(
            map(response => {
                console.log('Endereço atualizado com sucesso (API retornou EnderecoOut):', response);
                return this.jsonDataToResource(response); // Converte para instância de EnderecoOut
            }),
            catchError(this.handleError)
        );
    }

    delete(id: number): Observable<any> {
        const url = `${this.apiPath}/${id}`;
        return this.http.delete<any>(url).pipe(
            catchError(this.handleError)
        );
    }

    definirComoPrincipal(enderecoId: number, pessoaId: number): Observable<void> { // Retorna Observable<void> pois o backend retorna 200 OK sem corpo
        const url = `${this.apiPath}/${enderecoId}/definir-como-principal`;
        
        // Se pessoaId for um query parameter:
        let params = new HttpParams().set('pessoaId', pessoaId.toString());

        return this.http.put<void>(url, {}, { params: params }).pipe( // Enviamos um corpo vazio {} para o PUT, se o backend não esperar nada
            catchError(this.handleError)
        );
    }
}


