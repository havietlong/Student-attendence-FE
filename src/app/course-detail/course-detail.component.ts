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

  subjectCode: string = '';
  filteredClasses: any[] = [];
  subjectName: string = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient
  ) { }

  goToClassPage(courseClassId: string) {
    this.router.navigate(['/calendar', courseClassId]);
  }

  goToGradeConfig(courseClassId: string) {
    this.router.navigate(['/grade-config',courseClassId]);
  }

  goToStudentListPage(courseClassId: string) {
    this.router.navigate(['/studentList', courseClassId]);
  }

  ngOnInit(): void {
    const subjectCode = this.route.snapshot.paramMap.get('subjectCode');
    console.log('Subject Code:', subjectCode);
    console.log(subjectCode);

    if (subjectCode) {
      this.loadSubjectDetail(subjectCode);
      this.subjectCode = subjectCode;
    }

    const lecturerId = this.route.snapshot.paramMap.get('lecturerId');
    console.log(lecturerId);

    if (lecturerId) {
      this.lecturerId = lecturerId;
      this.loadLecturerClasses(lecturerId);
    } else {
      console.warn('Missing lecturerId in URL');
    }
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

  lecturerId: string = '';
  lecturerName: string = '';
  classesTaught: any[] = [];

}
