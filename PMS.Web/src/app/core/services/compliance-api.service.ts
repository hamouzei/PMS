import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ComplianceRecord } from '../models/workflow.model';

// ── Summary ───────────────────────────────────────────────────────────────────

export interface ComplianceSummary {
  id: string;
  complianceNumber: string;
  status: number;
  reviewDate: string;
  findings?: string;
  recommendations?: string;
  correctiveActions?: string;
  reviewedBy?: string;
  inventoryNumber?: string;
}

// ── Payloads ──────────────────────────────────────────────────────────────────

export interface CreateCompliancePayload {
  inventoryId?: string;
  reviewedById: string;
  findings?: string;
  recommendations?: string;
  correctiveActions?: string;
}

export interface CloseCompliancePayload {
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
export class ComplianceApiService {
  private readonly http = inject(HttpClient);

  public getRecords(
    pageNumber = 1, pageSize = 20
  ): Observable<PagedResult<ComplianceSummary>> {
    const params = new HttpParams()
      .set('pageNumber', pageNumber).set('pageSize', pageSize);
    return this.http.get<PagedResult<ComplianceSummary>>('/compliance', { params });
  }

  public getRecordById(id: string): Observable<ComplianceRecord> {
    return this.http.get<ComplianceRecord>(`/compliance/${id}`);
  }

  public createRecord(request: CreateCompliancePayload): Observable<ComplianceRecord> {
    return this.http.post<ComplianceRecord>('/compliance', request);
  }

  public closeRecord(id: string, request: CloseCompliancePayload): Observable<ComplianceRecord> {
    return this.http.post<ComplianceRecord>(`/compliance/${id}/close`, request);
  }
}
