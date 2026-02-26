import { Component } from '@angular/core';
import { FormControl } from '@angular/forms';
import { DefaultEditor } from 'ng2-smart-table';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

import { LogradouroService } from '../../logradouro/logradouro.service';
import { Logradouro } from '../../../shared/models/logradouro';

@Component({
  selector: 'ngx-logradouro-editor',
  template: `
    <div style="position: relative;">
      <input
        nbInput
        fullWidth
        class="logradouro-input"
        [formControl]="inputCtrl"
        placeholder="Digite o logradouro..."
        (focus)="onFocus()"
        (blur)="onBlur()"
      />

      <small *ngIf="!cidadeId" style="display:block; margin-top:4px; opacity:.7;">
      </small>

      <div
        *ngIf="showDropdown && sugestoes.length > 0"
        style="position:absolute; z-index:9999; width:100%; max-height:220px; overflow:auto;
               border:1px solid #e4e9f2; border-radius:6px; background:#fff; margin-top:4px;"
      >
        <div
          *ngFor="let s of sugestoes"
          (mousedown)="selecionarLogradouro(s)"
          style="padding:8px 10px; cursor:pointer;"
        >
          <strong>{{ s.nome }}</strong>
          <span *ngIf="s.tipoLogradouroSigla"> ({{ s.tipoLogradouroSigla }})</span>
        </div>
      </div>
    </div>
  `,
})

export class BuscaLogradouroPorCidadeComponent extends DefaultEditor {
  inputCtrl = new FormControl('');
  sugestoes: Logradouro[] = [];
  showDropdown = false;

  get cidadeId(): number | null {
    const row = this.cell?.getRow();
    const data: any = row?.getData ? row.getData() : null;
    return data?.cidadeId ?? null;
  }

  constructor(private logradouroService: LogradouroService) {
    super();
  }

  ngOnInit(): void {
    this.inputCtrl.setValue(this.cell.newValue ?? this.cell.getValue() ?? '', { emitEvent: false });

    // 🔒 trava/destrava baseado na cidadeId
    this.syncDisabled();

    this.inputCtrl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe((value: string) => {
        // garante que continua travado se não tiver cidade
        this.syncDisabled();

        const texto = (value ?? '').trim();
        this.cell.newValue = texto;

        if (!this.cidadeId) {
          this.sugestoes = [];
          this.showDropdown = false;
          return;
        }

        if (texto.length < 2) {
          this.sugestoes = [];
          return;
        }

        this.logradouroService.filtrarPorCidadeIdENome(this.cidadeId, texto, 0, 20).subscribe({
          next: (lista: Logradouro[]) => {
            this.sugestoes = lista ?? [];
            this.showDropdown = true;
          },
          error: (err) => console.error('Erro ao buscar logradouros:', err),
        });
      });
  }

  private syncDisabled() {
    // ✅ aqui é o que realmente bloqueia
    if (!this.cidadeId) {
      if (this.inputCtrl.enabled) this.inputCtrl.disable({ emitEvent: false });
      this.showDropdown = false;
      this.sugestoes = [];
    } else {
      if (this.inputCtrl.disabled) this.inputCtrl.enable({ emitEvent: false });
    }
  }

  onFocus() {
    // quando entra no campo, reavalia (cidade pode ter sido escolhida antes)
    this.syncDisabled();
    if (this.cidadeId) this.showDropdown = true;
  }

  selecionarLogradouro(l: any) {
    const logradouroNome = l?.nome ?? '';

    this.inputCtrl.setValue(logradouroNome, { emitEvent: false });
    this.cell.newValue = logradouroNome;

    if (typeof (this.cell as any).setValue === 'function') {
      (this.cell as any).setValue(logradouroNome);
    } else {
      this.cell.setValue(logradouroNome);
    }

    const row = this.cell.getRow();
    const data: any = { ...(row.getData ? row.getData() : {}) };

    data.logradouroNome = logradouroNome;
    data.logradouroId = l?.id;

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