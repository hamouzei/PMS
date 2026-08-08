import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import {
  DashboardKpiResponse,
  StockSummaryReportRow,
  PropertyMovementReportRow,
  AuditTrailReportRow,
  NotificationEventDto
} from '../models/reports.model';

// ── Paged Result ──────────────────────────────────────────────────────────────

export interface PagedResult<T> {
  items: T[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
}

// ── Service ───────────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class ReportsApiService {
  private readonly http = inject(HttpClient);

  // ── Dashboard ─────────────────────────────────────────────────────────────

  public getDashboardKpis(): Observable<DashboardKpiResponse> {
    return this.http.get<DashboardKpiResponse>('/reports/dashboard');
  }

  // ── Stock Summary ─────────────────────────────────────────────────────────

  public getStockSummary(): Observable<StockSummaryReportRow[]> {
    return this.http.get<StockSummaryReportRow[]>('/reports/stock-summary');
  }

  // ── Property Movements ────────────────────────────────────────────────────

  public getMovements(
    pageNumber = 1, pageSize = 50, from?: string, to?: string,
    itemId?: string, transactionType?: string
  ): Observable<PagedResult<PropertyMovementReportRow>> {
    let params = new HttpParams()
      .set('pageNumber', pageNumber).set('pageSize', pageSize);
    if (from) params = params.set('from', from);
    if (to) params = params.set('to', to);
    if (itemId) params = params.set('itemId', itemId);
    if (transactionType) params = params.set('transactionType', transactionType);
    return this.http.get<PagedResult<PropertyMovementReportRow>>('/reports/movements', { params });
  }

  // ── Audit Trail ───────────────────────────────────────────────────────────

  public getAuditTrail(
    pageNumber = 1, pageSize = 50, from?: string, to?: string,
    entityName?: string, userId?: string
  ): Observable<PagedResult<AuditTrailReportRow>> {
    let params = new HttpParams()
      .set('pageNumber', pageNumber).set('pageSize', pageSize);
    if (from) params = params.set('from', from);
    if (to) params = params.set('to', to);
    if (entityName) params = params.set('entityName', entityName);
    if (userId) params = params.set('userId', userId);
    return this.http.get<PagedResult<AuditTrailReportRow>>('/reports/audit', { params });
  }

  // ── Notifications ─────────────────────────────────────────────────────────

  public getNotifications(
    pageNumber = 1, pageSize = 50, userId?: string, role?: string, unreadOnly?: boolean
  ): Observable<PagedResult<NotificationEventDto>> {
    let params = new HttpParams()
      .set('pageNumber', pageNumber).set('pageSize', pageSize);
    if (userId) params = params.set('userId', userId);
    if (role) params = params.set('role', role);
    if (unreadOnly !== undefined) params = params.set('unreadOnly', unreadOnly);
    return this.http.get<PagedResult<NotificationEventDto>>('/reports/notifications', { params });
  }

  public markNotificationRead(id: string): Observable<NotificationEventDto> {
    return this.http.post<NotificationEventDto>(`/reports/notifications/${id}/read`, {});
  }
}
