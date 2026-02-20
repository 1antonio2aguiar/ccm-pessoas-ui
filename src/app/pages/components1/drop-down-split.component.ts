import { Component, Input, OnInit, Output } from '@angular/core';
import { EventEmitter } from '@angular/core';

@Component({
  selector: 'ngx-pontua-split',
  template: `
    <div class="btn-group me-3" ngbDropdown role="group" aria-label="Pontuação">
      <button name="nao"
        type="button"
        class="btn meu-botao-nao" 
        (click)="onOptionChange('N')"
        ngbDropdownToggle
      >
        Não
      </button>
      <button name="sim"
        type="button"
        class="btn meu-botao-sim" 
        (click)="onOptionChange('S')"
        ngbDropdownToggle
      >
        Sim
      </button>
    </div>
  `,
  styles: [
    `.meu-botao {
      border: none;
      background-color: #a19c9d;
    }
    .meu-botao-destacado-sim {
      background-color: #cdc5c6;
    }
    .meu-botao-destacado-nao {
      background-color: #cdc5c6;
    }
  `
  ]
})

export class DropDownSplitComponent implements OnInit {
  @Input() cell: any;
  @Output() cellChange = new EventEmitter<any>();

  checked: string; // Armazena 'S' ou 'N'

  ngOnInit() {
    this.checked = this.cell.newValue || 'N'; // Se não houver valor, assume 'N'
  }

  onOptionChange(event: string) {
    this.checked = event;

    if (this.checked == 'N') {
      const buttons = document.getElementsByName('nao');
      buttons[0].classList.add('meu-botao-destacado-nao');

      const buttonsRemClass = document.getElementsByName('sim');
      buttonsRemClass[0].classList.remove('meu-botao-destacado-sim');
    } else {
      const buttons = document.getElementsByName('sim');
      buttons[0].classList.add('meu-botao-destacado-sim');

      const buttonsRemClass = document.getElementsByName('nao');
      buttonsRemClass[0].classList.remove('meu-botao-destacado-nao');
    }

    this.cell.newValue = this.checked;
    this.cellChange.emit(this.cell);
  }
}