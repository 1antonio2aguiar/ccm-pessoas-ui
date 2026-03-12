// src/app/services/pessoa-context.service.ts (ajuste o caminho conforme sua estrutura)
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root' // Disponível em toda a aplicação
})
export class PessoaContextService {
  private pessoaIdSource = new BehaviorSubject<number | null>(null);
  private pessoaNomeSource = new BehaviorSubject<string | null>(null);

  // Observables para os componentes se inscreverem
  pessoaId$: Observable<number | null> = this.pessoaIdSource.asObservable();
  pessoaNome$: Observable<string | null> = this.pessoaNomeSource.asObservable();

  constructor() { }

  setPessoaId(id: number | null): void {
    this.pessoaIdSource.next(id);
  }

  setPessoaNome(nome: string | null): void {
    this.pessoaNomeSource.next(nome);
  }

  // Métodos para obter o valor atual, se necessário (use com cautela fora de inicializações)
  getCurrentPessoaId(): number | null {
    return this.pessoaIdSource.getValue();
  }

  getCurrentPessoaNome(): string | null {
    return this.pessoaNomeSource.getValue();
  }

  clearContext(): void {
    this.pessoaIdSource.next(null);
    this.pessoaNomeSource.next(null);
  }
}