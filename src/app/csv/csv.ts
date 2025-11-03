import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HttpClient, HttpClientModule, HttpEventType } from '@angular/common/http';
import { CommonModule } from '@angular/common';

interface UploadResponse {
  status: string;
  filePath: string;
  message?: string;
}

@Component({
  selector: 'app-csv',
  standalone: true,
  imports: [RouterLink, CommonModule, HttpClientModule],
  templateUrl: './csv.html',
  styleUrl: './csv.scss',
  providers: [HttpClient]
})
export class Csv {
  selectedFile: File | null = null;
  isUploading = false;
  uploadProgress = 0;
  uploadStatus: 'idle' | 'uploading' | 'success' | 'error' = 'idle';
  responseMessage = '';
  uploadedFilePath = '';

  constructor(private http: HttpClient) {}

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
      // Reset status on new file selection
      this.uploadStatus = 'idle';
      this.responseMessage = '';
      this.uploadedFilePath = '';
      this.uploadProgress = 0;
    }
  }

  uploadFile(event?: Event) {
    event?.preventDefault();
    if (!this.selectedFile) {
      this.responseMessage = 'Please select a file first';
      return;
    }

    const formData = new FormData();
    formData.append('file', this.selectedFile);

    this.isUploading = true;
    this.uploadStatus = 'uploading';
    this.responseMessage = '';
    
    this.http.post<UploadResponse>('http://localhost:5285/api/csv/upload', formData, {
      reportProgress: true,
      observe: 'events'
    }).subscribe({
      next: (event) => {
        if (event.type === HttpEventType.UploadProgress && event.total) {
          this.uploadProgress = Math.round(100 * event.loaded / event.total);
        } else if (event.type === HttpEventType.Response) {
          const response = event.body as UploadResponse;
          this.uploadStatus = 'success';
          this.uploadedFilePath = response.filePath;
          this.responseMessage = response.message || 'File uploaded successfully';
          this.selectedFile = null;
          const input = document.getElementById('csvUpload') as HTMLInputElement;
          if (input) input.value = '';
        }
      },
      error: (error) => {
        this.uploadStatus = 'error';
        this.responseMessage = error.error?.message || 'Upload failed: ' + (error.message || 'Unknown error');
        console.error('Upload failed:', error);
      },
      complete: () => {
        this.isUploading = false;
      }
    });
  }
}
