import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { PropertyReturn, PropertyTransfer, PropertyHandover } from '../models/workflow.model';

// ── Shared Paged Result ──────────────────────────────────────────────────────

export interface PagedResult<T> {
  items: T[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
}

// ── Custody ──────────────────────────────────────────────────────────────────

export interface CustodyRecord {
  id: string;
  quantity: number;
  tagNumber?: string;
  serialNumber?: string;
  sourceDocumentNumber?: string;
  custodian: string;
  custodianId: string;
  itemName: string;
  itemId: string;
}

// ── Return Summary ───────────────────────────────────────────────────────────

export interface ReturnSummary {
  id: string;
  rmrnNumber: string;
  status: number;
  returnDate: string;
  reason?: string;
  returnedBy: string;
}

// ── Transfer Summary ─────────────────────────────────────────────────────────

export interface TransferSummary {
  id: string;
  rmtnNumber: string;
  status: number;
  transferDate: string;
  reason?: string;
  fromCustodian: string;
  toCustodian: string;
}

// ── Handover Summary ─────────────────────────────────────────────────────────

export interface HandoverSummary {
  id: string;
  handoverNumber: string;
  status: number;
  handoverDate: string;
  purpose?: string;
  fromLocation?: string;
  toLocation?: string;
  handoverFrom?: string;
  handoverTo?: string;
}

// ── Create Return ────────────────────────────────────────────────────────────

export interface ReturnLinePayload {
  itemId: string;
  shelfId: string;
  quantity: number;
  unitCost?: number;
  tagNumber?: string;
  serialNumber?: string;
  condition: number;
}

export interface CreateReturnPayload {
  returnedById: string;
  reason?: string;
  details: ReturnLinePayload[];
  attachments?: { fileName: string; base64Content: string }[];
}

// ── Create Transfer ──────────────────────────────────────────────────────────

export interface TransferLinePayload {
  itemId: string;
  quantity: number;
  tagNumber?: string;
  serialNumber?: string;
}

export interface CreateTransferPayload {
  fromCustodianId: string;
  toCustodianId: string;
  reason?: string;
  details: TransferLinePayload[];
  attachments?: { fileName: string; base64Content: string }[];
}

// ── Create Handover ──────────────────────────────────────────────────────────

export interface HandoverLinePayload {
  itemId: string;
  quantity: number;
  tagNumber?: string;
  serialNumber?: string;
  farnNumber?: string;
  rmrnNumber?: string;
  faivNumber?: string;
}

export interface CreateHandoverPayload {
  handoverFromId: string;
  handoverToId: string;
  purpose?: string;
  fromLocation?: string;
  toLocation?: string;
  remarks?: string;
  details: HandoverLinePayload[];
  attachments?: { fileName: string; base64Content: string }[];
}

// ── Approve / Reject ─────────────────────────────────────────────────────────

export interface ApprovePayload {
  actorId: string;
  remark?: string;
}

// ── Service ──────────────────────────────────────────────────────────────────

@Injectable({
  providedIn: 'root'
})
export class CustodyApiService {
  private readonly http = inject(HttpClient);

  // ── User Custody ────────────────────────────────────────────────────

  public getCustodyRecords(
    pageNumber = 1,
    pageSize = 50,
    custodianId?: string,
    itemId?: string
  ): Observable<PagedResult<CustodyRecord>> {
    let params = new HttpParams()
      .set('pageNumber', pageNumber)
      .set('pageSize', pageSize);
    if (custodianId) params = params.set('custodianId', custodianId);
    if (itemId) params = params.set('itemId', itemId);
    return this.http.get<PagedResult<CustodyRecord>>('/custody', { params });
  }

  // ── Property Returns (RMRN) ─────────────────────────────────────────

  public getReturns(
    pageNumber = 1,
    pageSize = 20,
    status?: string
  ): Observable<PagedResult<ReturnSummary>> {
    let params = new HttpParams()
      .set('pageNumber', pageNumber)
      .set('pageSize', pageSize);
    if (status) params = params.set('status', status);
    return this.http.get<PagedResult<ReturnSummary>>('/returns', { params });
  }

  public getReturnById(id: string): Observable<PropertyReturn> {
    return this.http.get<PropertyReturn>(`/returns/${id}`);
  }

  public createReturn(request: CreateReturnPayload): Observable<PropertyReturn> {
    return this.http.post<PropertyReturn>('/returns', request);
  }

  public approveReturn(id: string, request: ApprovePayload): Observable<PropertyReturn> {
    return this.http.post<PropertyReturn>(`/returns/${id}/approve`, request);
  }

  // ── Property Transfers (RMTN) ───────────────────────────────────────

  public getTransfers(
    pageNumber = 1,
    pageSize = 20,
    status?: string
  ): Observable<PagedResult<TransferSummary>> {
    let params = new HttpParams()
      .set('pageNumber', pageNumber)
      .set('pageSize', pageSize);
    if (status) params = params.set('status', status);
    return this.http.get<PagedResult<TransferSummary>>('/transfers', { params });
  }

  public getTransferById(id: string): Observable<PropertyTransfer> {
    return this.http.get<PropertyTransfer>(`/transfers/${id}`);
  }

  public createTransfer(request: CreateTransferPayload): Observable<PropertyTransfer> {
    return this.http.post<PropertyTransfer>('/transfers', request);
  }

  public approveTransfer(id: string, request: ApprovePayload): Observable<PropertyTransfer> {
    return this.http.post<PropertyTransfer>(`/transfers/${id}/approve`, request);
  }

  // ── Property Handovers ──────────────────────────────────────────────

  public getHandovers(
    pageNumber = 1,
    pageSize = 20,
    status?: string
  ): Observable<PagedResult<HandoverSummary>> {
    let params = new HttpParams()
      .set('pageNumber', pageNumber)
      .set('pageSize', pageSize);
    if (status) params = params.set('status', status);
    return this.http.get<PagedResult<HandoverSummary>>('/handovers', { params });
  }

  public getHandoverById(id: string): Observable<PropertyHandover> {
    return this.http.get<PropertyHandover>(`/handovers/${id}`);
  }

  public createHandover(request: CreateHandoverPayload): Observable<PropertyHandover> {
    return this.http.post<PropertyHandover>('/handovers', request);
  }

  public approveHandover(id: string, request: ApprovePayload): Observable<PropertyHandover> {
    return this.http.post<PropertyHandover>(`/handovers/${id}/approve`, request);
  }
}
