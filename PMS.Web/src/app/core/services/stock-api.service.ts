import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

// ── Stock Balance ─────────────────────────────────────────────────────────────

export interface StockBalance {
  id: string;
  itemId: string;
  shelfId: string;
  itemName: string;
  sku: string;
  currentQuantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  bookBalance: number;
  physicalBalance: number;
  discrepancy: number;
  shelfNumber: string;
  warehouse: string;
}

// ── Availability ──────────────────────────────────────────────────────────────

export interface ItemAvailability {
  itemId: string;
  currentQuantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  shelves: {
    id: string;
    shelfId: string;
    currentQuantity: number;
    reservedQuantity: number;
    availableQuantity: number;
    shelfNumber: string;
    warehouse: string;
  }[];
}

// ── Low Stock Alert ───────────────────────────────────────────────────────────

export interface LowStockItem {
  id: string;
  itemId: string;
  itemName: string;
  currentQuantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  minStockLevel: number;
  warehouse: string;
}

// ── Ledger Entry ──────────────────────────────────────────────────────────────

export interface LedgerEntry {
  id: string;
  itemId: string;
  itemName: string;
  quantityChange: number;
  balanceAfter: number;
  transactionType: string;
  documentType: string;
  referenceNumber?: string;
  unitCost?: number;
  reason?: string;
  transactionDate: string;
}

// ── Opening Balance & Adjustment ──────────────────────────────────────────────

export interface OpeningBalancePayload {
  itemId: string;
  shelfId: string;
  quantity: number;
  unitCost?: number;
  reason?: string;
}

export interface StockAdjustmentPayload {
  itemId: string;
  shelfId: string;
  quantityChange: number;
  reason: string;
}

// ── Paged Result ──────────────────────────────────────────────────────────────

export interface PagedResult<T> {
  items: T[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
}

// ── Service ───────────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class StockApiService {
  private readonly http = inject(HttpClient);

  public getBalances(
    pageNumber = 1, pageSize = 50,
    warehouseId?: string, itemId?: string, propertyType?: string
  ): Observable<PagedResult<StockBalance>> {
    let params = new HttpParams()
      .set('pageNumber', pageNumber).set('pageSize', pageSize);
    if (warehouseId) params = params.set('warehouseId', warehouseId);
    if (itemId) params = params.set('itemId', itemId);
    if (propertyType) params = params.set('propertyType', propertyType);
    return this.http.get<PagedResult<StockBalance>>('/stock/balances', { params });
  }

  public getAvailability(itemId: string): Observable<ItemAvailability> {
    return this.http.get<ItemAvailability>(`/stock/availability/${itemId}`);
  }

  public getLowStock(): Observable<LowStockItem[]> {
    return this.http.get<LowStockItem[]>('/stock/low-stock');
  }

  public getLedger(
    pageNumber = 1, pageSize = 50,
    itemId?: string, from?: string, to?: string
  ): Observable<PagedResult<LedgerEntry>> {
    let params = new HttpParams()
      .set('pageNumber', pageNumber).set('pageSize', pageSize);
    if (itemId) params = params.set('itemId', itemId);
    if (from) params = params.set('from', from);
    if (to) params = params.set('to', to);
    return this.http.get<PagedResult<LedgerEntry>>('/stock/ledger', { params });
  }

  public registerOpeningBalance(request: OpeningBalancePayload): Observable<unknown> {
    return this.http.post('/stock/opening-balance', request);
  }

  public adjustStock(request: StockAdjustmentPayload): Observable<unknown> {
    return this.http.post('/stock/adjustments', request);
  }

  public generateTagNumber(warehouseId: string, propertyType: number): Observable<{ tagNumber: string }> {
    return this.http.get<{ tagNumber: string }>(`/stock/generate-tag/${warehouseId}/${propertyType}`);
  }
}
