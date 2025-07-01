import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';


@Component({
  selector: 'app-create-class',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './create-class.component.html',
})
export class CreateClassComponent implements OnInit {
  @Output() fieldFocus = new EventEmitter<string>();
  classForm!: FormGroup;
  majors: any[] = [];
  lecturers: any[] = [];
  constructor(
    private fb: FormBuilder,
    private http: HttpClient
  ) { }

  ngOnInit(): void {
    this.classForm = this.fb.group({
      classId: ['', [Validators.required, Validators.maxLength(10)]],
      className: ['', [Validators.required, Validators.maxLength(50)]],
      majorId: ['', [Validators.required]],
      academicYear: ['', [Validators.required, Validators.maxLength(20)]],
      homeroomTeacher: ['', [Validators.required]],
      classSize: [null, [Validators.required, Validators.min(1)]],
    });

    // Fetch majors
    this.http.get<any[]>('http://localhost:3000/majors').subscribe(res => {
      this.majors = res;
    });

    // Fetch lecturers
    this.http.get<any[]>('http://localhost:3000/lecturers').subscribe(res => {
      this.lecturers = res;
    });
  }

  onSubmit(): void {
    if (this.classForm.valid) {
      const formData = this.classForm.value;
      console.log('Form Submitted:', formData);
      // Placeholder for server submission logic
      this.http.post('http://localhost:3000/class', formData).subscribe(response => {
        console.log('Server response:', response);
      }, error => {
        console.error('Error submitting form:', error);
      });
    } else {
      console.error('Form is invalid');
    }
  }


}
