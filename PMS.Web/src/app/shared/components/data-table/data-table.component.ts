import { Component, ContentChild, Input, TemplateRef, output } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface ColumnDef<T> {
  key: keyof T | string;
  header: string;
  sortable?: boolean;
}

@Component({
  selector: 'app-data-table',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="table-container">
      <table class="data-table">
        <thead>
          <tr>
            <th *ngFor="let col of columns" [class.sortable]="col.sortable" (click)="onSort(col)">
              {{ col.header }}
              <span *ngIf="sortKey === col.key" class="sort-icon">
                {{ sortDirection === 'asc' ? '▲' : '▼' }}
              </span>
            </th>
            <th *ngIf="actionsTemplate" class="actions-header">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngIf="loading">
            <td [attr.colspan]="columns.length + (actionsTemplate ? 1 : 0)" class="loading-cell">
              <div class="table-spinner"></div>
              <span>Loading data...</span>
            </td>
          </tr>
          <tr *ngIf="!loading && data.length === 0">
            <td [attr.colspan]="columns.length + (actionsTemplate ? 1 : 0)" class="empty-cell">
              <span>No records found.</span>
            </td>
          </tr>
          <tr *ngFor="let row of data">
            <td *ngFor="let col of columns">
              <ng-container *ngIf="cellTemplate" [ngTemplateOutlet]="cellTemplate" [ngTemplateOutletContext]="{ $implicit: row, key: col.key }">
              </ng-container>
              <ng-container *ngIf="!cellTemplate">
                {{ getCellValue(row, col.key) }}
              </ng-container>
            </td>
            <td *ngIf="actionsTemplate" class="actions-cell">
              <ng-container [ngTemplateOutlet]="actionsTemplate" [ngTemplateOutletContext]="{ $implicit: row }">
              </ng-container>
            </td>
          </tr>
        </tbody>
      </table>

      <div *ngIf="pagination" class="pagination-bar">
        <span class="pagination-info">
          Showing {{ pageStart }} to {{ pageEnd }} of {{ totalCount }} entries
        </span>
        <div class="pagination-controls">
          <button [disabled]="currentPage === 1" (click)="onPageChange(currentPage - 1)">Previous</button>
          <span class="page-number">Page {{ currentPage }} of {{ totalPages }}</span>
          <button [disabled]="currentPage >= totalPages" (click)="onPageChange(currentPage + 1)">Next</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .table-container {
      background-color: var(--bg-surface);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      overflow-x: auto;
    }
    .data-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.875rem;
      text-align: left;
      th {
        padding: 0.75rem 1rem;
        background-color: var(--bg-app);
        color: var(--text-secondary);
        font-weight: 600;
        border-bottom: 1px solid var(--border-color);
        &.sortable { cursor: pointer; }
      }
      td {
        padding: 0.875rem 1rem;
        border-bottom: 1px solid var(--border-color);
        color: var(--text-primary);
      }
      tbody tr:hover {
        background-color: var(--bg-surface-hover);
      }
    }
    .loading-cell, .empty-cell {
      text-align: center;
      padding: 3rem 1rem !important;
      color: var(--text-muted);
    }
    .table-spinner {
      width: 24px; height: 24px; margin: 0 auto 0.5rem;
      border: 3px solid var(--border-color);
      border-top-color: var(--ecx-navy-primary);
      border-radius: 50%;
      animation: spin 0.75s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    .pagination-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.75rem 1rem;
      border-top: 1px solid var(--border-color);
      font-size: 0.8125rem;
    }
    .pagination-controls {
      display: flex; align-items: center; gap: 0.75rem;
      button {
        padding: 0.375rem 0.75rem;
        border: 1px solid var(--border-color);
        border-radius: var(--radius-sm);
        &:disabled { opacity: 0.5; cursor: not-allowed; }
      }
    }
  `]
})
export class DataTableComponent<T> {
  @Input({ required: true }) columns: ColumnDef<T>[] = [];
  @Input() data: T[] = [];
  @Input() loading = false;
  @Input() pagination = true;
  @Input() currentPage = 1;
  @Input() pageSize = 10;
  @Input() totalCount = 0;

  @ContentChild('cellTemplate') cellTemplate?: TemplateRef<unknown>;
  @ContentChild('actionsTemplate') actionsTemplate?: TemplateRef<unknown>;

  pageChanged = output<number>();
  sortChanged = output<{ key: string; direction: 'asc' | 'desc' }>();

  sortKey = '';
  sortDirection: 'asc' | 'desc' = 'asc';

  get totalPages(): number {
    return Math.ceil(this.totalCount / this.pageSize) || 1;
  }

  get pageStart(): number {
    return (this.currentPage - 1) * this.pageSize + 1;
  }

  get pageEnd(): number {
    return Math.min(this.currentPage * this.pageSize, this.totalCount);
  }

  getCellValue(row: T, key: string | keyof T): unknown {
    return (row as Record<string, unknown>)[key as string];
  }

  onSort(col: ColumnDef<T>): void {
    if (!col.sortable) return;
    const keyStr = String(col.key);
    if (this.sortKey === keyStr) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortKey = keyStr;
      this.sortDirection = 'asc';
    }
    this.sortChanged.emit({ key: this.sortKey, direction: this.sortDirection });
  }

  onPageChange(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.pageChanged.emit(page);
    }
  }
}
