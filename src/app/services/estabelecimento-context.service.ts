import { Injectable } from '@angular/core';
import {
  BehaviorSubject,
  Observable,
} from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class EstabelecimentoContextService {

  private estabelecimentoIdSource =
    new BehaviorSubject<number | null>(null);

  private estabelecimentoNomeSource =
    new BehaviorSubject<string | null>(null);

  private pessoaIdSource =
    new BehaviorSubject<number | null>(null);

  estabelecimentoId$: Observable<number | null> =
    this.estabelecimentoIdSource.asObservable();

  estabelecimentoNome$: Observable<string | null> =
    this.estabelecimentoNomeSource.asObservable();

  pessoaId$: Observable<number | null> =
    this.pessoaIdSource.asObservable();

  setEstabelecimentoId(
    id: number | null,
  ): void {

    this.estabelecimentoIdSource.next(id);
  }

  setEstabelecimentoNome(
    nome: string | null,
  ): void {

    this.estabelecimentoNomeSource.next(nome);
  }

  setPessoaId(
    pessoaId: number | null,
  ): void {

    this.pessoaIdSource.next(pessoaId);
  }

  getCurrentEstabelecimentoId(): number | null {

    return this.estabelecimentoIdSource.getValue();
  }

  getCurrentEstabelecimentoNome(): string | null {

    return this.estabelecimentoNomeSource.getValue();
  }

  getCurrentPessoaId(): number | null {

    return this.pessoaIdSource.getValue();
  }

  definirContexto(
    estabelecimentoId: number | null,
    estabelecimentoNome: string | null,
    pessoaId: number | null,
  ): void {

    this.estabelecimentoIdSource.next(
      estabelecimentoId,
    );

    this.estabelecimentoNomeSource.next(
      estabelecimentoNome,
    );

    this.pessoaIdSource.next(
      pessoaId,
    );
  }

  clearContext(): void {

    this.estabelecimentoIdSource.next(null);
    this.estabelecimentoNomeSource.next(null);
    this.pessoaIdSource.next(null);
  }
}