import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SidebarComponent } from "../components/sidebar/sidebar.component";
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';

export interface CourseClass {
  courseClassId: string;
  subjectCode: string;
  lecturerId: string;
  semester: number;
  academicYear: string;
  classroom: string;
  dayOfWeek: number[];
  startDate: string;
  endDate: string;
  maxCapacity: number;
  subject: {
    subjectCode: string;
    subjectName: string;
    credit: number;
    lectureHours: number;
    practiceHours: number;
    majorCode: string;
    prerequisiteSubjectCode: string | null;
    minCreditRequired: number;
  };
  lecturer: {
    lecturerId: string;
    fullName: string;
    dateOfBirth: string;
    gender: string;
    address: string;
    email: string;
    phoneNumber: string;
    degree: string;
    specialization: string;
    departmentCode: string;
    userId: string;
  };
  sessions: {
    id: number;
    courseClassId: string;
    sessionDate: string;
    classroom: string;
    startPeriod: number;
    periodCount: number;
  }[];
}



@Component({
  selector: 'app-course-registratoin',
  standalone: true,
  imports: [CommonModule, FormsModule, SidebarComponent],
  templateUrl: './course-registratoin.component.html',
  styleUrl: './course-registratoin.component.css'
})
export class CourseRegistratoinComponent {
  searchTerm = '';
  creditFilter: string = '';
  lecturerFilter: string = '';
  selectedCourses: CourseClass[] = [];
  student = {
    totalCredits: 92
  };
  studentId: boolean = false; // Default to true


  minimumCredits = 12;

  get selectedCredits(): number {
    return this.selectedCourses.reduce((sum, c) => sum + (c.subject?.credit ?? 0), 0);

  }

  constructor(private http: HttpClient, private route: ActivatedRoute, private router:Router) { }


  availableCourses: CourseClass[] = [
    // {
    //   ma_lop_hoc_phan: 'LHP101',
    //   ten_hoc_phan: 'Lập trình Web',
    //   giang_vien: 'Nguyễn Văn A',
    //   so_tin_chi: 3,
    //   thoi_gian: 'Thứ 2, 7:00 - 8:30',
    //   nam_hoc: 1,
    //   minCreditRequired: 0
    // },
    // {
    //   ma_lop_hoc_phan: 'LHP102',
    //   ten_hoc_phan: 'Cơ sở dữ liệu',
    //   giang_vien: 'Trần Thị B',
    //   so_tin_chi: 3,
    //   thoi_gian: 'Thứ 3, 10:00 - 11:30',
    //   nam_hoc: 2,
    //   minCreditRequired: 60
    // },
    // {
    //   ma_lop_hoc_phan: 'LHP103',
    //   ten_hoc_phan: 'Machine Learning',
    //   giang_vien: 'Lê Văn C',
    //   so_tin_chi: 4,
    //   thoi_gian: 'Thứ 4, 13:00 - 15:00',
    //   nam_hoc: 3,
    //   minCreditRequired: 100
    // }
  ];

   goToClassPage(courseClassId: string) {
    this.router.navigate(['/calendar', courseClassId]);
  }

   goToCalendarPage(courseClassId: string) {
    this.router.navigate(['/studentList', courseClassId]);
  }

  isEligible(course: CourseClass): boolean {
    return this.student.totalCredits >= (course.subject?.minCreditRequired || 0);
  }

  ngOnInit() {
  const studentId = this.route.snapshot.paramMap.get('studentId');
  const user = localStorage.getItem('user');
  if (!user) return;

  const parsedUser = JSON.parse(user);
   // Set based on your role logic

  if (studentId) {
    this.studentId = true;
    this.http.get<CourseClass[]>(`http://localhost:3000/course-classes/student/` + studentId)
      .subscribe({
        next: (courses) => this.availableCourses = courses,
        error: (err) => console.error('Failed to load course classes', err)
      });
  } else {
    const userId = parsedUser.userId;
    this.http.get<any>(`http://localhost:3000/students/${userId}`).subscribe({
      next: (student) => {
        this.student.totalCredits = 999999;
        const majorId = student.class.majorId;

        this.http.get<CourseClass[]>(`http://localhost:3000/course-classes/filter?majorId=${majorId}`)
          .subscribe({
            next: (courses) => this.availableCourses = courses,
            error: (err) => console.error('Failed to load course classes', err)
          });
      },
      error: (err) => {
        console.error('Failed to fetch student info', err);
      }
    });
  }
}




