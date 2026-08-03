import { Component, Input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface UploadedFileMeta {
  fileName: string;
  contentType: string;
  sizeBytes: number;
  file?: File;
}

@Component({
  selector: 'app-file-uploader',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="uploader-container">
      <label *ngIf="label" class="uploader-label">{{ label }}</label>
      <div
        class="drop-zone"
        [class.is-dragover]="isDragOver"
        (dragover)="onDragOver($event)"
        (dragleave)="onDragLeave($event)"
        (drop)="onDrop($event)"
        (click)="fileInput.click()">
        <input #fileInput type="file" [multiple]="multiple" [accept]="accept" (change)="onFileSelected($event)" class="hidden-input" />
        <div class="upload-prompt">
          <svg class="upload-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          <span class="prompt-text">Drag & drop files here, or <span class="browse-link">browse</span></span>
          <span class="prompt-subtext">Supports PDF, PNG, JPG up to 10MB</span>
        </div>
      </div>

      <div *ngIf="files.length > 0" class="file-list">
        <div *ngFor="let f of files; let i = index" class="file-item">
          <span class="file-name">{{ f.fileName }} ({{ formatSize(f.sizeBytes) }})</span>
          <button type="button" class="remove-btn" (click)="removeFile(i)">&times;</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .uploader-container { margin-bottom: 1rem; }
    .uploader-label { display: block; font-size: 0.8125rem; font-weight: 500; color: var(--text-secondary); margin-bottom: 0.375rem; }
    .drop-zone {
      border: 2px dashed var(--border-color);
      border-radius: var(--radius-md);
      padding: 1.5rem;
      text-align: center;
      cursor: pointer;
      background-color: var(--bg-surface);
      transition: all var(--transition-fast);

      &:hover, &.is-dragover {
        border-color: var(--ecx-navy-primary);
        background-color: var(--bg-surface-hover);
      }
    }
    .hidden-input { display: none; }
    .upload-icon { width: 32px; height: 32px; color: var(--text-muted); margin-bottom: 0.5rem; }
    .prompt-text { display: block; font-size: 0.875rem; color: var(--text-primary); font-weight: 500; }
    .browse-link { color: var(--ecx-info); text-decoration: underline; }
    .prompt-subtext { display: block; font-size: 0.75rem; color: var(--text-muted); margin-top: 0.25rem; }
    .file-list { margin-top: 0.75rem; display: flex; flex-direction: column; gap: 0.5rem; }
    .file-item {
      display: flex; align-items: center; justify-content: space-between;
      padding: 0.5rem 0.75rem;
      background-color: var(--bg-app);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-sm);
      font-size: 0.8125rem;
    }
    .remove-btn { color: var(--ecx-danger); font-size: 1.25rem; line-height: 1; cursor: pointer; }
  `]
})
export class FileUploaderComponent {
  @Input() label = 'Upload Documents';
  @Input() multiple = true;
  @Input() accept = '.pdf,.png,.jpg,.jpeg';

  filesChanged = output<UploadedFileMeta[]>();

  files: UploadedFileMeta[] = [];
  isDragOver = false;

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = false;
    if (event.dataTransfer?.files) {
      this.handleFiles(Array.from(event.dataTransfer.files));
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.handleFiles(Array.from(input.files));
    }
  }

  removeFile(index: number): void {
    this.files.splice(index, 1);
    this.filesChanged.emit(this.files);
  }

  formatSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  private handleFiles(fileList: File[]): void {
    for (const f of fileList) {
      this.files.push({
        fileName: f.name,
        contentType: f.type,
        sizeBytes: f.size,
        file: f
      });
    }
    this.filesChanged.emit(this.files);
  }
}
