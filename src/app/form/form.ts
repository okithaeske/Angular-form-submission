import { Component } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-form',
  standalone: true,
  imports: [RouterLink, FormsModule],
  templateUrl: './form.html',
  styleUrl: './form.scss',
})
export class Form {
  url = 'http://localhost:5195/api/students';

  name = '';
  studentId = '';
  email = '';
  courseName = '';

  async postForm() {
    try {
      const res = await fetch(this.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: this.name,
          studentId: this.studentId,
          email: this.email,
          courseName: this.courseName,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to submit form');
      }
      alert('Form submitted successfully');
    } catch (error) {
      alert((error as Error).message);
    }
  }
}
