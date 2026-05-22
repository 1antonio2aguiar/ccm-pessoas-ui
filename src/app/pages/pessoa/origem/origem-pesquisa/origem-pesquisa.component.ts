import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NbToastrService } from '@nebular/theme';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { OrigemService, CadUnicoPessoaOrigemDTO, CadUnicoEnderecoOrigemDTO } from '../origem.service';

@Component({
  selector: 'ngx-origem-pesquisa',
  templateUrl: './origem-pesquisa.component.html',
  styleUrls: ['./origem-pesquisa.component.scss'],
})
export class OrigemPesquisaComponent implements OnInit, OnDestroy {

  pessoaId: number | null = null;
  origens: CadUnicoPessoaOrigemDTO[] = [];
  isLoading = false;

  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private origemService: OrigemService,
    private toastrService: NbToastrService,
  ) { }

  ngOnInit(): void {
    this.route.parent?.params
      .pipe(takeUntil(this.destroy$))
      .subscribe(parentParams => {
        if (parentParams['id']) {
          this.pessoaId = +parentParams['id'];
          this.carregarOrigens();
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  carregarOrigens(): void {
    if (!this.pessoaId) {
      this.origens = [];
      return;
    }

    this.isLoading = true;

    this.origemService.buscarOrigens(this.pessoaId)
      .toPromise()
      .then((origens) => {
        this.origens = origens ?? [];
      })
      .catch((erro) => {
        console.error('Erro ao carregar origens:', erro);
        this.origens = [];
        this.toastrService.danger('Erro ao carregar dados de origem.', 'Erro');
      })
      .finally(() => {
        this.isLoading = false;
      });
  }

  formatarCpfCnpj(valor: number | string): string {
    const digits = String(valor ?? '').replace(/\D/g, '');

    if (digits.length === 11) {
      return `${digits.substring(0, 3)}.${digits.substring(3, 6)}.${digits.substring(6, 9)}-${digits.substring(9, 11)}`;
    }

    if (digits.length === 14) {
      return `${digits.substring(0, 2)}.${digits.substring(2, 5)}.${digits.substring(5, 8)}/${digits.substring(8, 12)}-${digits.substring(12, 14)}`;
    }

    return String(valor ?? '');
  }

  formatarData(valor: string): string {
    if (!valor) {
      return '';
    }

    const s = String(valor).substring(0, 10);
    const partes = s.split('-');

    if (partes.length === 3) {
      return `${partes[2]}/${partes[1]}/${partes[0]}`;
    }

    return String(valor);
  }

  formatarCep(valor: number | string): string {
    const digits = String(valor ?? '').replace(/\D/g, '');

    if (digits.length === 8) {
      return `${digits.substring(0, 5)}-${digits.substring(5, 8)}`;
    }

    return String(valor ?? '');
  }

  enderecoLinha(endereco: CadUnicoEnderecoOrigemDTO): string {
    const partes: string[] = [];

    if (endereco.tipoLogradouro) partes.push(endereco.tipoLogradouro);
    if (endereco.logradouroNome) partes.push(endereco.logradouroNome);
    if (endereco.numero) partes.push(`Nº ${endereco.numero}`);
    if (endereco.complemento) partes.push(endereco.complemento);

    return partes.join(' ');
  }
}
