import { Component } from '@angular/core';
import { FormControl } from '@angular/forms';
import { DefaultEditor } from 'ng2-smart-table';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

import { CidadeService } from '../../cidades/cidade.service';
import { Cidade } from '../../../shared/models/cidade';

@Component({
  selector: 'ngx-cidade-nome-editor',
  template: `
    <div style="position: relative;">
      <input
        class="cidade-nome-input"
        nbInput
        fullWidth
        [formControl]="inputCtrl"
        placeholder="Digite a cidade..."
        (focus)="showDropdown = true"
        (blur)="onBlur()"
      />

      <div
        *ngIf="showDropdown && sugestoes.length > 0"
        style="position:absolute; z-index:9999; width:100%; max-height:220px; overflow:auto; border:1px solid #e4e9f2; border-radius:6px; background:#fff; margin-top:4px;"
      >
        <div
          *ngFor="let s of sugestoes"
          (mousedown)="selecionarCidade(s)"
          style="padding:8px 10px; cursor:pointer;"
        >
          <strong>{{ s.nome }}</strong>
          <span *ngIf="s.sigla"> ({{ s.sigla }})</span>
        </div>
      </div>
    </div>
  `,
})
export class CidadeNomeEditorComponent extends DefaultEditor {
  inputCtrl = new FormControl('');
  sugestoes: Cidade[] = [];
  showDropdown = false;

  constructor(private cidadeService: CidadeService) {
    super();
  }

  ngOnInit(): void {
    this.inputCtrl.setValue(this.cell.newValue ?? this.cell.getValue() ?? '', { emitEvent: false });

    this.inputCtrl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe((value: string) => {
        const texto = (value ?? '').trim();

        // Atualiza o que vai para event.newData.cidadeNome
        this.cell.newValue = texto;

        if (texto.length < 2) {
          this.sugestoes = [];
          return;
        }

        this.cidadeService.filtrarPorNome(texto, 0, 10).subscribe({
          next: (lista: Cidade[]) => {
            this.sugestoes = lista ?? [];
            this.showDropdown = true;
          },
          error: (err) => console.error('Erro ao buscar cidades:', err),
        });
      });
  }

  selecionarCidade(c: Cidade) {
    this.inputCtrl.setValue(c.nome ?? '', { emitEvent: false });
    this.cell.newValue = c.nome ?? '';

    const row = this.cell.getRow();
    const data: any = row.getData();

    data.cidadeId = c.id;
    data.cidadeNome = c.nome;

    if (typeof (row as any).setData === 'function') {
      (row as any).setData(data);
    }

    this.sugestoes = [];
    this.showDropdown = false;
  }

  onBlur() {
    setTimeout(() => (this.showDropdown = false), 150);
  }
}
