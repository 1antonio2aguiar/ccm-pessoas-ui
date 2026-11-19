import { Component } from '@angular/core';
import { NbDialogRef } from '@nebular/theme';

/*
 * Confirmação de "Recomeçar do zero" dos bairros.
 * O usuário precisa digitar ZERAR para liberar o botão.
 * Devolve o texto de confirmação ou undefined.
 */
@Component({
  selector: 'ngx-zerar-base-bairros-dialog',
  templateUrl: './zerar-base-bairros-dialog.component.html',
  styleUrls: ['./zerar-base-bairros-dialog.component.scss'],
})
export class ZerarBaseBairrosDialogComponent {

  readonly textoConfirmacao = 'ZERAR';

  confirmacao = '';

  constructor(
    private dialogRef: NbDialogRef<ZerarBaseBairrosDialogComponent>,
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
