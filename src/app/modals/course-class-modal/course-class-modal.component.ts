import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Lecturer, Subject } from '../../../interfaces';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
@Component({
  selector: 'app-course-class-modal',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './course-class-modal.component.html',
  styleUrl: './course-class-modal.component.css',
})
export class CourseClassModalComponent implements OnInit {
  @Input() initialDate!: Date;
  @Output() close = new EventEmitter<void>();
  classForm!: FormGroup;
  sessionsForm!: FormGroup;
  subjects: Subject[] = [];
  lecturers: Lecturer[] = [];
  constructor(private fb: FormBuilder, private http: HttpClient) { }

  daysOfWeek = [
    { label: 'Monday', value: 1 },
    { label: 'Tuesday', value: 2 },
    { label: 'Wednesday', value: 3 },
    { label: 'Thursday', value: 4 },
    { label: 'Friday', value: 5 },
  ];

  selectedDays: number[] = [];

  ngOnInit(): void {
    console.log(this.daysOfWeek);

    console.log('here');


    this.classForm = this.fb.group({
      subjectCode: ['', Validators.required],
      courseClassId:['', Validators.required],
      lecturerId: [''],
      classroom: ['', Validators.required],
      semester: [1, Validators.required],
      academicYear: ['', Validators.required],
      startDate: ['', Validators.required],
      registrationDeadline:['', Validators.required],
      endDate: ['', Validators.required],
      dayOfWeek: this.fb.control<number[]>([], Validators.required),
      maxCapacity: [0, Validators.required],
      sessions: this.fb.array([]),
    });



    this.classForm.get('startDate')?.valueChanges.subscribe(() => this.updateSessions());
    this.classForm.get('endDate')?.valueChanges.subscribe(() => this.updateSessions());
    this.classForm.get('dayOfWeek')?.valueChanges.subscribe(() => this.updateSessions());

    this.http.get<Subject[]>('http://localhost:3000/subject').subscribe({
      next: (subjects) => this.subjects = subjects,
      error: (err) => console.error('Failed to fetch subjects', err)
    });

    this.http.get<Lecturer[]>('http://localhost:3000/lecturers').subscribe({
      next: (lecturers) => this.lecturers = lecturers,
      error: (err) => console.error('Failed to fetch lecturers', err)
    });

  }





  toggleDay(dayValue: number): void {
    const index = this.selectedDays.indexOf(dayValue);
    if (index >= 0) {
      this.selectedDays.splice(index, 1);
    } else {
      this.selectedDays.push(dayValue);
    }
    this.classForm.get('dayOfWeek')?.setValue(this.selectedDays);
    this.updateSessions();  // This will regenerate based on current selection
  }

  get sessions(): FormArray {
    return this.classForm.get('sessions') as FormArray;
  }

  addSession() {
    const sessionGroup = this.fb.group({
      startingPeriod: [''] // 👈 Ensure this matches exactly what's used in the HTML
    });

    this.sessions.push(sessionGroup);
  }

  getDayLabel(dayValue: number): string {
    const day = this.daysOfWeek.find(d => d.value === dayValue);
    return day ? day.label : 'Unknown';
  }



  createSessionGroup(dayOfWeek: number): FormGroup {
    return this.fb.group({
      dayOfWeek: [dayOfWeek, Validators.required],
      classroom: ['', Validators.required],
      startPeriod: [1, [Validators.required, Validators.min(1)]],
      periodCount: [1, [Validators.required, Validators.min(1)]],
    });
  }

  updateSessions() {
    const selectedDays = this.classForm.get('dayOfWeek')?.value;

    this.sessions.clear();

    if (!selectedDays || selectedDays.length === 0) {
      return;
    }

    selectedDays.forEach((dayValue: number) => {
      this.sessions.push(this.fb.group({
        dayOfWeek: [dayValue, Validators.required],
        startPeriod: [1, [Validators.required, Validators.min(1)]],
        periodCount: [1, [Validators.required, Validators.min(1)]],
      }));
    });
  }


  // Format date to yyyy-MM-dd for input type="date"
  formatDate(date: Date): string {
    const d = new Date(date);
    return d.toISOString().slice(0, 10);
  }


  submitForm() {
    const form = this.classForm.value;

    const courseClassPayload = {
      subjectCode: form.subjectCode,
      courseClassId:form.courseClassId,
      lecturerId: form.lecturerId,
      semester: form.semester,
      academicYear: form.academicYear,
      classroom: form.classroom,
      dayOfWeek: form.dayOfWeek, // array like [1, 3]
      startDate: form.startDate,
      endDate: form.endDate,
      maxCapacity: form.maxCapacity,
      registrationDeadline:form.registrationDeadline,
    };

    this.http.post<any>('http://localhost:3000/course-classes', courseClassPayload).subscribe({
      next: (response) => {
        const courseClassId = String(response.courseClassId);
        const sessionDates: string[] = response.sessionDates;

        // Now prepare session payloads using backend's sessionDates
        const sessionPayloads = sessionDates.map((date: string) => {
          // Optional: You can allow the user to pick periods in form.sessions[0] (Mon) and [1] (Wed)
          // Match the session with the corresponding day
          const day = new Date(date).getDay(); // e.g. 1 for Monday
          const sessionConfig = form.sessions.find((s: any) => s.dayOfWeek === day);

          return {
            courseClassId: courseClassId,
            sessionDate: date,
            classroom: form.classroom,
            startPeriod: sessionConfig?.startPeriod ?? 1,
            periodCount: sessionConfig?.periodCount ?? 2
          };
        });

        // Save the sessions
        this.http.post<any>(
          'http://localhost:3000/class-session/many',
           sessionPayloads , // ✅ wrap in an object
          { headers: { 'Content-Type': 'application/json' } } // Ensure correct headers
        ).subscribe({
          next: () => console.log('Sessions created'),
          error: (err) => console.error('Failed to create sessions', err)
        });
      },
      error: (err) => console.error('Failed to create course class', err)
    });
  }



  onClose() {
    this.close.emit();
  }
}
