import { Component } from '@angular/core';
import { FormControl } from '@angular/forms';
import { DefaultEditor } from 'ng2-smart-table';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

import { PaisService } from '../../paises/pais.service';
import { Pais } from '../../../shared/models/pais';


@Component({
  selector: 'ngx-pais-nome-editor',
  template: `
    <div style="position: relative;">
      <input
        class="pais-nome-input"
        nbInput
        fullWidth
        [formControl]="inputCtrl"
        placeholder="Digite o país..."
        (focus)="showDropdown = true"
        (blur)="onBlur()"
      />

      <!-- DROPDOWN -->
      <div
        *ngIf="showDropdown && sugestoes.length > 0"
        style="position:absolute; z-index:9999; width:100%; max-height:220px; overflow:auto; border:1px solid #e4e9f2; border-radius:6px; background:#fff; margin-top:4px;"
      >
        <div
          *ngFor="let s of sugestoes"
          (mousedown)="selecionarPais(s)"  
          style="padding:8px 10px; cursor:pointer;"
        >
          <strong>{{ s.nome }}</strong>
          <span *ngIf="s.sigla"> ({{ s.sigla }})</span>
        </div>
      </div>
    </div>
  `,
})

export class PaisNomeEditorComponent extends DefaultEditor {
  inputCtrl = new FormControl('');
  sugestoes: Pais[] = [];
  showDropdown = false;

  constructor(private paisService: PaisService) {
    super();
  }

  ngOnInit(): void {
    // valor inicial (quando entra no modo add/edit)
    this.inputCtrl.setValue(this.cell.newValue ?? this.cell.getValue() ?? '', { emitEvent: false });

    this.inputCtrl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe((value: string) => {
        const texto = (value ?? '').trim();

        // Atualiza o que vai para event.newData.paisNome
        this.cell.newValue = texto;

        // Se apagar ou for muito curto, limpa dropdown
        if (texto.length < 2) {
          this.sugestoes = [];
          return;
        }

        // Chama backend e guarda sugestões
        this.paisService.filtrarPorNome(texto, 0, 10).subscribe({
          next: (lista: any[]) => {
            // lista já vem como Pais[] no seu service; aqui só transformo pro formato simples
            this.sugestoes = (lista ?? []).map((p: any) => ({
              id: p.id,
              nome: p.nome,
              sigla: p.sigla,
            }));
            this.showDropdown = true;
            console.log('Sugestões retornadas do backend:', this.sugestoes);
          },
          error: (err) => console.error('Erro ao buscar países:', err),
        });
      });
  }

  selecionarPais(p: Pais) {
    // 1) Preenche no input e na célula (paisNome)
    this.inputCtrl.setValue(p.nome, { emitEvent: false });
    this.cell.newValue = p.nome;

    // 2) Preenche paisId no MESMO objeto da linha (vai para event.newData)
    const row = this.cell.getRow();
    const data = row.getData();

    data.paisId = p.id;
    data.paisNome = p.nome;

    // (algumas versões do ng2-smart-table não precisam disso, mas não atrapalha)
    if (typeof (row as any).setData === 'function') {
      (row as any).setData(data);
    }

    console.log('Selecionado:', { paisId: p.id, paisNome: p.nome });

    // 3) Fecha dropdown
    this.sugestoes = [];
    this.showDropdown = false;
  }

  onBlur() {
    // fecha dropdown depois de um pequeno delay (pra permitir clique)
    setTimeout(() => (this.showDropdown = false), 150);
  }
}