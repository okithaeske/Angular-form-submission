import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { KeycloakService } from '../auth/keycloak.service';

@Injectable({ providedIn: 'root' })
export class StudentService {
  private apiUrl = 'http://localhost:5195/api/students';

  constructor(private http: HttpClient, private keycloak: KeycloakService) {}

  getStudents() {
    const token = this.keycloak.getToken();
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.get(this.apiUrl, { headers });
  }
}
