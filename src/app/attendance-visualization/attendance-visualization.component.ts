import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';

@Component({
  selector: 'app-attendance-visualization',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './attendance-visualization.component.html',
  styleUrl: './attendance-visualization.component.css'
})
export class AttendanceVisualizationComponent implements OnChanges {
  @Input() attendanceRecords: any[] = [];

  processedData: { [subject: string]: { sessionNumber: number; sessionDate: string; status: string; }[] } = {};
  maxSessions = 0;
  maxSessionsArray: number[] = [];
  subjects: string[] = [];

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['attendanceRecords']) {
      console.log(this.attendanceRecords);

      this.processAttendanceData();
    }
  }

  processAttendanceData() {
    this.processedData = {};
    this.maxSessions = 0;

    for (let record of this.attendanceRecords) {
      const subject = record.subjectName;

      if (!this.processedData[subject]) {
        this.processedData[subject] = [];
      }

      for (let session of record.sessions) {
        const sessionNumber = session.sessionNumber;
        const sessionDate = session.sessionDate;
        const status = session.status; // Keep full status now

        this.processedData[subject].push({ sessionNumber, sessionDate, status });

        if (sessionNumber > this.maxSessions) {
          this.maxSessions = sessionNumber;
        }
      }
    }

    // Ensure sessions are sorted in each subject
    for (let subject in this.processedData) {
      this.processedData[subject].sort((a, b) => a.sessionNumber - b.sessionNumber);
    }

    this.maxSessionsArray = Array.from({ length: this.maxSessions }, (_, i) => i + 1);
    this.subjects = Object.keys(this.processedData);
  }


  getSessionsForSubject(subject: string) {
    return this.processedData[subject];
  }

  getSessionDate(subject: string, sessionNumber: number): string {
    const session = this.processedData[subject].find(s => s.sessionNumber === sessionNumber);
    return session ? new Date(session.sessionDate).toDateString() : 'Chưa có buổi học';
  }

  hasAttended(subject: string, sessionNumber: number): boolean {
    const session = this.processedData[subject].find(s => s.sessionNumber === sessionNumber);
    return session ? session.status !== 'absent' : false;
  }

  getStatus(subject: string, sessionNumber: number): string {
  const session = this.processedData[subject].find(s => s.sessionNumber === sessionNumber);
  return session ? session.status : 'absent';
}


}
