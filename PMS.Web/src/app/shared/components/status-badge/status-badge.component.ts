import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WorkflowStatusPipe } from '../../pipes/workflow-status.pipe';
import { WorkflowStatus } from '../../../core/models/workflow.model';

@Component({
  selector: 'app-status-badge',
  standalone: true,
  imports: [CommonModule, WorkflowStatusPipe],
  template: `
    <span [class]="'badge badge-' + getBadgeClass()">
      {{ status | workflowStatus }}
    </span>
  `,
  styles: [`
    .badge {
      display: inline-flex;
      align-items: center;
      padding: 0.25rem 0.625rem;
      font-size: 0.75rem;
      font-weight: 600;
      border-radius: 9999px;
      text-transform: capitalize;
    }
    .badge-success { background-color: var(--ecx-success-bg); color: #065F46; }
    .badge-warning { background-color: var(--ecx-warning-bg); color: #92400E; }
    .badge-danger { background-color: var(--ecx-danger-bg); color: #991B1B; }
    .badge-info { background-color: var(--ecx-info-bg); color: #1E40AF; }
    .badge-neutral { background-color: var(--bg-surface-hover); color: var(--text-secondary); }
  `]
})
export class StatusBadgeComponent {
  @Input({ required: true }) status: WorkflowStatus | number | string = WorkflowStatus.Submitted;

  getBadgeClass(): string {
    const s = typeof this.status === 'number' ? this.status : Number(this.status);

    if ([WorkflowStatus.Approved, WorkflowStatus.InspectionPassed, WorkflowStatus.Issued, WorkflowStatus.Closed, WorkflowStatus.HandedOver, WorkflowStatus.Transferred].includes(s)) {
      return 'success';
    }
    if ([WorkflowStatus.PendingApproval, WorkflowStatus.InspectionPending, WorkflowStatus.Submitted].includes(s)) {
      return 'warning';
    }
    if ([WorkflowStatus.Rejected, WorkflowStatus.InspectionFailed, WorkflowStatus.Cancelled].includes(s)) {
      return 'danger';
    }
    if ([WorkflowStatus.Received, WorkflowStatus.Returned, WorkflowStatus.Disposed].includes(s)) {
      return 'info';
    }
    return 'neutral';
  }
}
