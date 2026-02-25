import { Component } from '@angular/core';
import { FormControl } from '@angular/forms';
import { DefaultEditor } from 'ng2-smart-table';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

import { EstadoService } from '../../estado/estado.service';
import { Estado } from '../../../shared/models/estado';


@Component({
  selector: 'ngx-estado-nome-editor',
  template: `
    <div style="position: relative;">
      <input
        class="estado-nome-input"
        nbInput
        fullWidth
        [formControl]="inputCtrl"
        placeholder="Digite o estado..."
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
          (mousedown)="selecionarEstado(s)"  
          style="padding:8px 10px; cursor:pointer;"
        >
          <strong>{{ s.nome }}</strong>
          <span *ngIf="s.sigla"> ({{ s.sigla }})</span>
        </div>
      </div>
    </div>
  `,
})

export class EstadoNomeEditorComponent extends DefaultEditor {
  inputCtrl = new FormControl('');
  sugestoes: Estado[] = [];
  showDropdown = false;

  constructor(private pestadoService: EstadoService) {
    super();
  }

  ngOnInit(): void {
    // valor inicial (quando entra no modo add/edit)
    this.inputCtrl.setValue(this.cell.newValue ?? this.cell.getValue() ?? '', { emitEvent: false });

    this.inputCtrl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe((value: string) => {
        const texto = (value ?? '').trim();

        // Atualiza o que vai para event.newData.estadoNome
        this.cell.newValue = texto;

        // Se apagar ou for muito curto, limpa dropdown
        if (texto.length < 2) {
          this.sugestoes = [];
          return;
        }

        // Chama backend e guarda sugestões
        this.pestadoService.filtrarPorNome(texto, 0, 10).subscribe({
          next: (lista: any[]) => {
            // lista já vem como Estado[] no seu service; aqui só transformo pro formato simples
            this.sugestoes = (lista ?? []).map((estado: any) => ({
              id: estado.id,
              nome: estado.nome,
              sigla: estado.sigla,
            }));
            this.showDropdown = true;
            //console.log('Sugestões retornadas do backend:', this.sugestoes);
          },
          error: (err) => console.error('Erro ao buscar estados:', err),
        });
      });
  }

  selecionarEstado(p: Estado) {
    // 1) Preenche no input e na célula (estadoNome)
    this.inputCtrl.setValue(p.nome, { emitEvent: false });
    this.cell.newValue = p.nome;

    // 2) Preenche estadoId no MESMO objeto da linha (vai para event.newData)
    const row = this.cell.getRow();
    const data = row.getData();

    data.estadoId = p.id;
    data.estadoNome = p.nome;

    // (algumas versões do ng2-smart-table não precisam disso, mas não atrapalha)
    if (typeof (row as any).setData === 'function') {
      (row as any).setData(data);
    }

    //console.log('Selecionado:', { estadoId: p.id, estadoNome: p.nome });

    // 3) Fecha dropdown
    this.sugestoes = [];
    this.showDropdown = false;
  }

  onBlur() {
    // fecha dropdown depois de um pequeno delay (pra permitir clique)
    setTimeout(() => (this.showDropdown = false), 150);
  }
}