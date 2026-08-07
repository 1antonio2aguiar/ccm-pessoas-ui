import { Component, Input } from '@angular/core';
import { NbDialogRef } from '@nebular/theme';

export interface PessoaOrigemUnificacao {
  nome: string | null;
  cpfCnpj: string | null;
  dataNascimento: string | null;
}

export interface PessoaCadUnicoUnificacao {
  existe: boolean;
  pessoaId: number | null;
  nome: string | null;
  cpfCnpj: string | null;
  dataNascimento: string | null;
} 

@Component({
  selector: 'ngx-confirmar-unificacao-dialog',
  templateUrl: './confirmar-unificacao-dialog.component.html',
  styleUrls: ['./confirmar-unificacao-dialog.component.scss',
  ],
})
export class ConfirmarUnificacaoDialogComponent {

  @Input()
  pessoaOrigem!: PessoaOrigemUnificacao;

  @Input()
  pessoaCadUnico!: PessoaCadUnicoUnificacao;

  @Input()
  tituloOrigem = 'Cadastro de origem';

  constructor(
    private dialogRef:
      NbDialogRef<ConfirmarUnificacaoDialogComponent>,
  ) {}

  confirmar(): void {
    this.dialogRef.close(true);
  }

  cancelar(): void {
    this.dialogRef.close(false);
  }

  formatarCpf(valor: any): string {
    const cpf =
      String(valor ?? '')
        .replace(/\D/g, '')
        .padStart(11, '0');

    if (cpf.length !== 11) {
      return String(valor ?? '');
    }

    return cpf.replace(
      /(\d{3})(\d{3})(\d{3})(\d{2})/,
      '$1.$2.$3-$4'
    );
  }

  formatarData(valor: any): string {
    if (!valor) {
      return '';
    }

    const texto =
      String(valor).substring(0, 10);

    const partes =
      texto.split('-');

    if (partes.length === 3) {
      return `${partes[2]}/${partes[1]}/${partes[0]}`;
    }

    return String(valor);
  }
}