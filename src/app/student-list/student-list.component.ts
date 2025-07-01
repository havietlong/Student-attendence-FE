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
  isExam!: boolean;
  scoreTypeId: string = '';
  role: string | null = null;
  date: string = '';
  sentAttendance: boolean = false;
  scoreTypes: { scoreTypeId: string; scoreTypeName: string }[] = [];
  selectedScoreTypeId: string = '';
  lecturer: any = null;
  classSession: any = null;

  constructor(
    private auth: AuthService,
    private http: HttpClient,
    private route: ActivatedRoute
  ) { }

  ngOnInit(): void {
    console.log('hello');

    if (typeof window !== 'undefined') {
      this.role = localStorage.getItem('role');
      console.log(this.role);
    }

    this.route.paramMap.subscribe(params => {
      this.courseClassId = params.get('courseClassId') || '';
      console.log(this.courseClassId);

      if (this.courseClassId) {
        // 🟢 When courseClassId is present in the route directly
        this.route.queryParams.subscribe(params => {
          this.date = params['date'];
          this.classSessionId = params['classSessionId'];
          this.isExam = params['isExam'] === 'true';
          this.scoreTypeId = params['scoreTypeId'];

          console.log('Course Class:', this.courseClassId);
          console.log('Session Date:', this.date);
          console.log('Class Session Id:', this.classSessionId);
          console.log('isExam:', this.isExam);
          console.log('scoreTypeId:', this.scoreTypeId);
          this.http.get<any>(`http://localhost:3000/class-session/${this.classSessionId}`).subscribe({
            next: (session) => {
              this.sentAttendance = session.sentAttendance;
              this.classSession = session;
              this.lecturer = session.lecturer;
              console.log('BITCH', this.lecturer);

            },
            error: (err) => console.error('Failed to fetch session:', err)
          });
          this.fetchScoreTypes();
          this.OnGotAllStudents();


        });
      } else {
        // 🔴 If courseClassId is not found in route, try to get it from query params as fallback
        this.route.queryParams.subscribe(params => {
          this.courseClassId = params['courseClassId'];
          this.date = params['date'];
          this.classSessionId = params['classSessionId'];
          this.isExam = params['isExam'] === 'true';
          this.scoreTypeId = params['scoreTypeId'];

          console.log('Course Class:', this.courseClassId);
          console.log('Session Date:', this.date);
          console.log('Class Session Id:', this.classSessionId);
          console.log('isExam:', this.isExam);
          console.log('scoreTypeId:', this.scoreTypeId);

          this.fetchScoreTypes();
          this.OnGotAllStudents();

          this.http.get<any>(`http://localhost:3000/class-session/${this.classSessionId}`).subscribe({
            next: (session) => {
              this.sentAttendance = session.sentAttendance;
              this.classSession = session;
              this.lecturer = this.classSession.courseClass.lecturer;
              console.log('BITCH', this.lecturer);
            },
            error: (err) => console.error('Failed to fetch session:', err)
          });
        });
      }
    });
  }


  fetchScoreTypes() {
    this.http.get<any[]>('http://localhost:3000/subject-score-config/' + this.courseClassId).subscribe({
      next: (configs: any[]) => {
        if (this.isExam) {
          // ✅ If it's an exam, only show the selected scoreTypeId
          this.scoreTypes = configs
            .filter(config => config.scoreType?.scoreTypeId === this.scoreTypeId)
            .map(config => ({
              scoreTypeId: config.scoreType.scoreTypeId,
              scoreTypeName: config.scoreType.scoreTypeName
            }));

          // Auto-select the exam score type
          if (this.scoreTypes.length > 0) {
            this.selectedScoreTypeId = this.scoreTypes[0].scoreTypeId;
          }
        } else {
          // ✅ If it's NOT an exam, exclude these types
          const excludedIds = ['CK', 'GK', 'CC', 'DA', 'TL'];

          this.scoreTypes = configs
            .filter(config => !excludedIds.includes(config.scoreType?.scoreTypeId))
            .map(config => ({
              scoreTypeId: config.scoreType.scoreTypeId,
              scoreTypeName: config.scoreType.scoreTypeName
            }));
        }

        console.log('✅ Available Score Types:', this.scoreTypes);
      },
      error: (err) => console.error('❌ Failed to fetch score types:', err)
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
          this.gradesMap[student.studentId] = ''; // default blank grade input
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
    if (view === 'grading') {
    this.checkAndLock();
  }
  }

  checkAndLock() {
  this.http.post(`http://localhost:3000/course-classes/${this.courseClassId}/check-completion`, {})
    .subscribe({
      next: (data: any) => {
        if (data.message !== '') {
          alert(data.message);
        }
      },
      error: (err) => {
        console.error('❌ Failed to check and lock course:', err);
      }
    });
}


  isTodaySession(): boolean {
    const today = new Date().toISOString().split('T')[0]; // 'YYYY-MM-DD'
    return this.date === today;
  }

  gradingScale: '10' | 'letter' = '10';
  gradesMap: { [studentId: string]: number | string } = {};
  letterGrades: string[] = ['A', 'B', 'C', 'D', 'F'];

  convertLetterToNumber(letter: string): number {
    switch (letter.toUpperCase()) {
      case 'A': return 9.0;
      case 'B': return 8.0;
      case 'C': return 7.0;
      case 'D': return 6.0;
      case 'F': return 5.0;
      default: return 0;
    }
  }
  lecturerId: string | null = null;
  submitGrades() {
    const now = new Date().toISOString();

    const lecturer = localStorage.getItem('lecturer');
    if (lecturer) {
      const parsedLecturer = JSON.parse(lecturer);
      this.lecturerId = parsedLecturer.lecturerId;
    }

    // Call validate API before submitting
    this.http.post(`http://localhost:3000/course-classes/${this.courseClassId}/validate-grade-input?gradeType=${this.selectedScoreTypeId}`, {})
      .subscribe({
        next: () => {
          // Only proceed if validation passes
          const scoreRecords = Object.entries(this.gradesMap).map(([studentId, rawGrade]) => {
            const score = Number(rawGrade);

            return {
              studentId,
              classCode: this.courseClassId,         // 👈 classCode in backend = courseClassId here
              scoreType: this.selectedScoreTypeId,   // 👈 from dropdown or set earlier
              score,
              entryDate: now,
              enteredBy: this.lecturerId
            };
          });

          this.http.post('http://localhost:3000/score-details/many', scoreRecords).subscribe({
            next: () => {
              alert('✅ Đã gửi điểm thành công!');
              this.http.post(`http://localhost:3000/course-classes/${this.courseClassId}/check-completion`, {})
                .subscribe({
                  next: (data: any) => {
                    if (data.message !== '') {
                      alert(data.message)
                    }
                  },
                  error: (err) => console.error('❌ Failed to check and lock course:', err)
                });
            },
            error: err => {
              console.error('❌ Lỗi khi gửi điểm:', err);
              alert('❌ Gửi điểm thất bại');
            }
          });
        },
        error: (err) => {
          console.error('❌ Grade input validation failed:', err);
          alert(err.error.message || '❌ Không thể nhập điểm. Vui lòng kiểm tra lại.');
        }
      });
  }





  classMarkedAsTaught: boolean = false;
  markClassAsTaught() {
    if (!this.classSessionId) {
      alert('Class session ID missing!');
      return;
    }

    this.http.patch(`http://localhost:3000/class-session/${this.classSessionId}`, {
      isTaught: true
    }).subscribe({
      next: () => {
        this.classMarkedAsTaught = true;
        alert('✅ Lớp học đã được đánh dấu là đã dạy!');
      },
      error: (err) => {
        console.error('❌ Lỗi khi cập nhật lớp học:', err);
        alert('❌ Không thể đánh dấu lớp học.');
      }
    });

    this.submitAttendance();
  }

  gradeType: string = ''; // e.g., 'quiz', 'final'


}

