import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ReceivingNote, InspectionLog } from '../models/workflow.model';

// ── Receiving Summary ─────────────────────────────────────────────────────────

export interface ReceivingSummary {
  id: string;
  grnNumber: string;
  farnNumber?: string;
  status: number;
  receivedDate: string;
  invoiceNumber?: string;
  supplier: string;
  receivedBy: string;
}

// ── Create Receiving Note ─────────────────────────────────────────────────────

export interface ReceivingLinePayload {
  itemId: string;
  shelfId?: string;
  quantity: number;
  unitCost?: number;
  tagNumber?: string;
  serialNumber?: string;
  remarks?: string;
}

export interface CreateReceivingPayload {
  supplierId: string;
  warehouseId: string;
  receivedById: string;
  purchaseRequestId?: string;
  invoiceNumber?: string;
  purchaseOrderNumber?: string;
  storeRequestNumber?: string;
  tenderReferenceNumber?: string;
  notes?: string;
  details: ReceivingLinePayload[];
  attachments?: { fileName: string; contentType?: string; storagePath: string; uploadedById?: string }[];
}

// ── Inspection ────────────────────────────────────────────────────────────────

export interface RecordInspectionPayload {
  receivingNoteId: string;
  inspectorId: string;
  isPassed: boolean;
  deviationNotes?: string;
}

// ── Release ───────────────────────────────────────────────────────────────────

export interface ReleaseReceivingPayload {
  receivingNoteId: string;
  releasedById: string;
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
export class ReceivingApiService {
  private readonly http = inject(HttpClient);

  public getReceivingNotes(
    pageNumber = 1, pageSize = 20, status?: string
  ): Observable<PagedResult<ReceivingSummary>> {
    let params = new HttpParams()
      .set('pageNumber', pageNumber).set('pageSize', pageSize);
    if (status) params = params.set('status', status);
    return this.http.get<PagedResult<ReceivingSummary>>('/receiving', { params });
  }

  public getReceivingById(id: string): Observable<ReceivingNote> {
    return this.http.get<ReceivingNote>(`/receiving/${id}`);
  }

  public createReceiving(request: CreateReceivingPayload): Observable<ReceivingNote> {
    return this.http.post<ReceivingNote>('/receiving', request);
  }

  public recordInspection(id: string, request: RecordInspectionPayload): Observable<InspectionLog> {
    return this.http.post<InspectionLog>(`/receiving/${id}/inspect`, request);
  }

  public releaseToStock(id: string, request: ReleaseReceivingPayload): Observable<unknown> {
    return this.http.post(`/receiving/${id}/release-to-stock`, request);
  }
}
