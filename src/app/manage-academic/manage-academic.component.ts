import { NgSwitch, NgSwitchCase } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SidebarComponent } from "../components/sidebar/sidebar.component";
import { CreateClassComponent } from "../components/create-class/create-class.component";
import { CreateDepartmentComponent } from "../components/create-department/create-department.component";
import { CreateMajorComponent } from "../components/create-major/create-major.component";
import { CreateSubjectComponent } from "../components/create-subject/create-subject.component";
import { RecordPreviewComponent } from "../record-preview/record-preview.component";

@Component({
  selector: 'app-manage-academic',
  standalone: true,
  imports: [FormsModule, NgSwitch, NgSwitchCase, SidebarComponent, CreateClassComponent, CreateDepartmentComponent, CreateMajorComponent, CreateSubjectComponent, RecordPreviewComponent],
  templateUrl: './manage-academic.component.html',
  styleUrl: './manage-academic.component.css'
})
export class ManageAcademicComponent {
selectedTab = 'user';
focusedField: string | null = null;

onFieldFocused(fieldName: string) {
  this.focusedField = fieldName;
}

onFieldValueSelected(value: string) {
  // Optionally, pass this value down to the form or set it globally
  console.log('User selected:', value);
}

department = {
  departmentCode: '',
  departmentName: '',
  headOfDepartment: '',
  establishedDate: '',
  phoneNumber: '',
  email: ''
};

onResetDepartment() {
  this.department = {
    departmentCode: '',
    departmentName: '',
    headOfDepartment: '',
    establishedDate: '',
    phoneNumber: '',
    email: ''
  };
}

onSubmitDepartment() {
  // this.http.post('/api/departments', this.department).subscribe({
  //   next: () => {
  //     alert('Department created successfully!');
  //     this.onResetDepartment();
  //   },
  //   error: (err) => {
  //     alert('Error: ' + err.message);
  //   }
  // });
}

}
