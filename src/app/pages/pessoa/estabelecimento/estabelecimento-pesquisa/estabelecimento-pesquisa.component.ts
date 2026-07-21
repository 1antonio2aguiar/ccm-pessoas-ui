import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { NbDialogService, NbToastrService } from '@nebular/theme';

import { PessoaService } from '../../pessoa.service';
import { PessoaContextService } from '../../../../services/pessoa-context.service';
import { EstabelecimentoIudComponent } from '../estabelecimento-iud/estabelecimento-iud.component';
import { ConfirmDeleteComponent } from '../../../components/base-resource-confirmation-delete/confirm-delete-modal.component';

interface EstabelecimentoDisplay {
  id: number;
  cnpj: string;
  nome: string;
  estabelecimento: number | null;
  nomeFantasia: string;
  objetoSocial: string;
  microEmpresa: string;
  tipoEmpresa: number | null;
}

@Component({
  selector: 'ngx-estabelecimento-pesquisa',
  templateUrl: './estabelecimento-pesquisa.component.html',
  styleUrls: ['./estabelecimento-pesquisa.component.scss'],
})
export class EstabelecimentoPesquisaComponent implements OnInit, OnDestroy {

  pessoaId: number | null = null;
  nomePessoa: string | null = null;

  estabelecimentos: EstabelecimentoDisplay[] = [];
  isLoading = false;

  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private pessoaService: PessoaService,
    private pessoaContextService: PessoaContextService,
    private dialogService: NbDialogService,
    private toastrService: NbToastrService,
  ) {
  }

  ngOnInit(): void {
    this.route.parent?.params
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        if (params['id']) {
          this.pessoaId = Number(params['id']);
          this.carregarEstabelecimentos();
        }
      });

    this.pessoaContextService.pessoaNome$
      .pipe(takeUntil(this.destroy$))
      .subscribe(nome => {
        this.nomePessoa = nome;
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  carregarEstabelecimentos(): void {
    if (!this.pessoaId) {
      this.estabelecimentos = [];
      return;
    }

    this.isLoading = true;

    this.pessoaService.getPessoaById(this.pessoaId)
      .then((pessoa: any) => {
        const lista = pessoa?.dadosPessoasJuridicas ?? [];

        this.estabelecimentos = lista.map((item: any) => ({
          id: item.id,
          cnpj: item.cnpj ?? '',
          nome: item.nome ?? '',
          estabelecimento: item.estabelecimento ?? null,
          nomeFantasia: item.nomeFantasia ?? '',
          objetoSocial: item.objetoSocial ?? '',
          microEmpresa: item.microEmpresa ?? 'N',
          tipoEmpresa: item.tipoEmpresa ?? null,
        }));
      })
      .catch(error => {
        console.error('Erro ao carregar estabelecimentos:', error);
        this.estabelecimentos = [];
      })
      .finally(() => {
        this.isLoading = false;
      });
  }

  formatarCnpj(value: string): string {
    const cnpj = String(value ?? '').replace(/\D/g, '');

    if (cnpj.length !== 14) {
      return value ?? '';
    }

    return cnpj.replace(
      /(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/,
      '$1.$2.$3/$4-$5',
    );
  }

  novoEstabelecimento(): void {
    this.dialogService.open(EstabelecimentoIudComponent, {
      context: {
        pessoaId: this.pessoaId,
        nomePessoa: this.nomePessoa,
      },
      closeOnBackdropClick: false,
    }).onClose.subscribe(estabelecimentoSalvo => {
      if (estabelecimentoSalvo) {
        this.carregarEstabelecimentos();
      }
    });
  } 

  editarEstabelecimento(estabelecimento: any): void {
    this.dialogService.open(EstabelecimentoIudComponent, {
      context: {
        pessoaId: this.pessoaId,
        nomePessoa: this.nomePessoa,
        estabelecimentoParaEdicao: estabelecimento,
      },
      closeOnBackdropClick: false,
    }).onClose.subscribe(estabelecimentoSalvo => {
      if (estabelecimentoSalvo) {
        this.carregarEstabelecimentos();
      }
    });
  }

  excluirEstabelecimento(estabelecimento: any): void {
    if (!this.pessoaId) {
      this.toastrService.danger(
        'Código da pessoa não encontrado.',
        'Erro',
      );
      return;
    }

    const estabelecimentoDescricao =
      estabelecimento.nome ||
      estabelecimento.nomeFantasia ||
      this.formatarCnpj(estabelecimento.cnpj) ||
      'Estabelecimento não informado';

    this.dialogService.open(ConfirmDeleteComponent, {
      context: {
        title: 'Excluir Estabelecimento',
        message: `Tem certeza que deseja excluir o estabelecimento "${estabelecimentoDescricao}"?`,
      },
      closeOnBackdropClick: false,
    }).onClose.subscribe(confirmed => {
      if (!confirmed) {
        return;
      }

      this.isLoading = true;

      this.pessoaService.getPessoaById(this.pessoaId!)
        .then((pessoa: any) => {
          const listaAtual =
            pessoa?.dadosPessoasJuridicas ?? [];

          const novaLista = listaAtual.filter(
            (item: any) =>
              Number(item.id) !== Number(estabelecimento.id)
          );

          const payload = {
            dadosPessoasJuridicas: novaLista,
          };

          return this.pessoaService
            .updatePessoa(this.pessoaId!, payload)
            .toPromise();
        })
        .then(() => {
          this.toastrService.success(
            'Estabelecimento excluído com sucesso!',
            'Sucesso',
          );

          this.carregarEstabelecimentos();
        })
        .catch((erro) => {
          console.error(
            'Erro ao excluir estabelecimento:',
            erro,
          );

          const errorMessage =
            erro?.error?.message ||
            erro?.message ||
            'Falha ao excluir o estabelecimento. Tente novamente.';

          this.toastrService.danger(
            errorMessage,
            'Erro',
          );
        })
        .finally(() => {
          this.isLoading = false;
        });
    });
  }
}