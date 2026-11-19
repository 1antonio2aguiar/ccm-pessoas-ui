import { Component } from '@angular/core';
import { NbDialogRef } from '@nebular/theme';

/*
 * Confirmação de "Recomeçar do zero" dos distritos.
 * O usuário precisa digitar ZERAR para liberar o botão.
 * Devolve o texto de confirmação ou undefined.
 */
@Component({
  selector: 'ngx-zerar-base-distritos-dialog',
  templateUrl: './zerar-base-distritos-dialog.component.html',
  styleUrls: ['./zerar-base-distritos-dialog.component.scss'],
})
export class ZerarBaseDistritosDialogComponent {

  readonly textoConfirmacao = 'ZERAR';

  confirmacao = '';

  constructor(
    private dialogRef: NbDialogRef<ZerarBaseDistritosDialogComponent>,
  ) {}

  get confirmado(): boolean {
    return String(this.confirmacao ?? '').trim().toUpperCase() === this.textoConfirmacao;
  }

  confirmar(): void {

    if (!this.confirmado) {
      return;
    }

    this.dialogRef.close(this.textoConfirmacao);
  }

  cancelar(): void {
    this.dialogRef.close();
  }
}
