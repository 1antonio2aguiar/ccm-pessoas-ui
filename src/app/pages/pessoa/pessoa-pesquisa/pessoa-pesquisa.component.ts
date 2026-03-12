import { Component, OnDestroy, OnInit } from '@angular/core';
import { LocalDataSource } from 'ng2-smart-table';
import { HttpParams } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { NbDialogService, NbToastrService } from '@nebular/theme';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { debounceTime, filter } from 'rxjs/operators';

import { AfterViewInit, ElementRef } from '@angular/core';

import { PessoaService, PessoaFilters } from '../pessoa.service';

@Component({
  selector: 'ngx-pessoa-pesquisa',
  templateUrl: './pessoa-pesquisa.component.html',
  styleUrls: ['./pessoa-pesquisa.component.scss']
})

export class PessoaPesquisaComponent implements OnInit, OnDestroy {
  source: LocalDataSource = new LocalDataSource();
  filtro: PessoaFilters = new PessoaFilters();
  isLoading = false;

  private filterSubject = new Subject<any>();
  private destroy$ = new Subject<void>();

  settings = {

    mode: 'external',

    pager: {
      perPage: 5,
      display: true,
    },

    add: {
      addButtonContent: '<i class="nb-plus"></i>',
    },
    edit: {
      editButtonContent: '<i class="nb-edit"></i>',
    },
    delete: {
      deleteButtonContent: '<i class="nb-trash"></i>',
      confirmDelete: true,
    },

    columns: {
      id: {
        title: 'ID',
        type: 'number',
        editable: false,
        addable: false,
        width: '90px',
        filter: true,
        filterFunction: false,
      },

      nome: {
        title: 'Nome',
        type: 'string',
        filter: true,
        filterFunction: false,
        width: '500px',
      },

      cpfCnpj: {
        title: 'CPF/CNPJ',
        type: 'string',
        width: '200px',
        filter: true,
        valuePrepareFunction: (_: any, row: any) => {
          const raw = String(row?.cpfCnpj ?? '');
          const digits = raw.replace(/\D/g, '');

          if (digits.length === 11) {
            return `${digits.substring(0, 3)}.${digits.substring(3, 6)}.${digits.substring(6, 9)}-${digits.substring(9, 11)}`;
          }
          if (digits.length === 14) {
            return `${digits.substring(0, 2)}.${digits.substring(2, 5)}.${digits.substring(5, 8)}/${digits.substring(8, 12)}-${digits.substring(12, 14)}`;
          }
          return raw;
        },
      },

      dataNascimento: {
        title: 'Nascimento',
        type: 'string',
        width: '140px',
        filter: true,
        valuePrepareFunction: (_: any, row: any) => row?.dataNascimento ?? '',
      },

      situacao: {
        title: 'Situação',
        type: 'string',
        width: '120px',
        filter: false,
        valuePrepareFunction: (cell: any) => {
          const id = typeof cell === 'number' ? cell : Number(cell);
          switch (id) {
            case 0: return 'ATIVO';
            case 1: return 'INATIVO';
            case 2: return 'BLOQUEADO';
            default: return cell ?? '';
          }
        },
      },
    },
  };

  constructor(
    private pessoaService: PessoaService,
    private router: Router,
    private route: ActivatedRoute,
    private dialogService: NbDialogService,
    private toastr: NbToastrService,

    private el: ElementRef,
  ) { }

  ngAfterViewInit(): void {
    // espera a tabela desenhar os inputs
    setTimeout(() => this.applyFilterMasks(), 0);
  }

  private applyFilterMasks(): void {
    const host: HTMLElement = this.el.nativeElement;

    // inputs dos filtros do header do ng2-smart-table
    const inputs = Array.from(host.querySelectorAll('ng2-smart-table thead input')) as HTMLInputElement[];

    // cpfCnpj e dataNascimento são colunas => inputs aparecem na ordem das colunas
    // Vamos identificar pelo placeholder (o ng2-smart-table costuma usar o title no placeholder)
    // Se no seu não tiver placeholder, já te passo alternativa.
    const cpfInput = inputs.find(i => (i.getAttribute('placeholder') || '').toLowerCase().includes('cpf'));
    const dataInput = inputs.find(i => (i.getAttribute('placeholder') || '').toLowerCase().includes('nascimento'));

    if (cpfInput) this.attachCpfCnpjMask(cpfInput);
    if (dataInput) this.attachDateMask(dataInput);
  }

