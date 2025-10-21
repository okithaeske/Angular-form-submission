import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, CommonModule],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {
  url = 'http://localhost:5195/api/students';
  students: any[] = [];

  async ngOnInit() {
    this.students = await this.getStudents();
  }

  // get students form
  async getStudents(): Promise<Home[]> {
    try {
      const data = await fetch(this.url);
      return (await data.json()) ?? [];
    } catch (error) {
      console.error('Error fetching students:', error);
      return [];
    }
  }

  // delete student form

  async deleteStudent(id: number) {
    if (!confirm('Are you sure you want to delete this student?')) return;

    const res = await fetch(`${this.url}/${id}`, { method: 'DELETE' });

    if (res.ok) {
      this.students = this.students.filter((s) => s.studentId !== id);
      alert('Student deleted successfully');
    } else {
      alert('Failed to delete student');
    }
  }

  async getStudentsbyID(id: number): Promise<Home | undefined> {
    const data = await fetch(`${this.url}/${id}`);
    return (await data.json()) ?? {};
  }
}
