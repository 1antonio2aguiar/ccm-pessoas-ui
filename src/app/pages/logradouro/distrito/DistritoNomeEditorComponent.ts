import { Component } from '@angular/core';
import { FormControl } from '@angular/forms';
import { DefaultEditor } from 'ng2-smart-table';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

import { DistritoService } from '../../distrito/distrito.service';
import { Distrito } from '../../../shared/models/distrito';

@Component({
  selector: 'ngx-distrito-nome-editor',
  template: `
    <div style="position: relative;">
      <input
        class="distrito-nome-input"
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
          (mousedown)="selecionarDistrito(s)"
          style="padding:8px 10px; cursor:pointer;"
        >
          <strong>{{ s.cidadeNome }}</strong>
           <span *ngIf="s.nome"> ({{ s.nome }})</span>
        </div>
      </div>
    </div>
  `,
})
export class DistritoNomeEditorComponent extends DefaultEditor {
  inputCtrl = new FormControl('');
  sugestoes: Distrito[] = [];
  showDropdown = false;

  constructor(private distritoService: DistritoService) {
    super();
  }

  ngOnInit(): void {
    this.inputCtrl.setValue(this.cell.newValue ?? this.cell.getValue() ?? '', { emitEvent: false });

    this.inputCtrl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe((value: string) => {
        const texto = (value ?? '').trim();

        // Aqui o usuário está digitando CIDADE, mas o campo salvo será distritoNome quando ele selecionar
        // Então, enquanto ele digita, só mantemos o que ele digitou no input (não confirmamos distrito ainda)
        this.cell.newValue = texto;

        if (texto.length < 2) {
          this.sugestoes = [];
          return;
        }

        this.distritoService.filtrarPorCidadeNome(texto, 0, 20).subscribe({
          next: (lista: Distrito[]) => {
            this.sugestoes = lista ?? [];
            this.showDropdown = true;
          },
          error: (err) => console.error('Erro ao buscar distritos:', err),
        });
      });
  }

  selecionarDistrito(d: any) {
    // 1) Qual campo esta célula representa? (ex: "nomeDistrito")
    const field = this.cell.getColumn().id; // <- pega o nome real da coluna

    // 2) Valor que vai aparecer na célula (Distrito)
    const distritoNome = d?.nome ?? '';

    // 3) Atualiza a célula (visual + newData)
    this.inputCtrl.setValue(distritoNome, { emitEvent: false });
    this.cell.newValue = distritoNome;
    if (typeof (this.cell as any).setValue === 'function') {
      (this.cell as any).setValue(distritoNome);
    } else {
      // fallback (algumas versões)
      this.cell.setValue(distritoNome);
    }

    // 4) Atualiza o objeto da linha com os campos que o backend precisa
    const row = this.cell.getRow();
    const data: any = { ...(row.getData ? row.getData() : {}) };

    // *** AJUSTE AQUI PARA BATER COM SEU COMPONENT ***
    // Se sua coluna é nomeDistrito (como no BairroIudComponent)
    data.nomeDistrito = distritoNome;

    // cidade (se você tem coluna nomeCidade)
    data.nomeCidade = d?.cidadeNome ?? data.nomeCidade;

    // ids para salvar
    data.distritoId = d?.id;

    // (opcional) se você também guarda cidadeId
    if (d?.cidadeId != null) data.cidadeId = d.cidadeId;

    // 5) Empurra o novo data pro grid (isso faz refletir na tela)
    if (typeof (row as any).setData === 'function') {
      (row as any).setData(data);
    }

    // 6) fecha dropdown
    this.sugestoes = [];
    this.showDropdown = false;
  }

  onBlur() {
    setTimeout(() => (this.showDropdown = false), 150);
  }
}