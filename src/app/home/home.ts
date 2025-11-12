import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { KeycloakService } from '../auth/keycloak.service';
import { NotificationService } from '../services/notification.service';
import { NotificationCenterComponent } from '../notification-center/notification-center.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, CommonModule, NotificationCenterComponent],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home implements OnInit, OnDestroy {
  private readonly notifications = inject(NotificationService);

  auth = inject(KeycloakService);
  url = 'http://localhost:5144/api/students';
  students: any[] = [];
  navOpen = false;

  async ngOnInit(): Promise<void> {
    this.notifications.flushPersistent();
    this.students = await this.getStudents();
  }

  ngOnDestroy(): void {
  }

  async getStudents(): Promise<any[]> {
    try {
      const token = this.auth.getToken();

      const data = await fetch(this.url, {
        headers: {
          Authorization: 'Bearer ' + token,
          'Content-Type': 'application/json',
        },
      });

      if (!data.ok) {
        throw new Error('Failed to fetch: ' + data.status + ' ' + data.statusText);
      }

      return (await data.json()) ?? [];
    } catch (error) {
      this.notifications.error('Unable to load students. Please try again.');
      console.error('Error fetching students:', error);
      return [];
    }
  }

  async deleteStudent(id: number): Promise<void> {
    if (!confirm('Are you sure you want to delete this student?')) {
      return;
    }

    try {
      const token = this.auth.getToken();
      const res = await fetch(this.url + '/' + id, {
        method: 'DELETE',
        headers: {
          Authorization: 'Bearer ' + token,
        },
      });

      if (!res.ok) {
        throw new Error('Failed to delete student');
      }

      this.students = this.students.filter(student => Number(student.id) !== id);
      this.notifications.success('Student deleted successfully.');
    } catch (error) {
      const message = (error as Error).message || 'Failed to delete student.';
      this.notifications.error(message);
    }
  }

  async getStudentsbyID(id: number): Promise<any | undefined> {
    const data = await fetch(this.url + '/' + id);
    return (await data.json()) ?? {};
  }

  toggleNav(): void {
    this.navOpen = !this.navOpen;
  }

  closeNav(): void {
    this.navOpen = false;
  }
}
