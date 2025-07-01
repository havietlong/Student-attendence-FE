import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';
import { HttpClient, HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, HttpClientModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent implements OnInit {
  email: string = '';
  password: string = '';

  constructor(private auth: AuthService, private router: Router,private http: HttpClient) { }

  ngOnInit(): void { }

  OnUserLogin() {
    if (!this.email || !this.password) {
      alert('Please enter both email and password');
      return;
    }

    this.auth.login(this.email, this.password).subscribe({
      next: (res) => {
        alert('Login successful!');

        const role = res.user.role;
        const userID = res.user.userId;
        // Store token (optional but useful for authenticated routes)
        localStorage.setItem('access_token', res.access_token);
        localStorage.setItem('user', JSON.stringify(res.user));
        localStorage.setItem('role', role);
        // Step 1: Fetch student by userId
        if(role === 'student'){
        this.http.get<any>(`http://localhost:3000/students/user/${userID}`).subscribe({
          next: (res) => {
            const student = JSON.stringify(res);
              localStorage.setItem('student', student);
          },
          error: (err) => {
            console.error('Không thể tìm sinh viên từ userId:', err);
            alert('Không thể xác định sinh viên. Vui lòng thử lại.');
          }
        });
        }else if(role === 'lecturer'){
          this.http.get<any>(`http://localhost:3000/lecturers/${userID}`).subscribe({
          next: (res) => {
            const lecturer = JSON.stringify(res);
              localStorage.setItem('lecturer', lecturer);
          },
          error: (err) => {
            console.error('Không thể tìm sinh viên từ userId:', err);
            alert('Không thể xác định sinh viên. Vui lòng thử lại.');
          }
        }); 
        }

        // Redirect based on role
        switch (role) {
          case 'student':
            this.router.navigate(['/student-dashboard']);
            break;
          case 'lecturer':
            this.router.navigate(['/lecturer-dashboard']);
            break;
          case 'admin':
            this.router.navigate(['/admin-dashboard']);
            break;
          default:
            alert('Unknown role');
            break;
        }
      },
      error: (err) => {
        alert('Login failed. Check your credentials.');
        console.error(err);
      }
    });
  }


  // OnSignInWithGoogle() {
  //   // To be implemented with OAuth logic
  // }
}
