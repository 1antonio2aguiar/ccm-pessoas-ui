import { Component, Input, OnInit, Output, EventEmitter, AfterViewInit } from '@angular/core';

@Component({
  selector: 'ngx-tipo-piscina-split',
  templateUrl: './drop-down-tipo-piscina.component.html',
  styleUrls: ['./drop-down-yesno.component.scss']
})

export class DropDownTipoPiscinaComponent implements OnInit {
  @Input() cell: any;
  @Output() cellChange = new EventEmitter<any>();

  ngOnInit() {
    this.toggleButtonStyles(this.cell.newValue);
  }

  onOptionChange(event: string) {
    this.toggleButtonStyles(event);
    this.cell.newValue = event;
    this.cellChange.emit(this.cell);
  }

  private toggleButtonStyles(option: string) {
    const buttonName = `meu-botao-destacado${option}`;
    const buttons = document.getElementsByName(`tipoPiscina${option}`);
    buttons[0].classList.add(buttonName);

    const oppositeOption = option === 'L' ? 'C' : 'L';
    const oppositeButtonName = `meu-botao-destacado${oppositeOption}`;
    const oppositeButtons = document.getElementsByName(`tipoPiscina${oppositeOption}`);
    oppositeButtons[0].classList.remove(oppositeButtonName);
  }

}
