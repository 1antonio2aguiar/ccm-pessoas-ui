import { Component } from '@angular/core';
import { FormControl } from '@angular/forms';
import { DefaultEditor } from 'ng2-smart-table';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

import { TipoLogradouro } from '../../../shared/models/tipoLogradouro';
import { TipoLogradouroService } from '../../tipo-logradouro/tipo-logradouro.service';

@Component({
  selector: 'ngx-tipo-logradouro-editor',
  template: `
    <div style="position: relative;">
      <input
        class="tipo-logradouro-input"
        nbInput
        fullWidth
        [formControl]="inputCtrl"
        placeholder="Digite o tipo..."
        (focus)="showDropdown = true"
        (blur)="onBlur()"
      />

      <div
        *ngIf="showDropdown && sugestoes.length > 0"
        style="position:absolute; z-index:9999; width:100%; max-height:220px; overflow:auto; border:1px solid #e4e9f2; border-radius:6px; background:#fff; margin-top:4px;"
      >
        <div
          *ngFor="let s of sugestoes"
          (mousedown)="selecionarTipoLogradouro(s)"
          style="padding:8px 10px; cursor:pointer;"
        >
          <span>{{ s.descricao }}</span>
        </div>
      </div>
    </div>
  `,
})

export class TipoLogradouroEditorComponent extends DefaultEditor {
  inputCtrl = new FormControl('');
  sugestoes: TipoLogradouro[] = [];
  showDropdown = false;

  constructor(private service: TipoLogradouroService) {
    super();
  }

  ngOnInit(): void {
    this.inputCtrl.setValue(this.cell.newValue ?? this.cell.getValue() ?? '', { emitEvent: false });

    this.inputCtrl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe((value: string) => {
        const texto = (value ?? '').trim();

        this.cell.newValue = texto;

        if (texto.length < 2) {
          this.sugestoes = [];
          return;
        }

        this.service.filtrarPorDEscricao(texto, 0, 20).subscribe({
          next: (lista: TipoLogradouro[]) => {
            this.sugestoes = lista ?? [];
            this.showDropdown = true;
          },
          error: (err) => console.error('Erro ao buscar tipo logradouro:', err),
        });
      });
  }

  selecionarTipoLogradouro(t: TipoLogradouro) {
  const field = this.cell.getColumn().id; // nome REAL da coluna no settings
  const descricao = t?.descricao ?? '';

  // 1) Atualiza o input e a célula (isso alimenta event.newData[field])
  this.inputCtrl.setValue(descricao, { emitEvent: false });
  this.cell.newValue = descricao;
  this.cell.setValue(descricao); // <- força o grid a mostrar na hora

  // 2) Atualiza a linha com os campos que você quer salvar
  const row = this.cell.getRow();
  const data: any = { ...(row.getData ? row.getData() : {}) };

  // valor que aparece na coluna (usa o nome certo da coluna!)
  data[field] = descricao;

  // id que o backend precisa
  data.tipoLogradouroId = t?.id;

  // opcional: se você também quer guardar sigla
  data.tipoLogradouroSigla = t?.sigla;

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