// src/app/shared/components/confirmation-dialog/confirmation-dialog.component.ts

import { Component, Input, OnInit } from '@angular/core';
import { NbDialogRef } from '@nebular/theme';

@Component({
  selector: 'ngx-confirmation-dialog',
  templateUrl: './confirmation-dialog.component.html',
  styleUrls: ['./confirmation-dialog.component.scss']
})
export class ConfirmationDialogComponent {

  // Dados que o componente receberá de quem o chamou
  @Input() title: string = 'Confirmar Ação';
  @Input() message: string = 'Você tem certeza que deseja prosseguir?';
  @Input() cancelButtonText: string = 'Cancelar';
  @Input() confirmButtonText: string = 'Confirmar';
  @Input() status: 'basic' | 'primary' | 'success' | 'info' | 'warning' | 'danger' = 'danger'; // Cor do botão de confirmação
  @Input() icon: string = 'alert-triangle-outline'; // Ícone a ser exibido

  constructor(protected dialogRef: NbDialogRef<ConfirmationDialogComponent>) { }

  // Fecha o diálogo retornando false
  onCancel(): void {
    this.dialogRef.close(false);
  }

  // Fecha o diálogo retornando true
  onConfirm(): void {
    this.dialogRef.close(true);
  }
}