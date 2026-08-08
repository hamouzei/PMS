import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-icon',
  standalone: true,
  imports: [CommonModule],
  template: `
    <svg
      xmlns="http://www.w3.org/2000/svg"
      [attr.width]="size()"
      [attr.height]="size()"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      [ngClass]="class()"
      class="lucide-icon">
      <ng-container [ngSwitch]="name()">
        <!-- Dashboard / Layout -->
        <g *ngSwitchCase="'dashboard'">
          <rect width="7" height="9" x="3" y="3" rx="1"/>
          <rect width="7" height="5" x="14" y="3" rx="1"/>
          <rect width="7" height="9" x="14" y="12" rx="1"/>
          <rect width="7" height="5" x="3" y="16" rx="1"/>
        </g>

        <!-- Requisition / Form -->
        <g *ngSwitchCase="'file-text'">
          <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/>
          <path d="M14 2v4a2 2 0 0 0 2 2h4"/>
          <path d="M10 9H8"/>
          <path d="M16 13H8"/>
          <path d="M16 17H8"/>
        </g>

        <!-- Purchase / Cart -->
        <g *ngSwitchCase="'shopping-cart'">
          <circle cx="8" cy="21" r="1"/>
          <circle cx="19" cy="21" r="1"/>
          <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/>
        </g>

        <!-- Package / Stock -->
        <g *ngSwitchCase="'package'">
          <path d="M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73z"/>
          <path d="M12 22V12"/>
          <path d="m3.3 7 8.7 5 8.7-5"/>
          <path d="m7.5 4.27 9 5.15"/>
        </g>

        <!-- Search / Inspect -->
        <g *ngSwitchCase="'search'">
          <circle cx="11" cy="11" r="8"/>
          <path d="m21 21-4.3-4.3"/>
        </g>

        <!-- Ticket / Issuing -->
        <g *ngSwitchCase="'ticket'">
          <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2z"/>
          <path d="M13 5v2"/>
          <path d="M13 11v2"/>
          <path d="M13 17v2"/>
        </g>

        <!-- User -->
        <g *ngSwitchCase="'user'">
          <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/>
          <circle cx="12" cy="7" r="4"/>
        </g>

        <!-- Users -->
        <g *ngSwitchCase="'users'">
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
          <circle cx="9" cy="7" r="4"/>
          <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
        </g>

        <!-- Undo / Return -->
        <g *ngSwitchCase="'rotate-ccw'">
          <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
          <path d="M3 3v5h5"/>
        </g>

        <!-- Transfer / Refresh -->
        <g *ngSwitchCase="'arrow-left-right'">
          <path d="m16 3 4 4-4 4"/>
          <path d="M20 7H4"/>
          <path d="m8 21-4-4 4-4"/>
          <path d="M4 17h16"/>
        </g>

        <!-- Handshake / Handover -->
        <g *ngSwitchCase="'handshake'">
          <path d="m11 17 2 2a1 1 0 0 0 1.4 0l5.6-5.6a1 1 0 0 0 0-1.4l-2.6-2.6a1 1 0 0 0-1.4 0L14 11.4"/>
          <path d="m18 11 2.5-2.5a1 1 0 0 0 0-1.4L18 4.6a1 1 0 0 0-1.4 0L14 7.2"/>
          <path d="M2 13 8.6 6.4a1 1 0 0 1 1.4 0l2.6 2.6a1 1 0 0 1 0 1.4L6 17"/>
          <path d="m6 17-2 2a1 1 0 0 1-1.4 0l-.6-.6a1 1 0 0 1 0-1.4l2-2"/>
        </g>

        <!-- Trash / Disposal -->
        <g *ngSwitchCase="'trash-2'">
          <path d="M3 6h18"/>
          <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
          <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
          <line x1="10" x2="10" y1="11" y2="17"/>
          <line x1="14" x2="14" y1="11" y2="17"/>
        </g>

        <!-- Clipboard / Inventory -->
        <g *ngSwitchCase="'clipboard-list'">
          <rect width="8" height="4" x="8" y="2" rx="1" ry="1"/>
          <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
          <path d="M12 11h4"/>
          <path d="M12 16h4"/>
          <path d="M8 11h.01"/>
          <path d="M8 16h.01"/>
        </g>

        <!-- Shield / Compliance -->
        <g *ngSwitchCase="'shield-check'">
          <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/>
          <path d="m9 12 2 2 4-4"/>
        </g>

        <!-- Lock / Safety -->
        <g *ngSwitchCase="'lock'">
          <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
        </g>

        <!-- Settings / Config -->
        <g *ngSwitchCase="'settings'">
          <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
          <circle cx="12" cy="12" r="3"/>
        </g>

        <!-- Chart / Reports -->
        <g *ngSwitchCase="'bar-chart-3'">
          <path d="M3 3v18h18"/>
          <path d="M18 17V9"/>
          <path d="M13 17V5"/>
          <path d="M8 17v-3"/>
        </g>

        <!-- Moon / Dark theme -->
        <g *ngSwitchCase="'moon'">
          <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>
        </g>

        <!-- Sun / Light theme -->
        <g *ngSwitchCase="'sun'">
          <circle cx="12" cy="12" r="4"/>
          <path d="M12 2v2"/>
          <path d="M12 20v2"/>
          <path d="m4.93 4.93 1.41 1.41"/>
          <path d="m17.66 17.66 1.41 1.41"/>
          <path d="M2 12h2"/>
          <path d="M20 12h2"/>
          <path d="m6.34 17.66-1.41 1.41"/>
          <path d="m19.07 4.93-1.41 1.41"/>
        </g>

        <!-- Log Out -->
        <g *ngSwitchCase="'log-out'">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
          <polyline points="16 17 21 12 16 7"/>
          <line x1="21" x2="9" y1="12" y2="12"/>
        </g>

        <!-- Alert Triangle -->
        <g *ngSwitchCase="'alert-triangle'">
          <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
          <line x1="12" x2="12" y1="9" y2="13"/>
          <line x1="12" x2="12.01" y1="17" y2="17"/>
        </g>

        <!-- Plus -->
        <g *ngSwitchCase="'plus'">
          <path d="M5 12h14"/>
          <path d="M12 5v14"/>
        </g>

        <!-- Check / Check Circle -->
        <g *ngSwitchCase="'check'">
          <path d="M20 6 9 17l-5-5"/>
        </g>

        <g *ngSwitchCase="'check-circle'">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
          <polyline points="22 4 12 14.01 9 11.01"/>
        </g>

        <!-- X / Close -->
        <g *ngSwitchCase="'x'">
          <path d="M18 6 6 18"/>
          <path d="m6 6 12 12"/>
        </g>

        <g *ngSwitchCase="'x-circle'">
          <circle cx="12" cy="12" r="10"/>
          <path d="m15 9-6 6"/>
          <path d="m9 9 6 6"/>
        </g>

        <!-- Scale / Balance -->
        <g *ngSwitchCase="'scale'">
          <path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/>
          <path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/>
          <path d="M7 21h10"/>
          <path d="M12 3v18"/>
          <path d="M3 7h18"/>
        </g>

        <!-- Bell -->
        <g *ngSwitchCase="'bell'">
          <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/>
          <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>
        </g>

        <!-- Paperclip -->
        <g *ngSwitchCase="'paperclip'">
          <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
        </g>

        <!-- Eye / Detail -->
        <g *ngSwitchCase="'eye'">
          <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
          <circle cx="12" cy="12" r="3"/>
        </g>

        <!-- Edit -->
        <g *ngSwitchCase="'edit'">
          <path d="M12 20h9"/>
          <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
        </g>

        <!-- Warehouse / Building -->
        <g *ngSwitchCase="'warehouse'">
          <path d="M22 8.35V20a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8.35A2 2 0 0 1 3.26 6.5l8-4.5a2 2 0 0 1 1.48 0l8 4.5A2 2 0 0 1 22 8.35Z"/>
          <path d="M6 18h12v-6H6v6Z"/>
          <path d="M6 12v-2"/>
          <path d="M18 12v-2"/>
        </g>

        <!-- Truck / Supplier -->
        <g *ngSwitchCase="'truck'">
          <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/>
          <path d="M15 18H9"/>
          <path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.62l-3.24-4.05a1 1 0 0 0-.78-.36H14"/>
          <circle cx="7" cy="18" r="2"/>
          <circle cx="17" cy="18" r="2"/>
        </g>

        <!-- Tags / Master Fields -->
        <g *ngSwitchCase="'tag'">
          <path d="M12 2H2v10l11.29 11.29a1 1 0 0 0 1.41 0l8.3-8.3a1 1 0 0 0 0-1.41L12 2Z"/>
          <path d="M7 7h.01"/>
        </g>

        <!-- Layers / Categories -->
        <g *ngSwitchCase="'layers'">
          <polygon points="12 2 2 7 12 12 22 7 12 2"/>
          <polyline points="2 17 12 22 22 17"/>
          <polyline points="2 12 12 17 22 12"/>
        </g>

        <!-- Inbox / Receive -->
        <g *ngSwitchCase="'inbox'">
          <polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/>
          <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>
        </g>

        <!-- Default fallback icon (info circle) -->
        <g *ngSwitchDefault>
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" x2="12" y1="16" y2="12"/>
          <line x1="12" x2="12.01" y1="8" y2="8"/>
        </g>
      </ng-container>
    </svg>
  `,
  styles: [`
    :host {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      vertical-align: middle;
      line-height: 1;
    }
    .lucide-icon {
      display: inline-block;
      flex-shrink: 0;
      vertical-align: middle;
    }
  `]
})
export class IconComponent {
  name = input<string>('info');
  size = input<number>(18);
  class = input<string>('');
}