  private attachDateMask(input: HTMLInputElement): void {
    const handler = () => {
      let digits = (input.value || '').replace(/\D/g, '').substring(0, 8); // ddMMyyyy

      const dd = digits.substring(0, 2);
      const mm = digits.substring(2, 4);
      const yyyy = digits.substring(4, 8);

      let out = dd;
      if (mm) out += '/' + mm;
      if (yyyy) out += '/' + yyyy;

      input.value = out;
    };

    input.addEventListener('input', handler);
  }

  private attachCpfCnpjMask(input: HTMLInputElement): void {
    const handler = () => {
      const digits = (input.value || '').replace(/\D/g, '').substring(0, 14);

      // decide formato: até 11 = CPF; acima = CNPJ
      if (digits.length <= 11) {
        input.value = this.formatCpf(digits);
      } else {
        input.value = this.formatCnpj(digits);
      }
    };

    input.addEventListener('input', handler);
  }

  private formatCpf(d: string): string {
    // 000.000.000-00
    const p1 = d.substring(0, 3);
    const p2 = d.substring(3, 6);
    const p3 = d.substring(6, 9);
    const p4 = d.substring(9, 11);

    let out = p1;
    if (p2) out += '.' + p2;
    if (p3) out += '.' + p3;
    if (p4) out += '-' + p4;

    return out;
  }

  private formatCnpj(d: string): string {
    // 00.000.000/0000-00
    const p1 = d.substring(0, 2);
    const p2 = d.substring(2, 5);
    const p3 = d.substring(5, 8);
    const p4 = d.substring(8, 12);
    const p5 = d.substring(12, 14);

    let out = p1;
    if (p2) out += '.' + p2;
    if (p3) out += '.' + p3;
    if (p4) out += '/' + p4;
    if (p5) out += '-' + p5;

    return out;
  }

