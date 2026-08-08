import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { AnnualInventory } from '../models/workflow.model';

// ── Summary ───────────────────────────────────────────────────────────────────

export interface InventorySummary {
  id: string;
  inventoryNumber: string;
  fiscalYear: number;
  location: string;
  status: number;
  countDate: string;
  countedBy: string;
}

// ── Payloads ──────────────────────────────────────────────────────────────────

export interface InventoryLinePayload {
  itemId: string;
  shelfId?: string;
  expectedQuantity: number;
  countedQuantity: number;
  notes?: string;
}

export interface CreateAnnualInventoryPayload {
  fiscalYear: number;
  location: string;
  countedById: string;
  lines: InventoryLinePayload[];
}

export interface CompleteInventoryPayload {
  actorId: string;
  remark?: string;
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
export class AnnualInventoryApiService {
  private readonly http = inject(HttpClient);

  public getInventories(
    pageNumber = 1, pageSize = 20, fiscalYear?: number, location?: string
  ): Observable<PagedResult<InventorySummary>> {
    let params = new HttpParams()
      .set('pageNumber', pageNumber).set('pageSize', pageSize);
    if (fiscalYear) params = params.set('fiscalYear', fiscalYear);
    if (location) params = params.set('location', location);
    return this.http.get<PagedResult<InventorySummary>>('/annual-inventory', { params });
  }

  public getInventoryById(id: string): Observable<AnnualInventory> {
    return this.http.get<AnnualInventory>(`/annual-inventory/${id}`);
  }

  public createInventory(request: CreateAnnualInventoryPayload): Observable<AnnualInventory> {
    return this.http.post<AnnualInventory>('/annual-inventory', request);
  }

  public completeInventory(id: string, request: CompleteInventoryPayload): Observable<AnnualInventory> {
    return this.http.post<AnnualInventory>(`/annual-inventory/${id}/complete`, request);
  }
}
