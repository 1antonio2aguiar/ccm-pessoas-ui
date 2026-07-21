import {  Component,  Input,  OnDestroy,  OnInit} from '@angular/core';
import {  FormBuilder,  FormGroup,  Validators} from '@angular/forms';

import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import {  NbDialogRef,  NbToastrService} from '@nebular/theme';

import { DocumentoService } from '../documento.service';
import { PessoaService } from '../../pessoa.service';
import { EstabelecimentoSelect } from '../../../../shared/models/estabelecimento-select';
import { DocumentoIn } from '../../../../shared/models/documentoIn';

@Component({
  selector: 'ngx-documento-iud',
  templateUrl: './documento-iud.component.html',
  styleUrls: ['./documento-iud.component.scss']
})
export class DocumentoIudComponent implements OnInit, OnDestroy {

  @Input()
  documentoParaEdicao: any;

  @Input()
  pessoaId: number | null = null;

  @Input()
  nomePessoa: string | null = null;

  documentoForm!: FormGroup;

  modoEdicao = false;
  isLoadingSalvar = false;

  estabelecimentos: EstabelecimentoSelect[] = [];

  private destroy$ = new Subject<void>();

  constructor(
    protected dialogRef: NbDialogRef<DocumentoIudComponent>,
    private toastrService: NbToastrService,
    private fb: FormBuilder,
    private documentoService: DocumentoService,
    private pessoaService: PessoaService
  ) {}

  ngOnInit(): void {

    this.modoEdicao =
      !!this.documentoParaEdicao;

    this.initForm();

    this.configurarTitularDocumento();

    if (
      this.modoEdicao &&
      this.documentoParaEdicao
    ) {

      const titularDocumento =
        this.documentoParaEdicao
          .dadosPessoaJuridicaId != null
          ? 'ESTABELECIMENTO'
          : 'PESSOA_FISICA';

      this.documentoForm.patchValue(
        {
          id:
            this.documentoParaEdicao.id ??
            null,

          nomePessoa:
            this.nomePessoa ??
            this.documentoParaEdicao.pessoaNome ??
            '',

          titularDocumento:
            titularDocumento,

          dadosPessoaJuridicaId:
            this.documentoParaEdicao
              .dadosPessoaJuridicaId != null
              ? Number(
                  this.documentoParaEdicao
                    .dadosPessoaJuridicaId
                )
              : null,

          tipoDocumento:
            this.documentoParaEdicao
              .tipoDocumento != null
              ? String(
                  this.documentoParaEdicao
                    .tipoDocumento
                )
              : null,

          tipoDocumentoDescricao:
            this.documentoParaEdicao
              .tipoDocumentoDescricao ??
            null,

          numeroDocumento:
            this.documentoParaEdicao
              .numeroDocumento ??
            '',

          documentoOrigem:
            this.documentoParaEdicao
              .documentoOrigem ??
            null,

          orgaoExpedidor:
            this.documentoParaEdicao
              .orgaoExpedidor ??
            null,

          categoriaCnh:
            this.documentoParaEdicao
              .categoriaCnh ??
            null,

          dataDocumento:
            this.documentoParaEdicao
              .dataDocumento ??
            null,

          dataExpedicao:
            this.documentoParaEdicao
              .dataExpedicao ??
            null,

          dataValidade:
            this.documentoParaEdicao
              .dataValidade ??
            null,

          dataPrimeiraCnh:
            this.documentoParaEdicao
              .dataPrimeiraCnh ??
            null,

          zona:
            this.documentoParaEdicao.zona ??
            null,

          secao:
            this.documentoParaEdicao.secao ??
            null,

          observacao:
            this.documentoParaEdicao
              .observacao ??
            null
        },
        {
          emitEvent: false
        }
      );

      /*
       * Garante explicitamente que o radio correto
       * permaneça selecionado na edição.
       */
      this.documentoForm
        .get('titularDocumento')
        ?.setValue(
          titularDocumento,
          {
            emitEvent: false
          }
        );
    }

    /*
     * Carregamos os estabelecimentos depois do patch,
     * igual ao módulo de Contato.
     */
    this.carregarEstabelecimentos();

    this.aplicarProtecaoCamposEdicao();
  }

  ngOnDestroy(): void {

    this.destroy$.next();
    this.destroy$.complete();
  }

  private initForm(): void {

    this.documentoForm = this.fb.group({
      id: [null],

      nomePessoa: [
        this.nomePessoa
      ],

      titularDocumento: [
        null,
        Validators.required
      ],

      dadosPessoaJuridicaId: [
        null
      ],

      tipoDocumento: [
        null,
        Validators.required
      ],

      tipoDocumentoDescricao: [
        null
      ],

      numeroDocumento: [
        '',
        Validators.required
      ],

      documentoOrigem: [
        null
      ],

      orgaoExpedidor: [
        null
      ],

      categoriaCnh: [
        null
      ],

      dataDocumento: [
        null
      ],

      dataExpedicao: [
        null
      ],

      dataValidade: [
        null
      ],

      dataPrimeiraCnh: [
        null
      ],

      zona: [
        null
      ],

      secao: [
        null
      ],

      observacao: [
        null
      ]
    });
  }

