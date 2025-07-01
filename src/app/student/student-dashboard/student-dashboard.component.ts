import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { SidebarComponent } from "../../components/sidebar/sidebar.component";
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AttendanceVisualizationComponent } from "../../attendance-visualization/attendance-visualization.component";

@Component({
  selector: 'app-student-dashboard',
  standalone: true,
  imports: [CommonModule, SidebarComponent, RouterLink, AttendanceVisualizationComponent],
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

  upcomingExams: {
    date: string;
    subject: string;
    room: string;
    scoreType: string;
    time: string;
  }[] = [];


  gpaTrend = [3.1, 3.4, 3.5, 3.56];

  attendanceRecords: any[] = [
  ];

  minimumCoursesRequired = 3;
  registeredCoursesCount = 0;
  showWarning = false;
  userImageLink!: string;

  ngOnInit() {
    if (typeof window !== 'undefined') {
      const studentData = localStorage.getItem('student');
      const userData = localStorage.getItem('user');
      if (userData) {
        const user = JSON.parse(userData);
        this.userImageLink = 'http://localhost:3000' + user.image;
        this.student.fullName = user.fullName;

        this.student.gpa = user.gpa;
        this.student.totalCredits = user.totalCredits;
      } else {
        console.warn('Student not found in localStorage');
      }
      if (studentData) {
        const student = JSON.parse(studentData);
        this.student.class = student.class.classId;
        this.studentId = student.studentId;
        this.fetchRegisteredCourses();

        this.fetchRegisteredCourses();
        this.fetchUpcomingExams();
        this.fetchAttendanceSummary();
      } else {
        console.warn('Student not found in localStorage');
      }
    }
  }



  fetchUpcomingExams() {
    const url = `http://localhost:3000/course-classes/student/${this.studentId}`;
    const periodTimes: { [key: number]: { start: string; end: string } } = {
      1: { start: '07:00', end: '07:45' },
      2: { start: '07:50', end: '08:35' },
      3: { start: '08:40', end: '09:25' },
      4: { start: '09:35', end: '10:20' },
      5: { start: '10:25', end: '11:10' },
      6: { start: '11:15', end: '12:00' },
      7: { start: '12:45', end: '13:30' },
      8: { start: '13:35', end: '14:20' },
      9: { start: '14:25', end: '15:10' },
      10: { start: '15:20', end: '16:05' },
      11: { start: '16:10', end: '16:55' },
      12: { start: '17:00', end: '17:45' },
    };

    this.http.get<any[]>(url).subscribe({
      next: (courseClasses) => {
        const allExams: any[] = [];
        const today = new Date();
        let loaded = 0;

        courseClasses.forEach(course => {
          const classId = course.courseClassId;

          this.http.get<any[]>(`http://localhost:3000/class-session/by-course-class/${classId}`).subscribe({
            next: (sessions) => {
              const examSessions = sessions.filter(
                s => s.isExamDay && new Date(s.sessionDate) >= today && !s.isTaught // 🔧 Exclude already taught sessions
              );

              const exams = examSessions.map(s => {
                const sessionDate = new Date(s.sessionDate);
                const dateStr = sessionDate.toISOString().split('T')[0];

                const start = periodTimes[s.startPeriod]?.start ?? '??:??';
                const endPeriod = s.startPeriod + s.periodCount - 1;
                const end = periodTimes[endPeriod]?.end ?? '??:??';

                return {
                  date: dateStr,
                  subject: course.subject?.subjectName ?? 'Unknown',
                  room: s.classroom,
                  scoreType: s.scoreTypeId ?? 'Unknown',
                  time: `${start} - ${end}`
                };
              });

              allExams.push(...exams);
              loaded++;

              if (loaded === courseClasses.length) {
                this.upcomingExams = allExams.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
              }
            },
            error: (err) => {
              console.error(`❌ Failed to load sessions for class ${classId}`, err);
              loaded++;
            }
          });
        });
      },
      error: (err) => console.error('❌ Failed to fetch course classes:', err)
    });
  }




  fetchAttendanceSummary() {
    const url = `http://localhost:3000/course-classes/student/${this.studentId}`;

    this.http.get<any[]>(url).subscribe({
      next: (courseClasses) => {
        const attendanceRequests: Promise<any[]>[] = [];

        courseClasses.forEach(course => {
          const attendanceUrl = `http://localhost:3000/attendance/student/${this.studentId}/class/${course.courseClassId}`;
          // Always return an array even if the request fails
          const attendanceRequest = this.http.get<any[]>(attendanceUrl)
            .toPromise()
            .then(data => data || []); // 🔧 Safe default

          attendanceRequests.push(attendanceRequest);
        });

        Promise.all(attendanceRequests).then(attendanceResults => {
          // Flatten all attendance records from all classes
          const allAttendance = attendanceResults.flat();

          const transformed = this.transformAttendanceData(allAttendance);
          this.attendanceRecords = transformed;

          console.log('Detailed Attendance:', this.attendanceRecords);
        }).catch(err => {
          console.error('❌ Failed to fetch attendance details:', err);
        });
      },
      error: (err) => {
        console.error('❌ Failed to fetch registered courses:', err);
      }
    });
  }



  transformAttendanceData(rawData: any[]): any[] {
    if (rawData.length === 0) return [];

    const groupedBySubject: { [subjectName: string]: any[] } = {};

    rawData.forEach((record) => {
      const subjectName = record.courseClass.subject.subjectName;
      if (!groupedBySubject[subjectName]) {
        groupedBySubject[subjectName] = [];
      }
      groupedBySubject[subjectName].push({
        sessionDate: record.date,
        status: record.status
      });
    });

    const result = Object.entries(groupedBySubject).map(([subjectName, sessions]: any, index) => ({
      subjectName,
      sessions: sessions.map((session: any, idx: number) => ({
        sessionNumber: idx + 1,
        sessionDate: session.sessionDate,
        status: session.status
      }))
    }));

    return result;
  }




  navigateToStudentCalendat() {
    console.log('here');

    this.router.navigate(['calendar/student', this.studentId]);
  }

  fetchRegisteredCourses() {
    const url = `http://localhost:3000/course-classes/student/${this.studentId}`;
    const today = new Date();
    const todayStr = today.getFullYear() + '-' +
      String(today.getMonth() + 1).padStart(2, '0') + '-' +
      String(today.getDate()).padStart(2, '0');

    this.http.get<any[]>(url).subscribe({
      next: (courseClasses) => {
        this.registeredCoursesCount = courseClasses.length;
        this.showWarning = this.registeredCoursesCount < this.minimumCoursesRequired;

        const periods: { [key: number]: { start: string; end: string } } = {
          1: { start: '07:00', end: '07:45' },
          2: { start: '07:50', end: '08:35' },
          3: { start: '08:40', end: '09:25' },
          4: { start: '09:35', end: '10:20' },
          5: { start: '10:25', end: '11:10' },
          6: { start: '11:15', end: '12:00' },
          7: { start: '12:45', end: '13:30' },
          8: { start: '13:35', end: '14:20' },
          9: { start: '14:25', end: '15:10' },
          10: { start: '15:20', end: '16:05' },
          11: { start: '16:10', end: '16:55' },
          12: { start: '17:00', end: '17:45' },
        };

        const todayClasses: any[] = [];

        // 🌀 Parallel requests for each course class
        courseClasses.forEach(cls => {
          const courseClassId = cls.courseClassId;

          this.http.get<any[]>(`http://localhost:3000/class-session/by-course-class/${courseClassId}`)
            .subscribe(sessions => {


              sessions.forEach(session => {
                const sessionDate = session.sessionDate.split('T')[0]; // Format to 'YYYY-MM-DD'



                if (sessionDate === todayStr) {

                  const startP = session.startPeriod;
                  const endP = startP + session.periodCount - 1;

                  const startTime = periods[startP]?.start ?? '??:??';
                  const endTime = periods[endP]?.end ?? '??:??';

                  todayClasses.push({
                    subject: cls.subject.subjectName,
                    time: `${startTime} - ${endTime}`,
                    room: session.classroom
                  });
                }
              });

              // ✅ Once all classes processed, assign
              this.todayClasses = todayClasses;
            });
        });
      },
      error: (err) => {
        console.error('Failed to fetch registered courses:', err);
      }
    });
  }

}