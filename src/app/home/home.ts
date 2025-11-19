import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { KeycloakService } from '../auth/keycloak.service';
import { NotificationService } from '../services/notification.service';
import { NotificationCenterComponent } from '../notification-center/notification-center.component';

const STUDENT_API_URL = 'http://host.docker.internal:5195/api/students';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, CommonModule, NotificationCenterComponent],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home implements OnInit, OnDestroy {
  private readonly notifications = inject(NotificationService);
  readonly auth = inject(KeycloakService);

  url = STUDENT_API_URL;
  students: any[] = [];
  navOpen = false;

  async ngOnInit(): Promise<void> {
    this.notifications.flushPersistent();
    this.students = await this.getStudents();
  }

  ngOnDestroy(): void {}

  async getStudents(): Promise<any[]> {
    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      const token = this.auth.getToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(this.url, { headers });

      if (!response.ok) {
        throw new Error(`Failed to fetch students: ${response.status} ${response.statusText}`);
      }

      const payload = await response.json();
      return Array.isArray(payload) ? payload : [];
    } catch (error) {
      console.error('Error fetching students', { url: this.url, error });
      this.notifications.error('Unable to load students. Please try again.');
      return [];
    }
  }

  async deleteStudent(id: number): Promise<void> {
    if (!confirm('Are you sure you want to delete this student?')) {
      return;
    }

    try {
      const headers: HeadersInit = {};
      const token = this.auth.getToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch(`${this.url}/${id}`, {
        method: 'DELETE',
        headers,
      });

      if (!res.ok) {
        throw new Error(`Failed to delete student (${res.status})`);
      }

      this.students = this.students.filter(student => Number(student.id) !== id);
      this.notifications.success('Student deleted successfully.');
    } catch (error) {
      console.error('Error deleting student', { id, error });
      const message = (error as Error).message || 'Failed to delete student.';
      this.notifications.error(message);
    }
  }

  async getStudentsbyID(id: number): Promise<any | undefined> {
    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      const token = this.auth.getToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${this.url}/${id}`, { headers });
      if (!response.ok) {
        throw new Error(`Failed to fetch student ${id}: ${response.status} ${response.statusText}`);
      }

      return (await response.json()) ?? {};
    } catch (error) {
      console.error('Error fetching student by ID', { id, error });
      this.notifications.error('Unable to load the requested student.');
      return undefined;
    }
  }

  toggleNav(): void {
    this.navOpen = !this.navOpen;
  }

  closeNav(): void {
    this.navOpen = false;
  }
}
