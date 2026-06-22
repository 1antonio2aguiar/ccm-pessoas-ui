import { Component, OnInit } from '@angular/core';

import {
  CadUnicoDashboardResumo,
  CadUnicoDashboardService
} from '../cad-unico-dashboard.service';

@Component({
  selector: 'ngx-cad-unico-dashboard',
  templateUrl: './cad-unico-dashboard.component.html',
  styleUrls: ['./cad-unico-dashboard.component.scss'],
})
export class CadUnicoDashboardComponent implements OnInit {

  resumo?: CadUnicoDashboardResumo;
  origemChartOptions: any;
  tipoPessoaChartOptions: any;

  isLoading = false;

  constructor(
    private service: CadUnicoDashboardService,
  ) {}

  ngOnInit(): void {
    this.carregarResumo();
  }

  carregarResumo(): void {

    this.isLoading = true;

    this.service.buscarResumo()
      .then((resumo) => {
        this.resumo = resumo;
        this.montarGraficos();
      })
      .finally(() => {
        this.isLoading = false;
      });
  }

  private montarGraficos(): void {
    if (!this.resumo) {
      return;
    }

    this.origemChartOptions = {
      tooltip: {
        trigger: 'item',
        formatter: '{b}: {c} ({d}%)',
      },
      legend: {
        orient: 'horizontal',
        bottom: 0,
      },
      series: [
        {
          name: 'Origem',
          type: 'pie',
          radius: ['45%', '70%'],
          avoidLabelOverlap: true,
          label: {
            formatter: '{b}\n{c}',
          },
          data: [
            {
              value: this.resumo.totalOrigemPessoas,
              name: 'PESSOAS',
            },
            {
              value: this.resumo.totalOrigemRh,
              name: 'RH',
            },
            {
              value: this.resumo.totalOrigemSane,
              name: 'SANE',
            },
          ],
        },
      ],
    };

    this.tipoPessoaChartOptions = {
      tooltip: {
        trigger: 'item',
        formatter: '{b}: {c} ({d}%)',
      },
      legend: {
        orient: 'horizontal',
        bottom: 0,
      },
      series: [
        {
          name: 'Tipo Pessoa',
          type: 'pie',
          radius: ['45%', '70%'],
          avoidLabelOverlap: true,
          label: {
            formatter: '{b}\n{c}',
          },
          data: [
            {
              value: this.resumo.totalCpf,
              name: 'CPF',
            },
            {
              value: this.resumo.totalCnpj,
              name: 'CNPJ',
            },
          ],
        },
      ],
    };
  }
}