  ngOnInit(): void {
    this.listarPessoas();

    // captura filtros da tabela
    this.source.onChanged()
      .pipe(takeUntil(this.destroy$))
      .subscribe((change) => {
        if (change.action === 'filter') {
          this.filterSubject.next(change.filter);
        }
      });

    // debounce + regras (cpf >= 6, data completa)
    this.filterSubject
      .pipe(
        debounceTime(400),
        filter((filters) => this.shouldSearch(filters)),
        takeUntil(this.destroy$),
      )
      .subscribe((filters) => {
        this.onTableFilter(filters);
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  listarPessoas(): void {
    this.filtro = new PessoaFilters();
    this.filtro.pagina = 0;
    this.filtro.itensPorPagina = 1000;
    this.filtro.params = new HttpParams().append('sort', 'nome');

    this.execSearch(this.filtro.params);
  }

  onAdd(): void {
    this.router.navigate(['cadastrar'], { relativeTo: this.route.parent }); 
  }

  onEdit(event: any): void {
    const pessoaNome = (event.data.nome); 
    const pessoaId   = event.data.id;

    this.router.navigate(['editar', pessoaId], { // 'editar/:id'
      relativeTo: this.route.parent,
      state: { pessoaNome: pessoaNome } // <<< AQUI passa o pessoaNome
    });
  }

  onDelete(event: any): void {
    console.log('Oi');
  }

  /**
   * Regras para NÃO disparar busca:
   * - cpfCnpj: só busca com 6+ dígitos (ou vazio)
   * - dataNascimento: só busca quando estiver completa dd/MM/yyyy (ou vazio)
   */
  private shouldSearch(filters: any): boolean {
    const filtersArray = filters?.filters ?? [];

    const cpfCnpjFilter = filtersArray.find((f: any) => f.field === 'cpfCnpj');
    const nascimentoFilter = filtersArray.find((f: any) => f.field === 'dataNascimento');

    // CPF/CNPJ
    if (cpfCnpjFilter) {
      const raw = String(cpfCnpjFilter.search ?? '').trim();
      const digits = raw.replace(/\D/g, '');
      if (digits.length === 0) return true;
      if (digits.length < 6) return false;
    }

    // Data nascimento
    if (nascimentoFilter) {
      const raw = String(nascimentoFilter.search ?? '').trim();
      if (raw.length === 0) return true;
      return /^(\d{2})\/(\d{2})\/(\d{4})$/.test(raw); // só data completa
    }

    return true;
  }

  /**
   * Filtro EXCLUSIVO por prioridade:
   * 1) cpf/cnpj
   * 2) data nascimento
   * 3) id
   * 4) nome
   */
  onTableFilter(filters: any): void {
    let params = new HttpParams();
    const filtersArray = filters?.filters ?? [];

    const idFilter = filtersArray.find((f: any) => f.field === 'id');
    const nomeFilter = filtersArray.find((f: any) => f.field === 'nome');
    const cpfCnpjFilter = filtersArray.find((f: any) => f.field === 'cpfCnpj');
    const nascimentoFilter = filtersArray.find((f: any) => f.field === 'dataNascimento');

    const nome = String(nomeFilter?.search ?? '').trim();
    const id = String(idFilter?.search ?? '').trim();

    const cpfCnpjRaw = String(cpfCnpjFilter?.search ?? '').trim();
    const cpfCnpjDigits = cpfCnpjRaw.replace(/\D/g, '');

    const nascRaw = String(nascimentoFilter?.search ?? '').trim();

    // 1) CPF/CNPJ
    if (cpfCnpjDigits.length > 0) {
      if (cpfCnpjDigits.length <= 11) params = params.set('cpf', cpfCnpjDigits);
      else params = params.set('cnpj', cpfCnpjDigits);

      this.execSearch(params);
      return;
    }

    // 2) Data nascimento (somente completa dd/MM/yyyy)
    const m = nascRaw.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (m) {
      const yyyyMMdd = `${m[3]}-${m[2]}-${m[1]}`;
      params = params.set('dataNascimento', yyyyMMdd);

      this.execSearch(params);
      return;
    }

    // 3) ID
    if (id.length > 0) {
      params = params.set('id', id);

      this.execSearch(params);
      return;
    }

    // 4) Nome
    if (nome.length > 0) {
      params = params.set('nome', nome);

      this.execSearch(params);
      return;
    }

    // nenhum filtro
    this.execSearch(params);
  }

  private execSearch(params: HttpParams): void {
    this.filtro.params = params;

    this.isLoading = true;
    this.pessoaService.pesquisar({ ...this.filtro, params } as any)
      .then(({ pessoas, total }) => {
        this.filtro.totalRegistros = total ?? 0;

        const lista = (pessoas ?? []).map((p: any) => this.normalizePessoaRow(p));
        this.source.load(lista);
      })
      .catch((e) => {
        console.error(e);
        this.source.load([]);
      })
      .finally(() => this.isLoading = false);
  }

  /**
   * Normaliza campos “virtuais” para o smart-table filtrar/renderizar:
   * - cpfCnpj: string com cpf ou cnpj
   * - dataNascimento: dd/MM/yyyy
   */
  private normalizePessoaRow(p: any): any {
    const digits =
      String(
        p?.cpf ?? p?.cnpj ??
        p?.dadosPessoaFisica?.cpf ??
        p?.dadosPessoaJuridica?.cnpj ??
        ''
      ).replace(/\D/g, '');

    const cpfCnpj =
      digits.length <= 11
        ? this.formatCpf(digits)
        : this.formatCnpj(digits);

    const dnRaw =
      (p?.dataNascimento ??
        p?.dadosPessoaFisica?.dataNascimento ??
        '');

    let dataNascimento = '';
    if (dnRaw) {
      const s = String(dnRaw).substring(0, 10);
      const parts = s.split('-');
      if (parts.length === 3) dataNascimento = `${parts[2]}/${parts[1]}/${parts[0]}`;
      else dataNascimento = String(dnRaw);
    }

    return {
      ...p,
      cpfCnpjDigits: digits, // para backend (se precisar)
      cpfCnpj,              // PARA O SMART-TABLE FILTRAR E MOSTRAR
      dataNascimento,
    };
  }
}