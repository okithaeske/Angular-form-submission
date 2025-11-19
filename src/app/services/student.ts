import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { KeycloakService } from '../auth/keycloak.service';

const STUDENT_API_URL = 'http://host.docker.internal:5195/api/students';

@Injectable({ providedIn: 'root' })
export class StudentService {
  private apiUrl = STUDENT_API_URL;

  constructor(private http: HttpClient, private keycloak: KeycloakService) {}

  getStudents() {
    const token = this.keycloak.getToken();
    const headers = token ? new HttpHeaders().set('Authorization', `Bearer ${token}`) : new HttpHeaders();
    return this.http.get(this.apiUrl, { headers });
  }
}
