
import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NbToastrService } from '@nebular/theme';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { ImovelDTO, ImovelService } from '../imovel.service';

@Component({
  selector: 'ngx-imovel-pesquisa',
  templateUrl: './imovel-pesquisa.component.html',
  styleUrls: ['./imovel-pesquisa.component.scss'],
})
export class ImovelPesquisaComponent implements OnInit, OnDestroy {

  pessoaId: number | null = null;
  imoveis: ImovelDTO[] = [];
  carregando = false;

  // Permite expandir mais de um imóvel simultaneamente.
  expandidos = new Set<number>();

  private destroy$ = new Subject<void>();

  private readonly moeda = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });

  constructor(
    private route: ActivatedRoute,
    private service: ImovelService,
    private toastr: NbToastrService,
  ) {}

  ngOnInit(): void {
    this.route.parent?.params
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        this.pessoaId = params['id'] ? +params['id'] : null;
        this.carregar();
      });
  }

  carregar(): void {
    this.imoveis = [];
    this.expandidos.clear();

    if (!this.pessoaId) {
      return;
    }

    this.carregando = true;

    this.service.listarPorPessoa(this.pessoaId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: dados => {
          this.imoveis = dados || [];
          this.carregando = false;
        },
        error: erro => {
          console.error('Erro ao carregar imóveis:', erro);
          this.toastr.danger(
            'Não foi possível consultar os imóveis.',
            'Erro',
          );
          this.carregando = false;
        },
      });
  }

  possuiDividas(imovel: ImovelDTO): boolean {
    return (imovel.dividas?.length || 0) > 0;
  }

  estaExpandido(imovel: ImovelDTO): boolean {
    return this.expandidos.has(imovel.imovel);
  }

  alternar(imovel: ImovelDTO): void {
    if (!this.possuiDividas(imovel)) {
      return;
    }

    if (this.expandidos.has(imovel.imovel)) {
      this.expandidos.delete(imovel.imovel);
    } else {
      this.expandidos.add(imovel.imovel);
    }
  }

  endereco(imovel: ImovelDTO): string {
    const via = [
      imovel.tipoLogradouro,
      imovel.logradouro,
    ].filter(Boolean).join(' ');

    const linha = [
      via,
      imovel.numero,
      imovel.complemento,
    ].filter(Boolean).join(', ');

    const cidade = [
      imovel.cidade,
      imovel.uf,
    ].filter(Boolean).join(' / ');

    return [
      linha,
      imovel.bairro,
      cidade,
    ].filter(Boolean).join(' — ');
  }

  formatarMoeda(valor: number | null | undefined): string {
    return this.moeda.format(Number(valor) || 0);
  }

  ngOnDestroy(): void {
      this.destroy$.next();
      this.destroy$.complete();
    }

    get quantidadeImoveis(): number {
    return this.imoveis.length;
  }

  get quantidadeComDebitos(): number {
    return this.imoveis.filter(
      imovel => (imovel.dividas?.length || 0) > 0
    ).length;
  }

  get totalGeralDebitos(): number {
    return this.imoveis.reduce(
      (total, imovel) => total + (Number(imovel.total) || 0),
      0
    );
  }
}
