import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-form',
  standalone: true,
  imports: [RouterLink, FormsModule, CommonModule],
  templateUrl: './form.html',
  styleUrl: './form.scss',
})
export class Form {
  url = 'http://localhost:5195/api/students';

  name = '';
  studentId = '';
  email = '';
  courseName = '';

  editMode = false;
  studentIdToEdit: number | null = null;

  constructor(private route: ActivatedRoute, private router: Router) {}

  async ngOnInit() {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.editMode = true;
      this.studentIdToEdit = +idParam;
      await this.loadStudentData(this.studentIdToEdit);
    }
  }

  async loadStudentData(id: number) {
    try {
      const data = await fetch(`${this.url}/${id}`);
      if (!data.ok) {
        throw new Error('Failed to fetch student data');
      }
      const student = await data.json();
      this.name = student.name;
      this.studentId = student.studentId;
      this.email = student.email;
      this.courseName = student.courseName;
    } catch (error) {
      alert((error as Error).message);
    }
  }

  async postForm(form: NgForm) {
    if (form.invalid) {
      form.control.markAllAsTouched();
      return;
    }

    const payload = {
      name: this.name,
      studentId: this.studentId,
      email: this.email,
      courseName: this.courseName,
    };

    try {
      let res;
      Response;
      if (this.editMode && this.studentIdToEdit !== null) {
        // update existing record
        res = await fetch(`${this.url}/${this.studentIdToEdit}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        // add new record
        res = await fetch(this.url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      if (res.status === 409){
        throw new Error('Student with this Student ID already exists');
      }

      if (!res.ok) {
        throw new Error('Failed to submit form');
      }

      form.resetForm();
      alert(this.editMode ? 'Student updated successfully!' : 'Student added successfully!');
      await this.router.navigate(['/']);
    } catch (error) {
      alert((error as Error).message);
    }
  }
}
