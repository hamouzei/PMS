import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { StoreIssueVoucher } from '../models/workflow.model';

// ── Voucher Summary ───────────────────────────────────────────────────────────

export interface VoucherSummary {
  id: string;
  sivNumber: string;
  faivNumber?: string;
  status: number;
  issueDate: string;
  voucherType: string;
  issuedBy: string;
  srNumber: string;
}

// ── Issue Stock ───────────────────────────────────────────────────────────────

export interface IssueStockPayload {
  serviceRequestId: string;
  issuedById: string;
  recipientSignature?: string;
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
export class IssuingApiService {
  private readonly http = inject(HttpClient);

  public getVouchers(
    pageNumber = 1, pageSize = 20
  ): Observable<PagedResult<VoucherSummary>> {
    const params = new HttpParams()
      .set('pageNumber', pageNumber).set('pageSize', pageSize);
    return this.http.get<PagedResult<VoucherSummary>>('/issuing/vouchers', { params });
  }

  public getVoucherById(id: string): Observable<StoreIssueVoucher> {
    return this.http.get<StoreIssueVoucher>(`/issuing/vouchers/${id}`);
  }

  public issueStock(request: IssueStockPayload): Observable<unknown> {
    return this.http.post('/issuing', request);
  }
}
