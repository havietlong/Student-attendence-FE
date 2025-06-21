import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule, NgClass } from '@angular/common';
import { HttpClient } from '@angular/common/http'; // ✅ import this
import { AuthService } from '../services/auth.service';
import { UserService } from '../services/users.service';
import { SidebarComponent } from '../components/sidebar/sidebar.component';

@Component({
  selector: 'app-add-users',
  standalone: true,
  imports: [FormsModule, NgClass, CommonModule, SidebarComponent],
  templateUrl: './add-users.component.html',
  styleUrl: './add-users.component.css',
})
export class AddUsersComponent {
  constructor(private http: HttpClient) { }

  // User fields
  first_name = '';
  last_name = '';
  email = '';
  phone_number = '';
  gender = 'Male';
  birthday = '';
  address = '';
  role = '';
  image = '';

  // Student
  ma_lop = '';

  // Lecturer
  degree = '';
  specialization = '';
  departmentCode = '';

  // For preview
  previewUrl: string | ArrayBuffer | null = null;
  selectedFile: File | null = null;
  createdUserId: string = '';

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;

      // Preview the image
      const reader = new FileReader();
      reader.onload = () => this.previewUrl = reader.result;
      reader.readAsDataURL(file);
    }
  }

  onSubmit() {
  const generatedPassword = this.generatePassword();
  const fullName = this.first_name + ' ' + this.last_name;

  const user: any = {
    fullName: fullName,
    email: this.email,
    role: this.role,
    password: generatedPassword,
    status: 'active'
  };

  this.http.post<any>('http://localhost:3000/users', user).subscribe(res => {
    this.createdUserId = res.userId;

    let patchPayload: any = {
      fullName: fullName,
      dateOfBirth: this.birthday,
      gender: this.gender,
      address: this.address,
      email: this.email,
      phoneNumber: this.phone_number,        
    };

    if (this.role === 'student') {
      patchPayload = {
        ...patchPayload,
        classId: this.ma_lop,
        studyStatus: 'enrolled'
      };

      this.http.patch(`http://localhost:3000/students/${this.createdUserId}`, patchPayload).subscribe(() => {
        console.log('Student patched successfully');
        this.sendEmail(fullName, this.email, generatedPassword);
      });

    } else if (this.role === 'lecturer') {
      patchPayload = {
        ...patchPayload,
        degree: this.degree,
        specialization: this.specialization,
        departmentCode: this.departmentCode
      };

      this.http.patch(`http://localhost:3000/lecturers/${this.createdUserId}`, patchPayload).subscribe(() => {
        console.log('Lecturer patched successfully');
        this.sendEmail(fullName, this.email, generatedPassword);
      });
    }

    // Step 3: Upload avatar
    if (this.selectedFile) {
      const formData = new FormData();
      formData.append('avatar', this.selectedFile);
      formData.append('userId', this.createdUserId);

      this.http.post<any>('http://localhost:3000/users/upload-avatar', formData).subscribe(uploadRes => {
        console.log('Avatar uploaded!');
        this.image = uploadRes.image;
      });
    }

    // Log for debugging (optional)
    console.log(`Account created for ${this.email} with password: ${generatedPassword}`);
  });
}

// Helper function to send email
sendEmail(fullName: string, email: string, password: string) {
  const emailPayload = {
    to: email,
    subject: 'Your Account Credentials',
    html: `
      <p>Hello ${fullName},</p>
      <p>Your account has been successfully created. Here are your login credentials:</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Password:</strong> ${password}</p>
      <p>Please change your password after logging in for the first time.</p>
      <p>Best regards,<br>Admin Team</p>
    `
  };

  this.http.post('http://localhost:3000/mail/send', emailPayload).subscribe({
    next: () => {
      console.log('Email sent successfully.');
      // You can show a success message here if desired
    },
    error: (err) => {
      console.error('Failed to send email:', err);
      // Show an error toast or message if needed
    }
  });
}



  generatePassword(length: number = 10): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$';
    let password = '';
    for (let i = 0; i < length; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }



  onResetForm() {
    this.first_name = '';
    this.last_name = '';
    this.email = '';
    this.phone_number = '';
    this.gender = 'Male';
    this.birthday = '';
    this.address = '';
    this.role = '';
    this.image = '';
    this.ma_lop = '';
    this.degree = '';
    this.specialization = '';
    this.departmentCode = '';
    this.previewUrl = null;
    this.selectedFile = null;
  }
}