  salvar(): void {

    if (this.documentoForm.invalid) {

      this.documentoForm.markAllAsTouched();

      this.toastrService.warning(
        'Preencha os campos obrigatórios.',
        'Atenção'
      );

      return;
    }

    this.isLoadingSalvar = true;

    /*
     * getRawValue() é necessário porque os campos
     * protegidos ficam desabilitados durante a edição.
     */
    const formValue =
      this.documentoForm.getRawValue();

    const payload: DocumentoIn = {
      id:
        this.modoEdicao
          ? this.documentoParaEdicao.id
          : undefined,

      pessoaId:
        this.pessoaId ?? undefined,

      dadosPessoaJuridicaId:
        formValue.titularDocumento === 'ESTABELECIMENTO'
          ? Number(formValue.dadosPessoaJuridicaId)
          : null,

      tipoDocumento:
        formValue.tipoDocumento !== null &&
        formValue.tipoDocumento !== undefined &&
        formValue.tipoDocumento !== ''
          ? Number(formValue.tipoDocumento)
          : undefined,

      numeroDocumento:
        formValue.numeroDocumento,

      dataDocumento:
        formValue.dataDocumento || undefined,

      dataExpedicao:
        formValue.dataExpedicao || undefined,

      documentoOrigem:
        formValue.documentoOrigem || undefined,

      orgaoExpedidor:
        formValue.orgaoExpedidor || undefined,

      dataPrimeiraCnh:
        formValue.dataPrimeiraCnh || undefined,

      dataValidade:
        formValue.dataValidade || undefined,

      categoriaCnh:
        formValue.categoriaCnh || undefined,

      zona:
        formValue.zona !== null &&
        formValue.zona !== undefined &&
        formValue.zona !== ''
          ? Number(formValue.zona)
          : undefined,

      secao:
        formValue.secao !== null &&
        formValue.secao !== undefined &&
        formValue.secao !== ''
          ? Number(formValue.secao)
          : undefined,

      observacao:
        formValue.observacao || undefined
    };

    const operacao =
      this.modoEdicao
        ? this.documentoService.update(payload)
        : this.documentoService.create(payload);

    operacao
      .pipe(
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: resultado => {

          this.isLoadingSalvar = false;

          this.toastrService.success(
            `Documento ${
              this.modoEdicao
                ? 'atualizado'
                : 'criado'
            } com sucesso!`,
            'Sucesso'
          );

          this.dialogRef.close(resultado);
        },

        error: erro => {

          this.isLoadingSalvar = false;

          console.error(
            'Erro ao salvar documento:',
            erro
          );

          this.toastrService.danger(
            'Falha ao salvar documento. Tente novamente.',
            'Erro'
          );
        }
      });
  }

  cancelar(): void {

    this.dialogRef.close();
  }

  private configurarTitularDocumento(): void {

    const titularControl =
      this.documentoForm.get(
        'titularDocumento'
      );

    const estabelecimentoControl =
      this.documentoForm.get(
        'dadosPessoaJuridicaId'
      );

    titularControl?.valueChanges
      .pipe(
        takeUntil(this.destroy$)
      )
      .subscribe(
        (titular: string | null) => {

          if (
            titular === 'ESTABELECIMENTO'
          ) {

            estabelecimentoControl
              ?.setValidators(
                Validators.required
              );

          } else {

            estabelecimentoControl
              ?.clearValidators();

            estabelecimentoControl
              ?.setValue(
                null,
                {
                  emitEvent: false
                }
              );
          }

          estabelecimentoControl
            ?.updateValueAndValidity({
              emitEvent: false
            });
        }
      );
  }

  private carregarEstabelecimentos(): void {

    if (!this.pessoaId) {

      this.estabelecimentos = [];
      return;
    }

    this.pessoaService
      .getEstabelecimentos(
        this.pessoaId
      )
      .then(
        (
          estabelecimentos:
            EstabelecimentoSelect[]
        ) => {

          this.estabelecimentos =
            estabelecimentos ?? [];

          /*
           * Na inclusão não há estabelecimento
           * previamente selecionado.
           */
          if (
            !this.modoEdicao ||
            this.documentoParaEdicao
              ?.dadosPessoaJuridicaId == null
          ) {
            return;
          }

          const estabelecimentoId =
            Number(
              this.documentoParaEdicao
                .dadosPessoaJuridicaId
            );

          const estabelecimentoEncontrado =
            this.estabelecimentos.find(
              estabelecimento =>
                Number(
                  estabelecimento.id
                ) === estabelecimentoId
            );

          if (
            estabelecimentoEncontrado?.id !=
            null
          ) {

            this.documentoForm
              .get(
                'dadosPessoaJuridicaId'
              )
              ?.setValue(
                Number(
                  estabelecimentoEncontrado.id
                ),
                {
                  emitEvent: false
                }
              );
          }
        }
      )
      .catch(erro => {

        console.error(
          'Erro ao carregar estabelecimentos:',
          erro
        );

        this.estabelecimentos = [];
      });
  }

  private aplicarProtecaoCamposEdicao(): void {

    if (!this.modoEdicao) {
      return;
    }

    /*
     * Na edição não será permitido alterar:
     *
     * - o tipo do documento;
     * - se pertence à pessoa ou estabelecimento;
     * - o estabelecimento selecionado.
     */

    this.documentoForm
      .get('tipoDocumento')
      ?.disable({
        emitEvent: false
      });

    this.documentoForm
      .get('titularDocumento')
      ?.disable({
        emitEvent: false
      });

    this.documentoForm
      .get('dadosPessoaJuridicaId')
      ?.disable({
        emitEvent: false
      });
  }

  formatarCnpj(value: any): string {

    if (!value) {
      return '';
    }

    const cnpj =
      String(value).replace(
        /\D/g,
        ''
      );

    if (cnpj.length !== 14) {
      return String(value);
    }

    return cnpj.replace(
      /(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/,
      '$1.$2.$3/$4-$5'
    );
  }
}