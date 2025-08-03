import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule, NgClass } from '@angular/common';
import { HttpClient } from '@angular/common/http'; // ✅ import this
import { AuthService } from '../services/auth.service';
import { UserService } from '../services/users.service';
import { SidebarComponent } from '../components/sidebar/sidebar.component';
import * as XLSX from 'xlsx';

interface UserExcelInput {
  email: string;
  fullName: string;
  role: 'student' | 'lecturer'; // or just string if not strict
  password: string;
}

@Component({
  selector: 'app-add-users',
  standalone: true,
  imports: [FormsModule, NgClass, CommonModule, SidebarComponent],
  templateUrl: './add-users.component.html',
  styleUrl: './add-users.component.css',
})

export class AddUsersComponent {
  departments: any[] = [];
  majors: any[] = [];
  degreeOptions = ['Bachelor', 'Master', 'Doctor', 'PhD', 'Professor'];
  isLoading: boolean = false;
  isSuccess: boolean = false;
  classList: any[] = [];

  selectedDepartment: any = '';

  constructor(private http: HttpClient) { }

  ngOnInit() {
    this.http.get<any[]>('http://localhost:3000/departments').subscribe(res => {
      this.departments = res;
      console.log(this.departments);

    });
    // 👇 Fetch class list here
    this.http.get<any[]>('http://localhost:3000/class').subscribe(res => {
      this.classList = res;
      console.log(this.classList);
    });
  }

  onExcelUpload(event: any) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e: any) => {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array' });

      const worksheet = workbook.Sheets[workbook.SheetNames[0]];

      // ✅ Here's where you use the correct variable
      const usersFromExcel: UserExcelInput[] = XLSX.utils.sheet_to_json(worksheet);

      // ✅ Validate structure
      if (
        !Array.isArray(usersFromExcel) ||
        !usersFromExcel[0]?.email ||
        !usersFromExcel[0]?.fullName ||
        !usersFromExcel[0]?.role
      ) {
        console.error('Invalid or empty file.');
        return;
      }

      // ✅ Normalize users (generate password if missing)


      this.isLoading = true;

      this.http.post('http://localhost:3000/users/bulk', usersFromExcel).subscribe({
        next: () => {
          alert('✅ Users imported successfully!');
          this.isLoading = false;
        },
        error: (err) => {
          console.error('❌ Bulk import failed:', err);
          this.isLoading = false;
          alert('Bulk import failed. Check the console for more details.');
        }
      });
    };

    reader.readAsArrayBuffer(file);
  }



  onDepartmentChange() {
    const dept = this.departments.find(d => d.departmentCode === this.selectedDepartment);
    console.log(this.selectedDepartment);

    // Reset specialization when changing department
    this.specialization = [];

    if (dept && dept.majors.length > 0) {
      // Remove duplicate majors (by name)
      const uniqueMajors = Array.from(new Set(dept.majors.map((m: { majorName: any; }) => m.majorName)))
        .map(name => dept.majors.find((m: { majorName: unknown; }) => m.majorName === name));

      this.majors = uniqueMajors;
    } else {
      this.majors = [];
    }
  }



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
  specialization: string[] = [];
  departmentCode = '';

  // For preview
  previewUrl: string | ArrayBuffer | null = null;
  selectedFile: File | null = null;
  createdStudentId: string = '';
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
    this.isLoading = true; // 🔄 Start loading
    this.isSuccess = false;

    const generatedPassword = this.generatePassword();
    const fullName = this.first_name + ' ' + this.last_name;

    const user: any = {
      fullName: fullName,
      email: this.email,
      role: this.role,
      password: generatedPassword,
      status: 'active'
    };

    this.http.post<any>('http://localhost:3000/users', user).subscribe({
      next: (res) => {
        if (!res?.user.userId) {
          console.error('User ID not returned. Aborting.');
          this.isLoading = false;
          return;
        }
        this.createdUserId = res.lecturerId;
        this.createdStudentId = res.studentId;

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

          this.http.patch(`http://localhost:3000/students/${this.createdStudentId}`, patchPayload).subscribe({
            next: () => {
              console.log('Student patched successfully');
              this.sendEmail(fullName, this.email, generatedPassword, true);

              const gpaPayload = {
                studentId: this.createdStudentId,
                semester: 1,
                academicYear: '2024-2025',
                semesterGpaScale10: 0,
                semesterGpaScale4: 0,
                cumulativeGpaScale10: 0,
                cumulativeGpaScale4: 0,
                academicClassification: 'Not classified',
                creditsEarned: 0,
                creditsAccumulated: 0,
                calculatedAt: new Date()
              };

              this.http.post('http://localhost:3000/average-grades', gpaPayload).subscribe({
                next: () => console.log('GPA record created successfully.'),
                error: (err) => console.error('Failed to create GPA record:', err)
              });
            },
            error: (err) => {
              console.error('Failed to patch student:', err);
              this.isLoading = false;
            }
          });

        } else if (this.role === 'lecturer') {
          patchPayload = {
            ...patchPayload,
            degree: this.degree,
            specialization: this.specialization,
            departmentCode: this.selectedDepartment
          };

          this.http.patch(`http://localhost:3000/lecturers/${this.createdUserId}`, patchPayload).subscribe({
            next: () => {
              console.log('Lecturer patched successfully');
              this.sendEmail(fullName, this.email, generatedPassword, true);
            },
            error: (err) => {
              console.error('Failed to patch lecturer:', err);
              this.isLoading = false;
            }
          });
        }

        if (this.selectedFile) {
          const formData = new FormData();
          formData.append('avatar', this.selectedFile);
          formData.append('userId', this.createdUserId);

          this.http.post<any>('http://localhost:3000/users/upload-avatar', formData).subscribe({
            next: (uploadRes) => {
              console.log('Avatar uploaded!');
              this.image = uploadRes.image;
            },
            error: (err) => console.error('Avatar upload failed:', err)
          });
        }

        console.log(`Account created for ${this.email} with password: ${generatedPassword}`);
      },
      error: (err) => {
        console.error('Failed to create user:', err);
        this.isLoading = false;
      }
    });
  }



  // Helper function to send email
  sendEmail(fullName: string, email: string, password: string, showSuccess: boolean = false) {
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
        this.isLoading = false;
        if (showSuccess) {
          this.isSuccess = true;
          setTimeout(() => {
            this.isSuccess = false;
          }, 3000); // hide after 3 seconds
        }
      },
      error: (err) => {
        console.error('Failed to send email:', err);
        this.isLoading = false;
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
    this.specialization = [];
    this.departmentCode = '';
    this.previewUrl = null;
    this.selectedFile = null;
  }



  toggleSpecialization(majorName: string) {
    if (this.specialization.includes(majorName)) {
      // If already selected, remove it
      this.specialization = this.specialization.filter(item => item !== majorName);
    } else {
      // If not selected, add it
      this.specialization.push(majorName);
    }
  }

  isSelected(option: string): boolean {
    return Array.isArray(this.specialization) && this.specialization.includes(option);
  }

}
