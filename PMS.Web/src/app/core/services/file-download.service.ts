import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class FileDownloadService {
  /**
   * Downloads a Blob payload with a specified filename.
   */
  public downloadBlob(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  /**
   * Parses the filename from Content-Disposition HTTP header if present.
   */
  public extractFilenameFromHeader(contentDispositionHeader: string | null, fallbackFilename: string): string {
    if (!contentDispositionHeader) {
      return fallbackFilename;
    }

    const filenameMatch = contentDispositionHeader.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
    if (filenameMatch && filenameMatch[1]) {
      return filenameMatch[1].replace(/['"]/g, '');
    }

    return fallbackFilename;
  }
}
