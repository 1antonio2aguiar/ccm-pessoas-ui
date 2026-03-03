 import { Component, EventEmitter, Input, OnInit, Output, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { NbToastrService } from '@nebular/theme';
import { NbWindowRef } from '@nebular/theme';

import { Cep } from '../../../shared/models/cep';
import { CepService } from '../cep.service';

import { DistritoService } from '../../distrito/distrito.service';
import { LogradouroService } from '../../logradouro/logradouro.service';
import { BairroService } from '../../bairro/bairro.service';

// Ajuste os imports conforme seus models reais
import { Distrito } from '../../../shared/models/distrito';
import { LogradouroSimple } from '../../../shared/models/logradouroSimple';
import { BairroSimple } from '../../../shared/models/bairroSimple';

@Component({
  selector: 'ngx-cep-iud',
  templateUrl: './cep-iud.component.html',
  styleUrls: ['./cep-iud.component.scss'],
  encapsulation: ViewEncapsulation.None,
})

export class CepIudComponent implements OnInit {
  width = 900;
  saving = false;

  @Input() mode: 'add' | 'edit' = 'add';
  @Input() cep: Cep | undefined;
  @Output() cepSalvoOuAtualizado = new EventEmitter<any>();

  cepForm: FormGroup;

  // Autocomplete controls (fora do form pra não brigar com patchValue)
  cidadeCtrl = new FormControl('');
  logradouroCtrl = new FormControl('');
  bairroCtrl = new FormControl('');

  // ids selecionados
  cidadeId: number | null = null;
  distritoId: number | null = null;
  logradouroId: number | null = null;
  bairroId: number | null = null;

  estadoUf: string | null = null;
  tipoLogradouro: string | null = null;

  sugestoesCidades: Distrito[] = [];
  sugestoesLogradouros: LogradouroSimple[] = [];
  sugestoesBairros: BairroSimple[] = [];

  showCidadeDropdown = false;
  showLogradouroDropdown = false;
  showBairroDropdown = false;

  identificacaoOptions = [
    { value: 'U', label: 'Único' },
    { value: 'D', label: 'Direita' },
    { value: 'E', label: 'Esquerda' },
    { value: 'I', label: 'Ímpar' },
    { value: 'P', label: 'Par' },
    { value: 'A', label: 'Ambos' },
  ];

  constructor(
    private fb: FormBuilder,
    private cepService: CepService,
    private distritoService: DistritoService,
    private logradouroService: LogradouroService,
    private bairroService: BairroService,
    private toastr: NbToastrService,
    private windowRef: NbWindowRef,
  ) {}
  
  ngOnInit(): void {
    this.criarFormulario();
    this.configurarAutocompletes();

    this.cepForm.get('estadoUf')?.disable({ emitEvent: false });
    this.cepForm.get('tipoLogradouro')?.disable({ emitEvent: false });

    if (this.mode === 'edit' && this.cep) {
      this.cepForm.patchValue({
        id: this.cep.id,
        cep: this.somenteDigitos(this.cep.cep ?? ''),
        numeroIni: this.cep.numeroIni,
        identificacao: (this.cep as any)?.identificacao ?? null,
        
        // se você colocou no form:
        cidadeId: (this.cep as any)?.cidadeId ?? null,
        estadoUf: this.cep.estadoUf,
        tipoLogradouro: this.cep.tipoLogradouro,

        logradouroId: (this.cep as any)?.logradouroId ?? null,
        bairroId: (this.cep as any)?.bairroId ?? null,
      });

      this.cidadeId = (this.cep as any)?.cidadeId ?? null;
      this.distritoId = (this.cep as any)?.distritoId ?? null;

      // inputs visuais
      this.cidadeCtrl.setValue((this.cep as any)?.cidadeNome ?? '', { emitEvent: false });
      this.logradouroCtrl.setValue((this.cep as any)?.logradouroNome ?? '', { emitEvent: false });
      this.bairroCtrl.setValue((this.cep as any)?.bairroNome ?? '', { emitEvent: false });
      this.estadoUf = (this.cep as any)?.estadoUf ?? null;
      this.tipoLogradouro = (this.cep as any)?.tipoLogradouro ?? null;

      // ✅ no EDIT, logradouro/bairro devem ficar liberados
      this.logradouroCtrl.enable({ emitEvent: false });
      this.bairroCtrl.enable({ emitEvent: false });

      // bloqueia cidade + cep no modo edit
      this.cidadeCtrl.disable({ emitEvent: false });
      this.cepForm.get('cep')?.disable({ emitEvent: false });

      // ✅ sincroniza depois de setar cidadeId
      this.syncDisabledDependentes();
    }
  }

  private criarFormulario() {
    this.cepForm = this.fb.group({
      id: [null],

      cep: ['', [Validators.required, Validators.minLength(8)]],

      // ✅ REQUIRED
      cidadeId: [null, [Validators.required]],
      estadoUf:[null],
      tipoLogradouro:[null],

      // ✅ REQUIRED (o que grava no banco)
      logradouroId: [null, [Validators.required]],
      bairroId: [null, [Validators.required]],

      numeroIni: [1, [Validators.required]],
      numeroFim: [99999999, [Validators.required]],
      identificacao: [null, [Validators.required]], // se for obrigatório mesmo
    });
  }
  

  private configurarAutocompletes() {
    // Cidade (na verdade você busca distrito por cidadeNome)
    this.cidadeCtrl.valueChanges
      .pipe(debounceTime(250), distinctUntilChanged())
      .subscribe((value: any) => {
        if (this.mode === 'edit') return; // travado no edit

        const texto = (value ?? '').trim();
        if (texto.length < 2) {
          this.sugestoesCidades = [];
          return;
        }

        this.distritoService.filtrarPorCidadeNome(texto, 0, 20).subscribe({
          next: (lista: Distrito[]) => {
            this.sugestoesCidades = lista ?? [];
            this.showCidadeDropdown = true;
          },
          error: (err) => console.error('Erro ao buscar cidades:', err),
        });
      });

    // Logradouro
    this.logradouroCtrl.valueChanges
      .pipe(debounceTime(250), distinctUntilChanged())
      .subscribe((value: any) => {
        const texto = (value ?? '').trim();

        if (!this.cidadeId) {
          this.sugestoesLogradouros = [];
          this.showLogradouroDropdown = false;
          return;
        }

        if (texto.length < 2) {
          this.sugestoesLogradouros = [];
          return;
        }

        this.logradouroService.filtrarPorCidadeIdENome(this.cidadeId, texto, 0, 20).subscribe({
          next: (lista: LogradouroSimple[]) => {
            this.sugestoesLogradouros = lista ?? [];
            this.showLogradouroDropdown = true;
          },
          error: (err) => console.error('Erro ao buscar logradouros:', err),
        });
      });

    // Bairro
    this.bairroCtrl.valueChanges
      .pipe(debounceTime(250), distinctUntilChanged())
      .subscribe((value: any) => {
        const texto = (value ?? '').trim();

        if (!this.cidadeId) {
          this.sugestoesBairros = [];
          this.showBairroDropdown = false;
          return;
        }

        if (texto.length < 2) {
          this.sugestoesBairros = [];
          return;
        }

        this.bairroService.filtrarPorCidadeIdENome(this.cidadeId, texto, 0, 20).subscribe({
          next: (lista: BairroSimple[]) => {
            this.sugestoesBairros = lista ?? [];
            this.showBairroDropdown = true;
          },
          error: (err) => console.error('Erro ao buscar bairros:', err),
        });
      });

    // Bloqueia logradouro/bairro até ter cidadeId
    this.syncDisabledDependentes();
  }

  private syncDisabledDependentes() {
    // Logradouro
    if (!this.cidadeId) {
      if (this.logradouroCtrl.enabled) this.logradouroCtrl.disable({ emitEvent: false });
      if (this.bairroCtrl.enabled) this.bairroCtrl.disable({ emitEvent: false });
    } else {
      if (this.logradouroCtrl.disabled) this.logradouroCtrl.enable({ emitEvent: false });
      if (this.bairroCtrl.disabled) this.bairroCtrl.enable({ emitEvent: false });
    }
  }

  selecionarCidade(c: any) {
    const cidadeId = c?.cidadeId ?? null;
    const distritoId = c?.id ?? null; // <- aqui!

    this.cidadeCtrl.setValue(c?.cidadeNome ?? '', { emitEvent: false });
    this.cepForm.patchValue({ estadoUf: c?.estadoUf });

    // form
    this.cepForm.patchValue({ cidadeId });

    // variáveis
    this.cidadeId = cidadeId;
    this.distritoId = distritoId;

    // libera
    this.syncDisabledDependentes();

    // limpa dependentes ao trocar cidade
    this.cepForm.patchValue({ logradouroId: null, bairroId: null });
    this.logradouroCtrl.setValue('', { emitEvent: false });
    this.bairroCtrl.setValue('', { emitEvent: false });
    this.logradouroId = null;
    this.bairroId = null;

    this.showCidadeDropdown = false;
    this.sugestoesCidades = [];
  }

  onCidadeBlur() {
    setTimeout(() => (this.showCidadeDropdown = false), 150);
  }

  onLogradouroFocus() {
  if (this.logradouroCtrl.disabled) return; // simples
    this.showLogradouroDropdown = true;
  }

  onLogradouroBlur() {
    setTimeout(() => (this.showLogradouroDropdown = false), 150);
  }

  selecionarLogradouro(l: any) {
    const id = l?.id ?? null;
    const nome = l?.nome ?? '';
    const tipoLogradouro = l?.tipoLogradouro ?? '';

    this.logradouroCtrl.setValue(nome, { emitEvent: false });
    this.cepForm.patchValue({ logradouroId: id });
    this.cepForm.patchValue({ tipoLogradouro: tipoLogradouro });

    this.logradouroId = id; // ✅

    this.showLogradouroDropdown = false;
    this.sugestoesLogradouros = [];
  }


  onBairroFocus() {
    if (this.bairroCtrl.disabled) return;
    this.showBairroDropdown = true;
  }

  onBairroBlur() {
    setTimeout(() => (this.showBairroDropdown = false), 150);
  }

  selecionarBairro(b: any) {
    const id = b?.id ?? null;
    const nome = b?.nome ?? '';

    this.bairroCtrl.setValue(nome, { emitEvent: false });
    this.cepForm.patchValue({ bairroId: id });

    this.bairroId = id; // ✅

    this.showBairroDropdown = false;
    this.sugestoesBairros = [];
  }

  onCepInput(ev: any) {
    const raw = String(ev?.target?.value ?? '');
    const digits = this.somenteDigitos(raw).slice(0, 8);
    this.cepForm.get('cep')?.setValue(digits, { emitEvent: false });
  }

  private somenteDigitos(v: string) {
    return String(v ?? '').replace(/\D/g, '');
  }

  fecharJanelaModal(reason: string = '') {
    this.windowRef.close(reason);
  }

  salvar() {
    if (this.cepForm.invalid) {
      this.cepForm.markAllAsTouched();
      return;
    }

    const form = this.cepForm.getRawValue();

    // ✅ valida pelo FORM (não por variáveis soltas)
    if (!form.cidadeId) {
      this.toastr.show('Selecione uma cidade válida antes de salvar.', 'Atenção', { status: 'warning' });
      return;
    }

    if (!form.logradouroId || !form.bairroId) {
      this.toastr.show('Selecione Logradouro e Bairro antes de salvar.', 'Atenção', { status: 'warning' });
      return;
    }

    const payload: any = {
      id: form.id,
      cep: this.somenteDigitos(form.cep),
      numeroIni: form.numeroIni,
      numeroFim: form.numeroFim,
      identificacao: form.identificacao,

      // ✅ backend espera esses ids
      logradouroId: form.logradouroId,
      bairroId: form.bairroId,
    };

    this.saving = true;

    const obs = payload.id
      ? this.cepService.update(payload)
      : this.cepService.create(payload);

    obs.subscribe({
      next: () => {
        this.cepSalvoOuAtualizado.emit('atualizado');
        this.fecharJanelaModal('save');
        this.saving = false;
      },
      error: (err) => {
        console.error('Erro ao salvar CEP:', err);
        this.toastr.show('Não foi possível salvar o CEP. Verifique os campos.', 'Erro', { status: 'danger' });
        this.saving = false;
      }
    });
  }
}
