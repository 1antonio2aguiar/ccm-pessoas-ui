import { Component,  OnInit } from '@angular/core';
import { NbDialogRef } from '@nebular/theme';

@Component({
    selector: 'ngx-confirm-delete-modal',
    template: `
         <nb-card>
             <nb-card-header>{{ title }}</nb-card-header>
             <nb-card-body>
               {{ message }}
             </nb-card-body>
           
             <nb-card-footer>
                 <button nbButton hero status="success" class="mr-1" (click)="close(false)">Cancelar</button>
                 <button nbButton hero status="danger" (click)="close(true)">Excluir</button>
             </nb-card-footer>
         </nb-card>
   `,
})

export class ConfirmDeleteComponent {
    title: string = '';
    message: string = '';
    data: any

    constructor(protected ref: NbDialogRef<ConfirmDeleteComponent>) { }

    close(res) {
        this.ref.close(res);
    }

}