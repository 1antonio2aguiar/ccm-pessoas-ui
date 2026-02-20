import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { LocaisCompeticoes } from '../../../shared/models/locaisCompeticoes';
import { LocaisCompeticoesService } from './locais-competicoes-select.service';


@Component({
  selector: 'app-locais-competicoes-select',
  template: `
    <nb-select 
      placeholder="Locais competições"
      status="info"
      [(selected)]="selectedItem" 
      [fullWidth]="true"
      (selectedChange)="onlocaisCompeticoesServiceChange($event)"
      #selectComponent
    >
      <nb-option *ngFor="let localCompeticao of locaisCompeticoes" [value]="localCompeticao.id">
        {{ localCompeticao.nome }}
      </nb-option>
    </nb-select>
  `,
  styleUrls: ['./locais-competicoes-select.component.scss']
})

export class LocalCompeticaoSelectComponent implements OnInit {

  @Input() cell: any; // Recebe a célula atual do ng2-smart-table
  
  locaisCompeticoes: LocaisCompeticoes[] = [];
  selectedItem: number;

  constructor(private locaisCompeticoesService: LocaisCompeticoesService) {
  }

  async ngOnInit() {
    this.locaisCompeticoes = await this.loadLocaisCompeticoes();
    // Inicializa selectedItem com o valor da célula (se houver)
    this.selectedItem = this.cell.newValue || null;
  }

  async loadLocaisCompeticoes() {
    try {
      return await this.locaisCompeticoesService.listAll();
    } catch (error) {
      console.error('Erro ao carregar local Competicão', error);
      return []; // Retorne um array vazio caso ocorra um erro
    }
  }

  onlocaisCompeticoesServiceChange(newLocalCompeticao: number) {
    this.cell.newValue = newLocalCompeticao; // Salva o valor na célula
  }

}
