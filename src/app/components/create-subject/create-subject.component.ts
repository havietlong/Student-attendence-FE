import { HttpClient } from '@angular/common/http';
import { Component, EventEmitter, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-create-subject',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './create-subject.component.html',
  styleUrl: './create-subject.component.css'
})
export class CreateSubjectComponent {
  @Output() fieldFocus = new EventEmitter<string>();
 subject = {
    subjectCode: '',
    subjectName: '',
    credit: null,
    lectureHours: null,
    practiceHours: null,
    majorCode: '',
    prerequisiteSubjectCode: null
  };

  constructor(private http: HttpClient) {}

  resetSubject() {
    this.subject = {
      subjectCode: '',
      subjectName: '',
      credit: null,
      lectureHours: null,
      practiceHours: null,
      majorCode: '',
      prerequisiteSubjectCode: null
    };
  }

  submitSubject() {
    this.http.post('http://localhost:3000/subject', this.subject).subscribe({
      next: (res) => {
        console.log('Subject created:', res);
        this.resetSubject();
      },
      error: (err) => {
        console.error('Error creating subject:', err);
      }
    });
  }
}

