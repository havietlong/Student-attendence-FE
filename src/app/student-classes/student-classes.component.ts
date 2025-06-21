import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-student-classes',
  standalone:true,
  imports:[CommonModule],
  templateUrl: './student-classes.component.html',
  styleUrls: ['./student-classes.component.css']
})
export class StudentClassesComponent implements OnInit {
  registeredClasses: any[] = [];

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    const studentId = 'BKC15056';
    this.http.get<any[]>(`http://localhost:3000/course-classes/student/${studentId}`)
      .subscribe(data => this.registeredClasses = data);
  }

  dayToString(day: string): string {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[parseInt(day, 10)];
  }

  unregister(courseClassId: string) {
    if (confirm('Are you sure you want to unregister from this class?')) {
      // You must implement DELETE or POST API to handle unregister
      alert(`Unregistered from class ${courseClassId}`);
    }
  }
}
