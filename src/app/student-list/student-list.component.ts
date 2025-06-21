import { Component } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { SidebarComponent } from "../components/sidebar/sidebar.component";
import { FormsModule } from '@angular/forms';
import { switchMap } from 'rxjs';

@Component({
  selector: 'app-student-list',
  standalone: true,
  imports: [RouterLink, CommonModule, FormsModule, SidebarComponent],
  templateUrl: './student-list.component.html',
  styleUrl: './student-list.component.css'
})
export class StudentListComponent {
  fixAttendance() {
    this.sentAttendance = false;
  }
  studentsList: any[] = [];
  attendanceMap: { [studentId: string]: 'present' | 'absent' } = {};
  courseClassId: string = '';
  classSessionId: string = '';
  role: string | null = null;
  date: string = '';
  sentAttendance: boolean = false;

  constructor(
    private auth: AuthService,
    private http: HttpClient,
    private route: ActivatedRoute
  ) { }

  ngOnInit(): void {
    if (typeof window !== 'undefined') {
      this.role = localStorage.getItem('role');
    }

    this.route.paramMap.subscribe(params => {
      this.courseClassId = params.get('courseClassId') || '';

      if (!this.courseClassId) {
        this.route.queryParams.subscribe(params => {
          this.courseClassId = params['courseClassId'];
          this.date = params['date'];
          this.classSessionId = params['classSessionId'];
          // Now you can load attendance or student list data based on these
          console.log('Course Class:', this.courseClassId);
          console.log('Session Date:', this.date);
          console.log('Class Session Id:', this.classSessionId);
        });
      }

      this.OnGotAllStudents();
    });

    this.http.get<any>(`http://localhost:3000/class-session/${this.classSessionId}`).subscribe({
      next: (session) => {
        this.sentAttendance = session.sentAttendance;
      },
      error: (err) => console.error('Failed to fetch session:', err)
    });

  }

  OnGotAllStudents() {
    if (!this.courseClassId) {
      console.warn('No courseClassId found in route!');
      return;
    }

    this.http.get<any>(`http://localhost:3000/course-registrations/${this.courseClassId}`).subscribe({
      next: (res) => {
        if (Array.isArray(res.students)) {
          this.studentsList = res.students;
        } else if (Array.isArray(res)) {
          this.studentsList = res.map((r: any) => r.student);
        } else if (res.student) {
          this.studentsList = [res.student];
        } else {
          console.error('Unexpected response structure:', res);
        }

        // Initialize attendance defaults
        this.studentsList.forEach(student => {
          this.attendanceMap[student.studentId] = 'present';
        });

        console.log(this.studentsList);

      },
      error: (err) => console.error('Failed to fetch students:', err)
    });
  }

  submitAttendance() {
    console.log('Attendance Map:', this.attendanceMap);

    const attendanceRecords = Object.entries(this.attendanceMap).map(([studentId, status]) => ({
      studentId,
      courseClassId: this.courseClassId,
      date: this.date,
      status,
      classSessionId: this.classSessionId
    }));

    console.log('Records to submit:', attendanceRecords);

    const request$ = this.sentAttendance
      ? this.http.patch('http://localhost:3000/attendance/many', attendanceRecords) // Update existing records
      : this.http.post('http://localhost:3000/attendance/many', attendanceRecords); // First submission

    request$.pipe(
      switchMap(() => {
        // Always mark sentAttendance = true on class session
        return this.http.patch(`http://localhost:3000/class-session/${this.classSessionId}`, {
          sentAttendance: true
        });
      })
    ).subscribe({
      next: () => {
        this.sentAttendance = true;
        alert(this.sentAttendance
          ? 'Điểm danh đã được cập nhật thành công!'
          : 'Điểm danh đã được gửi thành công và phiên lớp học đã được cập nhật!');
      },
      error: (err) => {
        console.error('Lỗi khi gửi hoặc cập nhật điểm danh:', err);
        alert('Có lỗi xảy ra khi gửi hoặc cập nhật điểm danh.');
      }
    });
  }


  OnUserLogout() {
    this.auth.logout();
  }

  OnDeletedStudent(student: any) {
    alert(`Bạn muốn xoá sinh viên: ${student.firstName} ${student.lastName}`);
  }

  currentView: 'studentlist' | 'attendance' | 'grading' = 'attendance';

  switchView(view: 'studentlist' | 'attendance' | 'grading') {
    this.currentView = view;
  }

  isTodaySession(): boolean {
    const today = new Date().toISOString().split('T')[0]; // 'YYYY-MM-DD'
    return this.date === today;
  }


}

