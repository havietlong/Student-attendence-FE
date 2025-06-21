import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { SidebarComponent } from "../components/sidebar/sidebar.component";

@Component({
  selector: 'app-user-detail',
  standalone: true,
  imports: [FormsModule, CommonModule, SidebarComponent],
  templateUrl: './user-detail.component.html',
  styleUrls: ['./user-detail.component.css']
})
export class UserDetailComponent implements OnInit {
  user: any = {};
  student: any = null;
  lecturer: any = null;
  userId!: string;
  imageFile: File | null = null;

  constructor(private http: HttpClient, private route: ActivatedRoute) { }

  ngOnInit(): void {
    if (typeof window !== 'undefined') {
      // this.userId = this.route.snapshot.paramMap.get('studentId')!;
      const user = localStorage.getItem('user');
      if (!user) return;

      const parsedUser = JSON.parse(user);
      this.userId = parsedUser.userId;
      this.loadUser();
    }
  }

  loadUser() {
    this.http.get(`http://localhost:3000/users/${this.userId}`).subscribe({
      next: (user: any) => {
        this.user = user;
        if (user.role === 'student') {
          this.loadStudentData(user.userId);
        } else if (user.role === 'lecturer') {
          this.loadLecturerData(user.userId);
        }
      },
      error: () => {
        alert('❌ Failed to load user info.');
      }
    });
  }

  loadStudentData(userId: string) {
    this.http.get(`http://localhost:3000/students/${userId}`).subscribe({
      next: (student: any) => this.student = student,
      error: () => console.warn('No student data found for this user.')
    });
  }

  loadLecturerData(userId: string) {
    this.http.get(`http://localhost:3000/lecturers/${userId}`).subscribe({
      next: (lecturer: any) => this.lecturer = lecturer,
      error: () => console.warn('No lecturer data found for this user.')
    });
  }

  // onImageChange(event: Event) {
  //   const input = event.target as HTMLInputElement;
  //   if (input.files && input.files[0]) {
  //     this.imageFile = input.files[0];
  //   }
  // }

  updateUser() {
    const createUserDto = {
      email: this.user.email,
      fullName: this.user.fullName,
      role: this.user.role,
      status: this.user.status,
      password: this.user.password
    };

    const userUpdate$ = this.http.patch(`http://localhost:3000/users/${this.user.userId}`, createUserDto);

    let roleUpdate$ = null;

    if (this.user.role === 'student' && this.student) {
      const studentDto = {
        fullName: this.user.fullName,
        dateOfBirth: this.student.dateOfBirth,
        gender: this.student.gender,
        address: this.student.address,
        email: this.student.email,
        phoneNumber: this.student.phoneNumber,
        classId: this.student.classId,
        studyStatus: this.student.studyStatus
      };
      roleUpdate$ = this.http.patch(`http://localhost:3000/students/${this.student.studentId}`, studentDto);
    } else if (this.user.role === 'lecturer' && this.lecturer) {
      const lecturerDto = {
        fullName: this.user.fullName,
        degree: this.lecturer.degree,
        specialization: this.lecturer.specialization,
        departmentCode: this.lecturer.departmentCode,
        email: this.user.email,
        phoneNumber: this.lecturer.phoneNumber
      };
      roleUpdate$ = this.http.patch(`http://localhost:3000/lecturers/${this.lecturer.lecturerId}`, lecturerDto);
    }

    userUpdate$.subscribe({
      next: () => {
        if (roleUpdate$) {
          roleUpdate$.subscribe({
            next: () => this.uploadAvatarIfNeeded(),
            error: () => alert('⚠️ User updated, but failed to update student/lecturer info.')
          });
        } else {
          this.uploadAvatarIfNeeded();
        }
      },
      error: () => alert('❌ Failed to update user.')
    });
  }

  uploadAvatarIfNeeded() {
    if (this.selectedFile) {
      const formData = new FormData();
      formData.append('avatar', this.selectedFile);
      formData.append('userId', this.user.userId);

      this.http.post<any>('http://localhost:3000/users/upload-avatar', formData).subscribe({
        next: (res) => {
          this.user.image = res.image;
          this.previewImageUrl = null;
          alert('✅ Profile and avatar updated successfully');
        },
        error: () => alert('⚠️ Profile updated but failed to upload avatar')
      });
    } else {
      alert('✅ Profile updated successfully');
    }
  }





  passwordData = {
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  };

  changePassword() {
    const { currentPassword, newPassword, confirmPassword } = this.passwordData;

    if (newPassword !== confirmPassword) {
      alert('❌ New passwords do not match');
      return;
    }

    // TODO: Call your API to change password, e.g.:
    this.http.patch(`http://localhost:3000/users/${this.user.userId}/change-password`, {
      currentPassword,
      newPassword
    }).subscribe({
      next: () => {
        alert('✅ Password changed successfully!');
        this.passwordData = { currentPassword: '', newPassword: '', confirmPassword: '' };
      },
      error: err => {
        alert('❌ Failed to change password');
      }
    });
  }

  selectedFile: File | null = null;
  previewImageUrl: string | null = null;

  onImageChange(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];

      const reader = new FileReader();
      reader.onload = () => {
        this.previewImageUrl = reader.result as string;
      };
      reader.readAsDataURL(this.selectedFile);
    }
  }


}