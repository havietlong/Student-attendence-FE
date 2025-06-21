import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-sidebar',
  imports: [CommonModule, RouterLink],
  standalone: true,
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent {
  isExpanded = false;
  activeSubMenu: string | null = null;
  role: string | null = null;
  lecturerId: string | null = null;
  studentId: string | null = null;
  constructor(private router: Router) { }

  ngOnInit() {
    if (typeof window !== 'undefined') {
      this.role = localStorage.getItem('role'); // Safe to use here
      if (this.role === 'lecturer') {
        const lecturer = localStorage.getItem('lecturer');
        if (lecturer) {
          const parsedLecturer = JSON.parse(lecturer);
          this.lecturerId = parsedLecturer.lecturerId;
        }
      } else if (this.role === 'student') {
        const student = localStorage.getItem('student');
        if (student) {
          const parsedLecturer = JSON.parse(student);
          this.studentId = parsedLecturer.studentId;
        }
      }
    }
  }
  expandSidebar() {
    this.isExpanded = true;
  }

  collapseSidebar() {
    this.isExpanded = false;
    this.activeSubMenu = null;
  }

  toggleSubMenu(menu: string) {
    this.activeSubMenu = this.activeSubMenu === menu ? null : menu;
  }

  onUserLogout() {
    localStorage.clear();
    this.router.navigate(['/login']);
  }
}