  // Update yearFilter type to match academicYear being a string (e.g., '2024-2025')
  yearFilter: string = '';

  // Get distinct credit values from subject.credit
  get creditOptions(): number[] {
    return [...new Set(this.availableCourses.map(c => c.subject?.credit).filter(c => c !== undefined))];
  }

  // Get distinct lecturer IDs
  get lecturerOptions(): string[] {
    return [...new Set(this.availableCourses.map(c => c.lecturer?.lecturerId).filter(l => l !== undefined))];
  }

  // Get distinct academic years
  get yearOptions(): string[] {
    return [...new Set(this.availableCourses.map(c => c.academicYear))];
  }

  getDayOfWeekNames(days: number[] = []): string[] {
    const map: Record<number, string> = {
      1: 'Thứ 2',
      2: 'Thứ 3',
      3: 'Thứ 4',
      4: 'Thứ 5',
      5: 'Thứ 6',
      6: 'Thứ 7',
      0: 'Chủ nhật', // Use 0 if Sunday is possible
    };

    return days.map(day => map[day] ?? `Thứ ?`);
  }


  yearLabel(year: string): string {
    switch (year) {
      case '1': return 'Năm nhất';
      case '2': return 'Năm hai';
      case '3': return 'Năm ba';
      case '4': return 'Năm tư';
      default: return 'Khác';
    }
  }


  filteredCourses(): CourseClass[] {
    return this.availableCourses.filter(course => {
      const courseName = course.subject?.subjectName || '';
      const lecturerName = course.lecturer?.fullName || '';

      const matchSearch =
        courseName.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        lecturerName.toLowerCase().includes(this.searchTerm.toLowerCase());

      const matchCredit =
        this.creditFilter === '' || course.subject?.credit === +this.creditFilter;

      const matchLecturer =
        this.lecturerFilter === '' || course.lecturer?.lecturerId === this.lecturerFilter;

      const matchYear =
        this.yearFilter === '' || course.academicYear === this.yearFilter;

      return matchSearch && matchCredit && matchLecturer && matchYear;
    });
  }





  toggleSelection(course: CourseClass): void {
    const index = this.selectedCourses.findIndex(c => c.courseClassId === course.courseClassId);

    if (index === -1) {
      this.selectedCourses.push(course);
    } else {
      this.selectedCourses.splice(index, 1);
    }
  }



  isSelected(course: CourseClass): boolean {
    return this.selectedCourses.some(c => c.courseClassId === course.courseClassId);
  }

  submitRegistration() {
    const user = localStorage.getItem('user');
    if (!user) {
      alert('Không tìm thấy người dùng. Vui lòng đăng nhập lại.');
      return;
    }

    const userId = JSON.parse(user).userId;

    // Step 1: Fetch student by userId
    this.http.get<any>(`http://localhost:3000/students/${userId}`).subscribe({
      next: (student) => {
        const studentId = student.studentId;

        // Step 2: Prepare registration payloads
        const payloads = this.selectedCourses.map(course => ({
          studentId: studentId,
          classId: course.courseClassId,
          registrationDate: new Date().toISOString(),
          status: 'Pending' // Or 'Approved' based on your logic
        }));

        let completed = 0;

        // Step 3: Send each registration
        payloads.forEach(payload => {
          this.http.post('http://localhost:3000/course-registrations', payload).subscribe({
            next: () => {
              completed++;
              if (completed === payloads.length) {
                alert(`Bạn đã đăng ký thành công ${payloads.length} học phần!`);
                this.selectedCourses = [];
              }
            },
            error: (err) => {
              console.error('Đăng ký thất bại:', err);
              alert('Có lỗi xảy ra khi đăng ký. Vui lòng thử lại.');
            }
          });
        });
      },
      error: (err) => {
        console.error('Không thể tìm sinh viên từ userId:', err);
        alert('Không thể xác định sinh viên. Vui lòng thử lại.');
      }
    });
  }


}
