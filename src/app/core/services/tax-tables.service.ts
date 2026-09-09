import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { DEFAULT_TAX_TABLES } from '../tax/default-tax-tables';
import { TaxTables } from '../tax/tax-tables.model';

export type TaxTablesStatus = 'loading' | 'remote' | 'fallback';

/**
 * Não existe hoje uma API pública e gratuita para consultar as tabelas de
 * INSS/IRRF, então servimos nós mesmos um JSON estático
 * (`public/data/tax-tables-2026.json`) e buscamos ele via HTTP em tempo
 * de execução — assim as tabelas podem ser atualizadas (quando o governo
 * publicar novos valores) só editando o JSON, sem precisar recompilar a
 * lógica de cálculo. Se a busca falhar (ex.: offline), caímos para as
 * mesmas tabelas embutidas no bundle (`DEFAULT_TAX_TABLES`), mantendo a
 * app 100% funcional sem backend.
 */
@Injectable({ providedIn: 'root' })
export class TaxTablesService {
  private readonly http = inject(HttpClient);

  private readonly _tables = signal<TaxTables>(DEFAULT_TAX_TABLES);
  private readonly _status = signal<TaxTablesStatus>('loading');
  private loadPromise: Promise<void> | null = null;

  readonly tables = this._tables.asReadonly();
  readonly status = this._status.asReadonly();

  /** Dispara a busca do JSON uma única vez (chamadas seguintes reutilizam a mesma promise). */
  load(): Promise<void> {
    this.loadPromise ??= this.fetchTables();
    return this.loadPromise;
  }

  private async fetchTables(): Promise<void> {
    try {
      const data = await firstValueFrom(this.http.get<TaxTables>('data/tax-tables-2026.json'));
      this._tables.set(data);
      this._status.set('remote');
    } catch {
      this._tables.set(DEFAULT_TAX_TABLES);
      this._status.set('fallback');
    }
  }
}
