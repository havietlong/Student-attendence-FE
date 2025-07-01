import { CommonModule, NgSwitch, NgSwitchCase } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SidebarComponent } from "../components/sidebar/sidebar.component";
import { CreateClassComponent } from "../components/create-class/create-class.component";
import { CreateDepartmentComponent } from "../components/create-department/create-department.component";
import { CreateMajorComponent } from "../components/create-major/create-major.component";
import { CreateSubjectComponent } from "../components/create-subject/create-subject.component";
import { RecordPreviewComponent } from "../record-preview/record-preview.component";
import { ManageTableComponent } from "../manage-table/manage-table.component";
import { DynamicTableFilterComponent } from "../dynamic-table-filter/dynamic-table-filter.component";


@Component({
  selector: 'app-manage-academic',
  standalone: true,
  imports: [FormsModule, NgSwitch, NgSwitchCase, SidebarComponent, CreateClassComponent, CreateDepartmentComponent, CreateMajorComponent, CreateSubjectComponent, CommonModule, ManageTableComponent, DynamicTableFilterComponent],
  templateUrl: './manage-academic.component.html',
  styleUrls: ['./manage-academic.component.css']
})
export class ManageAcademicComponent {
  selectedEntity = 'class';
  selectedTab = 'class';
  records: any[] = [];
  showModal = false;

  entityTabs = [
    { label: 'Class', value: 'class' },
    { label: 'Department', value: 'department' },
    { label: 'Major', value: 'major' },
    { label: 'Subject', value: 'subject' }
  ];

  columnConfigs: { [key: string]: string[] } = {

    departments: ['departmentName', 'headOfDepartment'], // Only show these for department
    class: ['classId', 'className', 'academicYear', 'homeroomTeacher', 'classSize'],
    majors: ['majorName'], // Example
    subject: ['subjectName', 'subjectCode'] // Example
  };

  availableCourses: any[] = []; // Full dataset
  // records: any[] = [];

  updateFilteredCourses(filteredData: any[]) {
    this.records = filteredData; // Update the table with the filtered result
  }

  filterConfig: { key: string, label: string }[] = [];


  generateFilterConfig(entity: string): { key: string, label: string }[] {
    const keys = this.columnConfigs[entity] || [];
    return keys.map(key => ({
      key: key,
      label: this.toLabel(key)
    }));
  }

  // Optional: Prettify the labels
  toLabel(key: string): string {
    return key
      .replace(/([A-Z])/g, ' $1')  // Add space before uppercase letters
      .replace(/^./, str => str.toUpperCase()); // Capitalize first letter
  }



  ngOnInit() {
    this.loadRecords();
  }

  selectEntity(entity: string) {
    this.selectedEntity = entity;
    this.filterConfig = this.generateFilterConfig(entity);
    this.loadRecords();
  }

  loadRecords() {
    // Replace this with your API call
    fetch(`http://localhost:3000/${this.selectedEntity}`)
      .then(res => res.json())
      .then(data => {
         this.availableCourses = data; // Keep original dataset
        this.records = data;        
        console.log(data);

      })
      .catch(err => console.error('Error loading records:', err));
  }

  openModal() {
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
  }

  onFieldFocused(fieldName: string) {
    console.log('Focused on field:', fieldName);
  }
}
