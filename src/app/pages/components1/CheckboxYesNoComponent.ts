import { Component, Input, OnInit, Output } from "@angular/core";
import * as EventEmitter from "events";

@Component({
  selector: 'ngx-pontua-checkbox',
  template: `
    <div class="pontua-options-container">
      <div class="pontua-options">
        <label>
          <input type="radio" name="pontua" value="S" [checked]="checked === 'S'" (change)="onOptionChange($event)"> Sim
        </label>
        <label>
          <input type="radio" name="pontua" value="N" [checked]="checked === 'N'" (change)="onOptionChange($event)"> Não
        </label>
      </div>
    </div>
  `,
  styles: [
    `
    .pontua-options {
      display: flex;
      align-items: center; 
      justify-content: center;
    }
    .pontua-options label {
      margin-right: 5px; 
      font-weight: bold;

    }
    .pontua-options-container {
      border: 0.800px solid #BDBDBD; /* Borda azul de 2px */
      padding: 5px;
      border-radius: 5px;
      width: 115px;
    }
    `
  ],
  //styleUrls: ['./CheckboxYesNoComponent.scss']
})
  
export class CheckboxYesNoComponent implements OnInit {
  @Input() cell: any;
  @Output() cellChange = new EventEmitter();

  checked: string; // Armazena 'S' ou 'N'

  ngOnInit() {
    this.checked = this.cell.newValue || 'N'; // Se não houver valor, assume 'N'
  }

  onOptionChange(event: any) {
    this.checked = event.target.value; // Captura 'S' ou 'N'
    this.cell.newValue = this.checked;
    this.cellChange.emit(this.cell);
  }
}