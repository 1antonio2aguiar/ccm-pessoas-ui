
import { Component, Input, OnInit, Output, EventEmitter, AfterViewInit } from '@angular/core';

@Component({
  selector: 'ngx-pontua-split',
  templateUrl: './drop-down-yesno-pontua.component.html',
  styleUrls: ['./drop-down-yesno.component.scss']
})

export class DropDownPontuaComponent implements OnInit {
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
    const buttonName = `meu-botao-destacado-pontua${option}`;
    const buttons = document.getElementsByName(`pontua${option}`);
    buttons[0].classList.add(buttonName);

    const oppositeOption = option === 'S' ? 'N' : 'S';
    const oppositeButtonName = `meu-botao-destacado-pontua${oppositeOption}`;
    const oppositeButtons = document.getElementsByName(`pontua${oppositeOption}`);
    oppositeButtons[0].classList.remove(oppositeButtonName);
  }
}

@Component({
  selector: 'ngx-acumula-split',
  templateUrl: './drop-down-yesno-acumula.component.html',
  styleUrls: ['./drop-down-yesno.component.scss']
})

export class DropDownAcumulaComponent implements OnInit {
  @Input() cell: any;
  @Output() cellChange = new EventEmitter<any>();

  ngOnInit() {
    this.toggleButtonStyles(this.cell.newValue);
  }

  onOptionChange(event: string) {
    this.toggleButtonStyles(event);
    this.cell.newValue = event;
    this.cellChange.emit(event);
  }

  private toggleButtonStyles(option: string) {
    const buttonName = `meu-botao-destacado-acumula${option}`;
    const buttons = document.getElementsByName(`acumula${option}`);
    buttons[0].classList.add(buttonName);

    const oppositeOption = option === 'S' ? 'N' : 'S';
    const oppositeButtonName = `meu-botao-destacado-acumula${oppositeOption}`;
    const oppositeButtons = document.getElementsByName(`acumula${oppositeOption}`);
    oppositeButtons[0].classList.remove(oppositeButtonName);
  }

}

