import { Component, Input, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import {
  NbDialogRef,
  NbToastrService,
} from '@nebular/theme';

import { PessoaService } from '../../pessoa.service';

@Component({
  selector: 'ngx-estabelecimento-iud',
  templateUrl: './estabelecimento-iud.component.html',
  styleUrls: ['./estabelecimento-iud.component.scss'],
})
export class EstabelecimentoIudComponent implements OnInit {

  @Input() pessoaId: number | null = null;
  @Input() nomePessoa: string | null = null;
  @Input() estabelecimentoParaEdicao: any = null;

  estabelecimentoForm!: FormGroup;

  isLoading = false;
  cnpjDuplicado = false;

  constructor(
    private fb: FormBuilder,
    private pessoaService: PessoaService,
    private toastrService: NbToastrService,
    protected dialogRef: NbDialogRef<EstabelecimentoIudComponent>,
  ) {
  }

  ngOnInit(): void {
    this.inicializarFormulario();

    if (this.estabelecimentoParaEdicao) {
      this.carregarDadosParaEdicao();
    }
  }

  private inicializarFormulario(): void {
    this.estabelecimentoForm = this.fb.group({
      id: [null],

      pessoaId: [this.pessoaId, Validators.required],

      cnpj: [
        '',
        Validators.required,
      ],

      nome: [
        '',
        Validators.required,
      ],

      estabelecimento: [null],

      tipoEmpresa: [
        null,
        Validators.required,
      ],

      microEmpresa: [
        'N',
        Validators.required,
      ],

      nomeFantasia: [''],

      objetoSocial: [''],
    });
  }

  private carregarDadosParaEdicao(): void {
    const estabelecimento = this.estabelecimentoParaEdicao;

    this.estabelecimentoForm.patchValue({
      id: estabelecimento.id ?? null,
      pessoaId: this.pessoaId,
      cnpj: this.formatarCnpj(estabelecimento.cnpj),
      nome: estabelecimento.nome ?? '',
      estabelecimento: estabelecimento.estabelecimento ?? null,
      tipoEmpresa:
        estabelecimento.tipoEmpresa !== null &&
        estabelecimento.tipoEmpresa !== undefined
          ? Number(estabelecimento.tipoEmpresa)
          : null,
      microEmpresa: estabelecimento.microEmpresa ?? 'N',
      nomeFantasia: estabelecimento.nomeFantasia ?? '',
      objetoSocial: estabelecimento.objetoSocial ?? '',
    });

    this.estabelecimentoForm.get('cnpj')?.disable();
  }

  salvar(): void {
    if (this.estabelecimentoForm.invalid) {
      this.estabelecimentoForm.markAllAsTouched();
      return;
    }

    if (!this.pessoaId) {
      this.toastrService.danger(
        'Código da pessoa não encontrado.',
        'Erro',
      );
      return;
    }

    this.isLoading = true;

    this.pessoaService.getPessoaById(this.pessoaId)
      .then((pessoa: any) => {

        const listaAtual = [
          ...(pessoa?.dadosPessoasJuridicas ?? []),
        ];

        const formValue = this.estabelecimentoForm.getRawValue();

        const estabelecimento = {
          id: formValue.id ?? null,
          cnpj: String(formValue.cnpj ?? '').replace(/\D/g, ''),
          nome: String(formValue.nome ?? '').trim().toUpperCase(),
          estabelecimento: formValue.estabelecimento ?? null,
          tipoEmpresa: formValue.tipoEmpresa ?? null,
          microEmpresa: formValue.microEmpresa ?? 'N',
          nomeFantasia: formValue.nomeFantasia
            ? String(formValue.nomeFantasia).trim().toUpperCase()
            : null,
          objetoSocial: formValue.objetoSocial
            ? String(formValue.objetoSocial).trim()
            : null,
          conjuge: null,
          mesEnvioSicom: null,
          anoEnvioSicom: null,
        };

        let novaLista: any[];

        if (estabelecimento.id) {
          novaLista = listaAtual.map((item: any) =>
            Number(item.id) === Number(estabelecimento.id)
              ? estabelecimento
              : item
          );
        } else {
          novaLista = [
            ...listaAtual,
            estabelecimento,
          ];
        }

        const payload = {
          dadosPessoasJuridicas: novaLista,
        };

        return this.pessoaService
          .updatePessoa(this.pessoaId!, payload)
          .toPromise();
      })
      .then((resultado) => {
        this.toastrService.success(
          this.estabelecimentoParaEdicao
            ? 'Estabelecimento atualizado com sucesso!'
            : 'Estabelecimento cadastrado com sucesso!',
          'Sucesso',
        );

        this.dialogRef.close(resultado);
      })
      .catch((erro) => {
        console.error('Erro ao salvar estabelecimento:', erro);

        this.toastrService.danger(
          'Falha ao salvar o estabelecimento.',
          'Erro',
        );
      })
      .finally(() => {
        this.isLoading = false;
      });
  }

  cancelar(): void {
    this.dialogRef.close();
  }

  private formatarCnpj(value: any): string {
    if (!value) {
      return '';
    }

    const cnpj = String(value).replace(/\D/g, '').padStart(14, '0');

    if (cnpj.length !== 14) {
      return String(value);
    }

    return cnpj.replace(
      /(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/,
      '$1.$2.$3/$4-$5',
    );
  } 
}