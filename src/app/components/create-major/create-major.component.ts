import { HttpClient } from '@angular/common/http';
import { Component, EventEmitter, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-create-major',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './create-major.component.html',
  styleUrl: './create-major.component.css'
})
export class CreateMajorComponent {
  @Output() fieldFocus = new EventEmitter<string>();
  major = {
    majorCode: '',
    majorName: '',
    departmentCode: '',
    requiredCredits: null
  };

  constructor(private http: HttpClient) {}

  resetMajor() {
    this.major = {
      majorCode: '',
      majorName: '',
      departmentCode: '',
      requiredCredits: null
    };
  }

  submitMajor() {
    this.http.post('http://localhost:3000/majors', this.major).subscribe({
      next: (res) => {
        console.log('Major created:', res);
        this.resetMajor();
      },
      error: (err) => {
        console.error('Error creating major:', err);
      }
    });
  }
}
