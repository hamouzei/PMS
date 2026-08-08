import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { DisposalRecord, PropertyCondition, DisposalMethod } from '../models/workflow.model';

// ── Summary ───────────────────────────────────────────────────────────────────

export interface DisposalSummary {
  id: string;
  disposalNumber: string;
  quantity: number;
  status: number;
  condition: string;
  disposalMethod: string;
  itemName: string;
  custodian: string;
}

// ── Payloads ──────────────────────────────────────────────────────────────────

export interface CreateDisposalPayload {
  itemId: string;
  shelfId?: string;
  custodianId?: string;
  quantity: number;
  condition: PropertyCondition;
  disposalMethod: DisposalMethod;
  notes?: string;
  attachments?: AttachmentPayload[];
}

export interface AttachmentPayload {
  fileName: string;
  contentBase64: string;
  contentType: string;
}

export interface ApprovePayload {
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
export class DisposalApiService {
  private readonly http = inject(HttpClient);

  public getDisposals(
    pageNumber = 1, pageSize = 20, status?: string
  ): Observable<PagedResult<DisposalSummary>> {
    let params = new HttpParams()
      .set('pageNumber', pageNumber).set('pageSize', pageSize);
    if (status) params = params.set('status', status);
    return this.http.get<PagedResult<DisposalSummary>>('/disposal', { params });
  }

  public getDisposalById(id: string): Observable<DisposalRecord> {
    return this.http.get<DisposalRecord>(`/disposal/${id}`);
  }

  public createDisposal(request: CreateDisposalPayload): Observable<DisposalRecord> {
    return this.http.post<DisposalRecord>('/disposal', request);
  }

  public approveDisposal(id: string, request: ApprovePayload): Observable<DisposalRecord> {
    return this.http.post<DisposalRecord>(`/disposal/${id}/approve`, request);
  }
}
