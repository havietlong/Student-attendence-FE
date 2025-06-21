import { Component, OnInit } from '@angular/core';
import { SidebarComponent } from "../components/sidebar/sidebar.component";
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-lecturer-dashboard',
  standalone: true,
  imports: [SidebarComponent, CommonModule, RouterLink],
  templateUrl: './lecturer-dashboard.component.html',
  styleUrl: './lecturer-dashboard.component.css'
})
export class LecturerDashboardComponent implements OnInit {


  lecturerId!: string;

  lecturer = {
    avatarUrl: 'assets/lecturer.png',
    fullName: '',
    department: ''
  };

  totalClasses = 0;
  todayClasses: any[] = [];
  pendingGrades: any[] = [];
  attendanceSummary: any[] = [];
  recentDocs: any[] = [];

  constructor(private http: HttpClient, private router:Router) { }

  navigateToLecturerCalendat() {
 console.log('here');
    
    this.router.navigate(['calendar/lecturer', this.lecturerId ]);
}

  ngOnInit() {
    if (typeof window !== 'undefined') {
      setTimeout(() => {
        const lecturerData = localStorage.getItem('lecturer');
        if (lecturerData) {
          const lecturer = JSON.parse(lecturerData);
          this.lecturerId = lecturer.lecturerId;
          this.lecturer.fullName = lecturer.fullName;
          this.lecturer.department = lecturer.department?.departmentName ?? '---';
          this.fetchCourseClasses();
        } else {
          console.warn('Lecturer not found in localStorage');
        }
      }, 50); // Wait 50ms
    }
  }

  fetchCourseClasses() {
    const url = `http://localhost:3000/course-classes/lecturer/${this.lecturerId}`;
    this.http.get<any[]>(url).subscribe({
      next: (data) => {
        this.totalClasses = data.length;

        const today = new Date().getDay();
        this.todayClasses = data
          .filter(cls => cls.dayOfWeek.includes(today))
          .map(cls => ({
            subject: cls.subject.subjectName,
            time: '07:00 - 08:30',
            room: cls.classroom
          }));

        this.pendingGrades = data.slice(0, 2).map(cls => ({
          subject: cls.subject.subjectName,
          classId: cls.courseClassId,
          component: 'Giữa kỳ'
        }));

        this.attendanceSummary = data.map(cls => ({
          className: `${cls.courseClassId} - ${cls.subject.subjectName}`,
          rate: Math.floor(Math.random() * 40) + 60
        }));

        this.recentDocs = [
          { title: 'Đề kiểm tra giữa kỳ - ' + data[0]?.courseClassId, type: 'Đề thi', status: 'incomplete', updatedAt: new Date() },
          { title: 'Tài liệu học tập - ' + data[1]?.courseClassId, type: 'Tài liệu', status: 'complete', updatedAt: new Date('2024-06-10') }
        ];
      },
      error: (err) => {
        console.error('Failed to fetch lecturer course classes:', err);
      }
    });
  }
}

