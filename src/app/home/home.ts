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

  async ngOnInit() {
    this.students = await this.getStudents();
  }

  async getStudents(): Promise<any[]> {
    try {
      const data = await fetch(this.url);
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
      const res = await fetch(`${this.url}/${id}`, { method: 'DELETE' });

      if (!res.ok) {
        throw new Error('Failed to delete student');
      }

      this.students = this.students.filter((student) => Number(student.id) !== id);
      alert('Student deleted successfully');
    } catch (error) {
      alert((error as Error).message);
    }
  }

  async getStudentsbyID(id: number): Promise<any | undefined> {
    const data = await fetch(`${this.url}/${id}`);
    return (await data.json()) ?? {};
  }
}
