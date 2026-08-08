import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ServiceRequest, PurchaseRequest } from '../models/workflow.model';

// ── Store Request Summary ─────────────────────────────────────────────────────

export interface StoreRequestSummary {
  id: string;
  srNumber: string;
  status: number;
  requestDate: string;
  requestType: number;
  reason?: string;
  requester?: string;
  detailCount: number;
}

// ── Purchase Request Summary ──────────────────────────────────────────────────

export interface PurchaseRequestSummary {
  id: string;
  prNumber: string;
  status: number;
  requestDate: string;
  requestType: number;
  justification?: string;
  estimatedBudget?: number;
  rejectionReason?: string;
  requester?: string;
  detailCount: number;
}

// ── Create Payloads ───────────────────────────────────────────────────────────

export interface StockLinePayload {
  itemId: string;
  shelfId?: string;
  quantity: number;
  unitCost?: number;
  tagNumber?: string;
  serialNumber?: string;
  remarks?: string;
}

export interface CreateStoreRequestPayload {
  requesterId: string;
  requestType: number;
  reason?: string;
  details: StockLinePayload[];
}

export interface CreatePurchaseRequestPayload {
  requesterId: string;
  requestType: number;
  justification?: string;
  estimatedBudget?: number;
  details: StockLinePayload[];
}

export interface ApprovePayload {
  actorId: string;
  remark?: string;
}

export interface RejectPayload {
  actorId: string;
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
export class RequisitionApiService {
  private readonly http = inject(HttpClient);

  // ── Store Requests ──────────────────────────────────────────────────

  public getStoreRequests(
    pageNumber = 1, pageSize = 20, status?: string, requesterId?: string
  ): Observable<PagedResult<StoreRequestSummary>> {
    let params = new HttpParams()
      .set('pageNumber', pageNumber).set('pageSize', pageSize);
    if (status) params = params.set('status', status);
    if (requesterId) params = params.set('requesterId', requesterId);
    return this.http.get<PagedResult<StoreRequestSummary>>('/store-requests', { params });
  }

  public getStoreRequestById(id: string): Observable<ServiceRequest> {
    return this.http.get<ServiceRequest>(`/store-requests/${id}`);
  }

  public createStoreRequest(request: CreateStoreRequestPayload): Observable<ServiceRequest> {
    return this.http.post<ServiceRequest>('/store-requests', request);
  }

  public approveStoreRequest(id: string, request: ApprovePayload): Observable<ServiceRequest> {
    return this.http.post<ServiceRequest>(`/store-requests/${id}/approve`, request);
  }

  public rejectStoreRequest(id: string, request: RejectPayload): Observable<ServiceRequest> {
    return this.http.post<ServiceRequest>(`/store-requests/${id}/reject`, request);
  }

  // ── Purchase Requests ───────────────────────────────────────────────

  public getPurchaseRequests(
    pageNumber = 1, pageSize = 20, status?: string, requesterId?: string
  ): Observable<PagedResult<PurchaseRequestSummary>> {
    let params = new HttpParams()
      .set('pageNumber', pageNumber).set('pageSize', pageSize);
    if (status) params = params.set('status', status);
    if (requesterId) params = params.set('requesterId', requesterId);
    return this.http.get<PagedResult<PurchaseRequestSummary>>('/purchase-requests', { params });
  }

  public getPurchaseRequestById(id: string): Observable<PurchaseRequest> {
    return this.http.get<PurchaseRequest>(`/purchase-requests/${id}`);
  }

  public createPurchaseRequest(request: CreatePurchaseRequestPayload): Observable<PurchaseRequest> {
    return this.http.post<PurchaseRequest>('/purchase-requests', request);
  }

  public approvePurchaseRequest(id: string, request: ApprovePayload): Observable<PurchaseRequest> {
    return this.http.post<PurchaseRequest>(`/purchase-requests/${id}/approve`, request);
  }

  public rejectPurchaseRequest(id: string, request: RejectPayload): Observable<PurchaseRequest> {
    return this.http.post<PurchaseRequest>(`/purchase-requests/${id}/reject`, request);
  }
}
