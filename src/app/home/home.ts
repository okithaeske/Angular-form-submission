import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { KeycloakService } from '../auth/keycloak.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, CommonModule],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {
  auth = inject(KeycloakService);
  url = 'http://localhost:5195/api/students';
  students: any[] = [];
  hasUnreadNotifications = false;
  navOpen = false;

  async ngOnInit() {
    this.students = await this.getStudents();
  }

  async getStudents(): Promise<any[]> {
    try {
      const token = this.auth.getToken();

      const data = await fetch(this.url, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!data.ok) {
        throw new Error(`Failed to fetch: ${data.status} ${data.statusText}`);
      }

      return (await data.json()) ?? [];
    } catch (error) {
      console.error('Error fetching students:', error);
      return [];
    }
  }

  async deleteStudent(id: number) {
    if (!confirm('Are you sure you want to delete this student?')) {
      return;
    }

    try {
      const token = this.auth.getToken();
      const res = await fetch(`${this.url}/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error('Failed to delete student');

      this.students = this.students.filter((s) => Number(s.id) !== id);
      alert('Student deleted successfully');
    } catch (error) {
      alert((error as Error).message);
    }
  }

  async getStudentsbyID(id: number): Promise<any | undefined> {
    const data = await fetch(`${this.url}/${id}`);
    return (await data.json()) ?? {};
  }

  openNotifications() {
    const message = this.hasUnreadNotifications
      ? 'You have new notifications.'
      : 'No new notifications right now.';
    alert(message);
    this.hasUnreadNotifications = false;
    this.closeNav();
  }

  toggleNav() {
    this.navOpen = !this.navOpen;
  }

  closeNav() {
    this.navOpen = false;
  }
}
