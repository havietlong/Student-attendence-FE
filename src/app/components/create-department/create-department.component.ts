import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, EventEmitter, Output } from '@angular/core';
import { FormsModule, NgModel } from '@angular/forms';
import { catchError, of } from 'rxjs';

@Component({
  selector: 'app-create-department',
   imports: [FormsModule,CommonModule],
  standalone: true, 
  templateUrl: './create-department.component.html',
  styleUrl: './create-department.component.css'
})
export class CreateDepartmentComponent {
  @Output() fieldFocus = new EventEmitter<string>();
department = {
    departmentCode: '',
    departmentName: '',
    headOfDepartment: '',
    establishedDate: '',
    phoneNumber: '',
    email: ''
  };

  resetDepartment() {
    this.department = {
      departmentCode: '',
      departmentName: '',
      headOfDepartment: '',
      establishedDate: '',
      phoneNumber: '',
      email: ''
    };
  }

  constructor(private http: HttpClient) { }

  submitDepartment() {
    console.log('Submitting Department:', this.department);

    this.http.post<any>('http://localhost:3000/departments', this.department)
      .pipe(
        catchError(error => {
          console.error('Error occurred:', error);
          return of({ success: false, message: 'Submission failed' });
        })
      )
      .subscribe(res => {
        
        if (res) {
          console.log('Department submitted successfully:', res);
        } else {
          console.log('Failed to submit department:', res.message);
        }
      });
  }

}
