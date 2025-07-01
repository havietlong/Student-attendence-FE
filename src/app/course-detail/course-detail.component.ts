import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { SidebarComponent } from "../components/sidebar/sidebar.component";

@Component({
  selector: 'app-course-detail',
  standalone: true,
  imports: [CommonModule, SidebarComponent],
  templateUrl: './course-detail.component.html',
  styleUrl: './course-detail.component.css'
})
export class CourseDetailComponent {

  role: string = '';
  student: any = null;
  lecturerId: string = '';
  lecturerName: string = '';
  studentName: string = '';
  studentId: string = '';
  subjectCode: string = '';
  subjectName: string = '';
  filteredClasses: any[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient
  ) { }

  goToClassPage(courseClassId: string) {
    this.router.navigate(['/calendar', courseClassId]);
  }

  goToGradeConfig(courseClassId: string) {
    this.router.navigate(['/grade-config', courseClassId]);
  }

  goToStudentListPage(courseClassId: string) {
    this.router.navigate(['/studentList', courseClassId]);
  }

  ngOnInit(): void {
    // Get role from localStorage
    if (typeof window !== 'undefined') {
      this.role = localStorage.getItem('role') || '';
    }

    // Load based on role
    if (this.role === 'student') {
      const studentData = localStorage.getItem('student');
      if (studentData) {
        
        
        this.student = JSON.parse(studentData);
        this.studentId = this.student.studentId;
        this.studentName = this.student.fullName;        
        this.loadStudentCourses(this.studentId);
      }
    } else if (this.role === 'lecturer') {
      const lecturerId = this.route.snapshot.paramMap.get('lecturerId');
      if (lecturerId) {
        this.lecturerId = lecturerId;
        this.loadLecturerClasses(this.lecturerId);
      }
    } else {
      // Guest or admin viewing subject detail
      const subjectCode = this.route.snapshot.paramMap.get('subjectCode');
      if (subjectCode) {
        this.subjectCode = subjectCode;
        this.loadSubjectDetail(subjectCode);
      }
    }
  }

  loadStudentCourses(studentId: string) {
    const url = `http://localhost:3000/course-classes/student/${studentId}`;
    this.http.get<any[]>(url).subscribe({
      next: (data) => {
        this.filteredClasses = data.map(cls => ({
          ...cls,
          subjectName: cls.subject?.subjectName ?? '---',
          lecturerName: cls.lecturer?.fullName ?? '---',
        }));

        this.studentName = data[0]?.student?.fullName ?? '---';
      },
      error: (err) => console.error('❌ Failed to load student courses:', err)
    });
  }

  loadLecturerClasses(lecturerId: string) {
    const url = `http://localhost:3000/course-classes/lecturer/${lecturerId}`;

    this.http.get<any[]>(url).subscribe({
      next: (data) => {
        this.filteredClasses = data.map(cls => ({
          ...cls,
          subjectName: cls.subject?.subjectName ?? '---',
          lecturerName: cls.lecturer?.fullName ?? '---',
        }));

        this.lecturerName = data[0]?.lecturer?.fullName ?? '---';
      },
      error: (err) => console.error('❌ Failed to load lecturer classes:', err)
    });
  }


  loadSubjectDetail(subjectCode: string) {
    this.http.get<any[]>('http://localhost:3000/course-classes/subject/' + subjectCode)
      .subscribe({
        next: (data: any) => {
          // Only keep classes that match the subjectCode
          this.filteredClasses = data.filter(
            (courseClass: any) => courseClass.subject.subjectCode === subjectCode
          );

          this.subjectName = this.filteredClasses[0].subject.subjectName;

        },
        error: (err) => console.error('Failed to load class list:', err)
      });
  }

  dayName(day: number): string {
    const days = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
    return days[day % 7];
  }

  goBack() {
    this.router.navigate(['/manage-courses']);
  }

  classesTaught: any[] = [];

  withdrawCourse(courseClassId: string) {
    if (confirm('Bạn có chắc muốn hủy đăng ký lớp này?')) {
        this.http.delete(`http://localhost:3000/course-classes/withdraw/${courseClassId}/${this.studentId}`)
            .subscribe({
                next: () => {
                    alert('Hủy đăng ký thành công!');
                    this.filteredClasses = this.filteredClasses.filter(cls => cls.courseClassId !== courseClassId);
                },
                error: (err) => {
                    console.error('❌ Hủy đăng ký thất bại:', err);
                    alert('Hủy đăng ký thất bại!');
                }
            });
    }
}

}
