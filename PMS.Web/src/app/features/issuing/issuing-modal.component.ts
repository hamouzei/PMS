import { Component, OnInit, inject, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { IssuingApiService, IssueStockPayload } from '../../core/services/issuing-api.service';
import { RequisitionApiService, StoreRequestSummary } from '../../core/services/requisition-api.service';
import { NotificationService } from '../../core/services/notification.service';
import { AuthStore } from '../../core/auth/auth.store';

@Component({
  selector: 'app-issuing-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ButtonComponent],
  template: `
    <div class="modal-backdrop" (click)="close()">
      <div class="modal-panel" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h3>📦 Issue Stock</h3>
          <button class="modal-close" (click)="close()">&times;</button>
        </div>
        <form [formGroup]="form" (ngSubmit)="onSubmit()" class="modal-body">
          <div class="form-group">
            <label>Approved Store Request *</label>
            <select formControlName="serviceRequestId" class="form-control">
              <option value="">Select an approved request</option>
              <option *ngFor="let sr of approvedRequests" [value]="sr.id">{{ sr.srNumber }} — {{ sr.requester }}</option>
            </select>
            <small *ngIf="approvedRequests.length === 0 && !loadingRequests" class="hint">No approved requests available for issuing</small>
          </div>
          <div class="form-group">
            <label>Recipient Signature</label>
            <input formControlName="recipientSignature" class="form-control" placeholder="Name of person collecting" />
          </div>
          <div class="modal-footer">
            <app-button variant="secondary" type="button" (btnClick)="close()">Cancel</app-button>
            <app-button variant="gold" type="submit" [loading]="saving" [disabled]="form.invalid">
              <span>📦 Issue Stock</span>
            </app-button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 1000; display: flex; align-items: center; justify-content: center; padding: 1rem; }
    .modal-panel { background: var(--bg-surface); border-radius: var(--radius-lg); box-shadow: var(--shadow-lg); width: 100%; max-width: 520px; }
    .modal-header { display: flex; justify-content: space-between; align-items: center; padding: 1rem 1.5rem; border-bottom: 1px solid var(--border-color); h3 { font-size: 1.125rem; font-weight: 600; } }
    .modal-close { font-size: 1.5rem; color: var(--text-secondary); cursor: pointer; background: none; border: none; }
    .modal-body { padding: 1.5rem; display: flex; flex-direction: column; gap: 1rem; }
    .modal-footer { display: flex; justify-content: flex-end; gap: 0.75rem; padding-top: 0.5rem; }
    .form-group { display: flex; flex-direction: column; gap: 0.25rem; label { font-size: 0.8125rem; font-weight: 500; color: var(--text-secondary); } }
    .form-control { padding: 0.5rem 0.75rem; border: 1px solid var(--border-color); border-radius: var(--radius-md); font-size: 0.875rem; background-color: var(--bg-surface); color: var(--text-primary); }
    .hint { font-size: 0.75rem; color: var(--text-muted); }
  `]
})
export class IssuingModalComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(IssuingApiService);
  private readonly reqApi = inject(RequisitionApiService);
  private readonly authStore = inject(AuthStore);
  private readonly notify = inject(NotificationService);

  closed = output<void>();
  saved = output<void>();
  saving = false;
  loadingRequests = true;
  approvedRequests: StoreRequestSummary[] = [];

  form: FormGroup = this.fb.group({
    serviceRequestId: ['', Validators.required],
    recipientSignature: ['']
  });

  ngOnInit(): void {
    this.reqApi.getStoreRequests(1, 100, 'Approved').subscribe({
      next: (r) => { this.approvedRequests = r.items; this.loadingRequests = false; },
      error: () => { this.loadingRequests = false; }
    });
  }

  onSubmit(): void {
    if (this.form.invalid) return;
    this.saving = true;
    const v = this.form.getRawValue();
    const payload: IssueStockPayload = {
      serviceRequestId: v.serviceRequestId,
      issuedById: this.authStore.user()?.id || '',
      recipientSignature: v.recipientSignature || undefined
    };
    this.api.issueStock(payload).subscribe({
      next: () => { this.saving = false; this.saved.emit(); },
      error: () => { this.saving = false; this.notify.error('Error', 'Failed to issue stock'); }
    });
  }

  close(): void { this.closed.emit(); }
}
