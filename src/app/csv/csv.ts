import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { NotificationService } from '../services/notification.service';

interface UploadResponse {
  message?: string;
  path?: string;
}

@Component({
  selector: 'app-csv',
  standalone: true,
  imports: [RouterLink, CommonModule],
  templateUrl: './csv.html',
  styleUrl: './csv.scss',
})
export class Csv {
  private readonly uploadUrl = 'http://localhost:5285/api/csv/upload';

  selectedFile: File | null = null;
  isSubmitting = false;
  responseMessage = '';
  uploadedFilePath = '';

  constructor(private readonly notifications: NotificationService) {}

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;

    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
      this.responseMessage = '';
      this.uploadedFilePath = '';
    }
  }

  async uploadFile(event?: Event): Promise<void> {
    event?.preventDefault();

    if (!this.selectedFile) {
      const warning = 'Please select a file before uploading.';
      this.responseMessage = warning;
      this.notifications.warning(warning);
      return;
    }

    const formData = new FormData();
    formData.append('file', this.selectedFile);

    this.isSubmitting = true;
    this.responseMessage = '';

    try {
      const response = await fetch(this.uploadUrl, {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Upload failed with status ' + response.status + '.');
      }

      const data: UploadResponse = await response.json().catch(() => ({}));
      const successMessage = data.message || 'File uploaded successfully.';

      this.responseMessage = successMessage;
      this.uploadedFilePath = data.path || '';

      this.notifications.queuePersistent('success', successMessage, { delay: 500 });

      if (this.uploadedFilePath) {
        this.notifications.queuePersistent(
          'info',
          'File saved at ' + this.uploadedFilePath,
          { delay: 800 }
        );
      }

      this.notifications.queuePersistent(
        'info',
        'We will keep you posted on the import progress once you return to the dashboard.',
        { delay: 950 }
      );

      setTimeout(() => {
        window.location.href = '/';
      }, 1500);
    } catch (error) {
      const message = (error as Error).message || 'Upload failed.';
      this.responseMessage = message;
      this.notifications.error(message);
      console.error('CSV upload error:', error);
    } finally {
      this.isSubmitting = false;
    }
  }
}
