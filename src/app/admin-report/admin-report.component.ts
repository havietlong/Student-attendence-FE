import { HttpClient, HttpParams } from '@angular/common/http';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NgxChartsModule } from '@swimlane/ngx-charts';
import { SidebarComponent } from "../components/sidebar/sidebar.component";
import { timer } from 'rxjs';

@Component({
  selector: 'app-admin-report',
  standalone: true,
  imports: [FormsModule, NgxChartsModule, SidebarComponent],
  templateUrl: './admin-report.component.html',
  styleUrl: './admin-report.component.css'
})
export class AdminReportComponent {

  constructor(private http: HttpClient, private router: Router) { }
  chartData!: any[];

  attendanceData: any[] = [];

  semesters!: string[]; // You can fetch these from API later
  classes!: string[]; // You can fetch these from API later
  courseClasses: any[] = [];
  students: any[] = [];
  scoreChartOptions: any;
  selectedSemester: string = '';
  selectedClass: string = '';
  selectedStudent: string = '';
  studentReport: any;
  attendanceSeries: any[] = [];
  attendanceChartOptions: any;
  scoreSeries: any[] = [];
  chartInitialized: boolean = false;

  onFilterChange() {
    if (!this.selectedSemester || !this.selectedClass) return;

    const parts = this.selectedSemester.split(' ');
    const semester = parseInt(parts[3]); // This should still be correct

    if (isNaN(semester)) {
      console.error('Invalid semester format:', this.selectedSemester);
      return;
    }

    const params = new HttpParams()
      .set('semester', semester)
      .set('class', this.selectedClass);

    this.http.get<any[]>('http://localhost:3000/report/students', { params })
      .subscribe(data => {
        this.students = data;
        console.log(this.students);

      });
  }


  loadStudentReport() {
    const parts = this.selectedSemester.split(' ');
    const semester = parseInt(parts[3]); // This should still be correct

    const params = new HttpParams()
      .set('semester', semester)
      .set('class', this.selectedClass)
      .set('student', this.selectedStudent);

    this.http.get<any>('http://localhost:3000/report/student-report', { params })
      .subscribe(data => {
        this.studentReport = data;

        this.chartData = data.details.map((d: any, index: number) => ({
          name: `${d.subject} (${index + 1})`, // You can add index to differentiate duplicates
          value: d.score
        }));

        console.log(this.chartData);


        // Prepare Line Chart Data
        this.scoreSeries = [{
          name: 'Scores',
          data: data.details.map((d: any) => d.score)
        }];

        this.scoreChartOptions = {
          chart: { type: 'line' },
          xaxis: { categories: data.details.map((d: any) => d.subject) }
        };

        // Prepare Pie Chart Data
        this.attendanceSeries = [data.attended, data.absent];

        this.attendanceChartOptions = {
          chart: { type: 'pie' },
          labels: ['Present', 'Absent']
        };
      });
  }


  chartSeries = [
    {
      name: "Average Score",
      data: [7.5, 8.0, 6.9, 7.8] // Example data per semester
    }
  ];

  chartOptions = {
    chart: {
      type: "bar"
    },
    xaxis: {
      categories: ["Semester 1", "Semester 2", "Semester 3", "Semester 4"]
    }
  };

  loadClassPerformance(semester: string) {
    this.selectedSemester = semester;

    this.http.get<any[]>('http://localhost:3000/report/classes', { params: { semester } })
      .subscribe(data => {
        this.chartSeries = [
          { name: 'Average Score', data: data.map(c => c.averageScore) }
        ];
        this.chartOptions = {
          chart: { type: 'bar' },
          xaxis: { categories: data.map(c => c.classId) }
        };

        // Optional: update click handler to go to student level next
        this.chartLevel = 'class';
      });
  }



  updateChart(data: any[]) {
    timer(0).subscribe(() => {
      this.chartData = data;
      this.chartInitialized = true;
    });
  }


  ngOnInit() {
    this.fetchCourseClasses();
    this.fetchClassCohorts();
  }

  classCohorts: any[] = [];

  fetchClassCohorts() {
    this.http.get<any[]>('http://localhost:3000/class')
      .subscribe(data => {
        this.classCohorts = data;
        this.classes = data.map(c => c.classId);
        console.log('Loaded class cohorts:', this.classes);
      });
  }

  fetchCourseClasses() {
    this.http.get<any[]>('http://localhost:3000/course-classes')
      .subscribe(data => {
        this.courseClasses = data;

        // Extract unique semesters (format: "2025-2026 - Semester 1")
        this.semesters = [...new Set(data.map(c => `${c.academicYear} - Semester ${c.semester}`))];
        console.log(this.semesters);

        // if (this.semesters.length > 0) {
        //   this.selectedSemester = this.semesters[0];
        //   this.updateClasses();
        // }
      });
  }

  // updateClasses() {
  //   const parts = this.selectedSemester.split(' ');
  //   const year = parts[0];
  //   const semester = parseInt(parts[3]);
  //   console.log(semester);


  //   // Filter classes of selected semester
  //   const filteredClasses = this.courseClasses.filter(c => c.academicYear === year && c.semester === semester);
  //   console.log(filteredClasses);

  //   this.classes = filteredClasses.map(c => c.courseClassId);

  //   if (this.classes.length > 0) {
  //     this.selectedClass = this.classes[0];
  //     this.onFilterChange();
  //   }
  // }


  chartLevel = 'semester'; // Initial level

  onChartClick(event: any) {
    const clickedIndex = event.dataPointIndex;

    if (this.chartLevel === 'semester') {
      const clickedSemester = this.chartOptions.xaxis.categories[clickedIndex];
      console.log('Clicked Semester:', clickedSemester);
      this.loadClassPerformance(clickedSemester);

    } else if (this.chartLevel === 'class') {
      const clickedClass = this.chartOptions.xaxis.categories[clickedIndex];
      console.log('Clicked Class:', clickedClass);
      this.loadStudentList(this.selectedSemester, clickedClass);
    } else if (this.chartLevel === 'student') {
      const clickedStudent = this.chartOptions.xaxis.categories[clickedIndex];
      console.log('Clicked Student:', clickedStudent);
      this.navigateToStudentReport(this.selectedSemester, this.selectedClass, clickedStudent);
    }
  }

  loadStudentList(semester: string, classId: string) {
    this.selectedClass = classId;

    this.http.get<any[]>('http://localhost:3000/report/students', { params: { semester, class: classId } })
      .subscribe(data => {
        this.chartSeries = [
          { name: 'Students', data: data.map(s => s.averageScore) }
        ];
        this.chartOptions = {
          chart: { type: 'bar' },
          xaxis: { categories: data.map(s => s.studentId) }
        };

        this.chartLevel = 'student';
      });
  }

  navigateToStudentReport(semester: string, classId: string, studentId: string) {
    this.router.navigate(['/student-report'], { queryParams: { semester, className: classId, studentName: studentId } });
  }


}
