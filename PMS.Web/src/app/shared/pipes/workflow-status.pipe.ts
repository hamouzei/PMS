import { Pipe, PipeTransform } from '@angular/core';
import { WorkflowStatus } from '../../core/models/workflow.model';

const STATUS_TITLES: Record<WorkflowStatus, string> = {
  [WorkflowStatus.Draft]: 'Draft',
  [WorkflowStatus.Submitted]: 'Submitted',
  [WorkflowStatus.PendingApproval]: 'Pending Approval',
  [WorkflowStatus.Approved]: 'Approved',
  [WorkflowStatus.Rejected]: 'Rejected',
  [WorkflowStatus.Cancelled]: 'Cancelled',
  [WorkflowStatus.Received]: 'Received',
  [WorkflowStatus.InspectionPending]: 'Inspection Pending',
  [WorkflowStatus.InspectionPassed]: 'Inspection Passed',
  [WorkflowStatus.InspectionFailed]: 'Inspection Failed',
  [WorkflowStatus.Issued]: 'Issued',
  [WorkflowStatus.Returned]: 'Returned',
  [WorkflowStatus.Transferred]: 'Transferred',
  [WorkflowStatus.Disposed]: 'Disposed',
  [WorkflowStatus.Closed]: 'Closed',
  [WorkflowStatus.HandedOver]: 'Handed Over'
};

@Pipe({
  name: 'workflowStatus',
  standalone: true
})
export class WorkflowStatusPipe implements PipeTransform {
  transform(value: WorkflowStatus | number | string | null | undefined): string {
    if (value === null || value === undefined) return 'Unknown';
    const statusEnum = typeof value === 'number' ? (value as WorkflowStatus) : WorkflowStatus[value as keyof typeof WorkflowStatus];
    return STATUS_TITLES[statusEnum] || String(value);
  }
}
