import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { KeycloakService } from '../auth/keycloak.service'; 

@Injectable({ providedIn: 'root' })
export class StudentService {
  // 👇 This is where you put your backend URL (your .NET API port)
  private apiUrl = 'http://localhost:5075/api/students';

  constructor(private http: HttpClient, private keycloak: KeycloakService) {}

  // Example: GET request to your backend
  getStudents() {
    const token = this.keycloak.getToken();
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.get(this.apiUrl, { headers });
  }
}
