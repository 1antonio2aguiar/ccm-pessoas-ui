import { Component } from '@angular/core';
import { FormControl } from '@angular/forms';
import { DefaultEditor } from 'ng2-smart-table';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

import { TituloPatente } from '../../../shared/models/tituloPatente';
import { TituloPatenteService } from './tituloPatenteservice';

@Component({
  selector: 'ngx-titulo-patente-editor',
  template: `
    <div style="position: relative;">
      <input
        class="titulo-patente-input"
        nbInput
        fullWidth
        [formControl]="inputCtrl"
        placeholder="Digite..."
        (focus)="showDropdown = true"
        (blur)="onBlur()"
      />

      <div
        *ngIf="showDropdown && sugestoes.length > 0"
        style="position:absolute; z-index:9999; width:100%; max-height:220px; overflow:auto; border:1px solid #e4e9f2; border-radius:6px; background:#fff; margin-top:4px;"
      >
        <div
          *ngFor="let s of sugestoes"
          (mousedown)="selecionarTituloPatente(s)"
          style="padding:8px 10px; cursor:pointer;"
        >
          <span>{{ s.descricao }}</span>
        </div>
      </div>
    </div>
  `,
})

export class TituloPatenteEditorComponent extends DefaultEditor {
  inputCtrl = new FormControl('');
  sugestoes: TituloPatente[] = [];
  showDropdown = false;

  constructor(private service: TituloPatenteService) {
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

        this.service.filtrarPorDescricao(texto, 0, 20).subscribe({
          next: (lista: TituloPatente[]) => {
            this.sugestoes = lista ?? [];
            this.showDropdown = true;
          },
          error: (err) => console.error('Erro ao buscar titulo patente:', err),
        });
      });
  }

  selecionarTituloPatente(t: TituloPatente) {
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