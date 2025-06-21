import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { SidebarComponent } from "../../components/sidebar/sidebar.component";
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-student-dashboard',
  standalone: true,
  imports: [CommonModule, SidebarComponent, RouterLink],
  templateUrl: './student-dashboard.component.html',
  styleUrl: './student-dashboard.component.css'
})
export class StudentDashboardComponent {
  studentId!: string;
  constructor(private router: Router, private route: ActivatedRoute, private http: HttpClient,) { }


  student = {
    fullName: 'Nguyen Van A',
    avatarUrl: 'https://via.placeholder.com/100',
    class: 'CTK44',
    gpa: 3.56,
    totalCredits: 92
  };

  todayClasses: any[] = [];

  upcomingExams = [
    { date: '2025-06-20', subject: 'Giải tích', room: '201' },
    { date: '2025-06-22', subject: 'Lập trình Web', room: '403' }
  ];

  gpaTrend = [3.1, 3.4, 3.5, 3.56];

  attendanceRecords = [
    { subject: 'Lập trình Web', rate: 90 },
    { subject: 'Cơ sở dữ liệu', rate: 75 },
    { subject: 'Giải tích', rate: 60 }
  ];

  minimumCoursesRequired = 3;
  registeredCoursesCount = 0;
  showWarning = false;

  ngOnInit() {
    if (typeof window !== 'undefined') {
      const studentData = localStorage.getItem('student');
      if (studentData) {
        const student = JSON.parse(studentData);
        this.studentId = student.studentId;
        this.fetchRegisteredCourses();
      } else {
        console.warn('Student not found in localStorage');
      }
    }
  }


  navigateToStudentCalendat() {
    console.log('here');
    
    this.router.navigate(['calendar/student', this.studentId]);
  }

  fetchRegisteredCourses() {
    const url = `http://localhost:3000/course-classes/student/${this.studentId}`;

    this.http.get<any[]>(url).subscribe({
      next: (data) => {
        // this.registeredCourses = data;
        this.registeredCoursesCount = data.length;
        this.showWarning = this.registeredCoursesCount < this.minimumCoursesRequired;

        // 🧠 Transform data into todayClasses
        const today = new Date().getDay(); // 0 (Sun) to 6 (Sat)
        this.todayClasses = data
          .filter(cls => cls.dayOfWeek.includes(today.toString()))
          .map(cls => ({
            subject: cls.subject.subjectName,
            time: '07:00 - 08:30', // You can customize this logic later
            room: cls.classroom
          }));

        console.log('Today\'s Classes:', this.todayClasses);
      },
      error: (err) => {
        console.error('Failed to fetch courses:', err);
      }
    });
  }
}