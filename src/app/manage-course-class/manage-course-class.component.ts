import { Component, OnInit } from '@angular/core';
import { SidebarComponent } from "../components/sidebar/sidebar.component";
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs';
import { RouterLink } from '@angular/router';

interface AdminCourseView {
  subjectCode: string;
  subjectName: string;
  totalClasses: number;
  lecturerNames: string[];
}

@Component({
  selector: 'app-manage-course-class',
  standalone: true,
  imports: [SidebarComponent, CommonModule,RouterLink],
  templateUrl: './manage-course-class.component.html',
  styleUrl: './manage-course-class.component.css'
})
export class ManageCourseClassComponent implements OnInit {
  viewMode: 'table' | 'card' = 'table';
  courses: AdminCourseView[] = [];

  constructor(private http: HttpClient) { }

  ngOnInit(): void {
    this.http.get<any[]>('http://localhost:3000/course-classes')
      .pipe(
        map((data) => {
          const grouped: { [subjectCode: string]: AdminCourseView } = {};

          for (const courseClass of data) {
            const code = courseClass.subject.subjectCode;
            const name = courseClass.subject.subjectName;
            const lecturerName = courseClass.lecturer?.fullName || 'Chưa phân công';


            if (!grouped[code]) {
              grouped[code] = {
                subjectCode: code,
                subjectName: name,
                totalClasses: 1, // start counting the first class
                lecturerNames: [lecturerName]
              };
            } else {
              grouped[code].totalClasses += 1;

              // Avoid duplicates
              if (!grouped[code].lecturerNames.includes(lecturerName)) {
                grouped[code].lecturerNames.push(lecturerName);
              }
            }
          }

          return Object.values(grouped);
        })
      )
      .subscribe({
        next: (result) => this.courses = result,
        error: (err) => console.error('Failed to load course classes:', err)
      });
  }

  viewDetails(course: AdminCourseView) {
    console.log('View detail for:', course);
    // You can use Router to navigate if needed
  }
}
