import { Component, OnInit } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { SidebarComponent } from '../components/sidebar/sidebar.component';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpParams } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { NgxChartsModule } from '@swimlane/ngx-charts';

@Component({
  imports: [SidebarComponent, NgxChartsModule, FormsModule, CommonModule],
  standalone: true,
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {


 




  constructor(private auth: AuthService, private http: HttpClient, private router: Router) { }

  // Add these to your DashboardComponent
  isBrowser: boolean = false;



  

 

  


  getStudents(semester: string, className: string) {
    return this.http.get<string[]>(`/api/students?semester=${semester}&class=${className}`);
  }

  getStudentReport(semester: string, className: string, studentName: string) {
    return this.http.get<any>(`/api/student-report?semester=${semester}&class=${className}&student=${studentName}`);
  }

  


  ngOnInit(): void {
    if (typeof window !== 'undefined') {
      this.isBrowser = true;
    }
  }
  OnUserLogout() {
    this.auth.logout();
  }
}
