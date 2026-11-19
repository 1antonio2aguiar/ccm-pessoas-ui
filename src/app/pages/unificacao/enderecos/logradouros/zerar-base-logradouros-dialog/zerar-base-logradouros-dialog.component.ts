import { Component } from '@angular/core';
import { NbDialogRef } from '@nebular/theme';

/*
 * Confirmação de "Recomeçar do zero" dos logradouros.
 * O usuário precisa digitar ZERAR para liberar o botão.
 * Devolve o texto de confirmação ou undefined.
 */
@Component({
  selector: 'ngx-zerar-base-logradouros-dialog',
  templateUrl: './zerar-base-logradouros-dialog.component.html',
  styleUrls: ['./zerar-base-logradouros-dialog.component.scss'],
})
export class ZerarBaseLogradourosDialogComponent {

  readonly textoConfirmacao = 'ZERAR';

  confirmacao = '';

  constructor(
    private dialogRef: NbDialogRef<ZerarBaseLogradourosDialogComponent>,
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
