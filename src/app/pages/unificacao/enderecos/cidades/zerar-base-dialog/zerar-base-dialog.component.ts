import { Component } from '@angular/core';
import { NbDialogRef } from '@nebular/theme';

export interface DecisaoZerarBase {
  confirmacao: string;
  apagarFicticias: boolean;
}

/*
 * Confirmação de "Recomeçar do zero".
 * O usuário precisa digitar ZERAR para liberar o botão.
 */
@Component({
  selector: 'ngx-zerar-base-dialog',
  templateUrl: './zerar-base-dialog.component.html',
  styleUrls: ['./zerar-base-dialog.component.scss'],
})
export class ZerarBaseDialogComponent {

  readonly textoConfirmacao = 'ZERAR';

  confirmacao = '';
  apagarFicticias = false;

  constructor(
    private dialogRef: NbDialogRef<ZerarBaseDialogComponent>,
  ) {}

  get confirmado(): boolean {
    return String(this.confirmacao ?? '').trim().toUpperCase()
      === this.textoConfirmacao;
  }

  confirmar(): void {

    if (!this.confirmado) {
      return;
    }

    this.dialogRef.close({
      confirmacao: this.textoConfirmacao,
      apagarFicticias: this.apagarFicticias,
    } as DecisaoZerarBase);
  }

  cancelar(): void {
    this.dialogRef.close();
  }
}
