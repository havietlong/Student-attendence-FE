import { Component, EventEmitter, Input, Output } from '@angular/core';
import { RecordService } from '../services/record.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-record-preview',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './record-preview.component.html',
  styleUrl: './record-preview.component.css'
})
export class RecordPreviewComponent {
  @Input() recordType: string | null = null;
  @Output() valueSelected = new EventEmitter<string>();

  records: any[] = [];

  constructor(private service: RecordService) { }

  ngOnChanges() {
    if (this.recordType === 'major') {
      this.service.getMajors().subscribe((majors: any[]) => {
        this.records = majors.map(major => ({
          id: major.majorCode,
          label: `${major.majorName} (${major.majorCode})`,
          raw: major
        }));
      });
    } else if (this.recordType === 'subject') {
      this.service.getSubjects().subscribe((subjects: any[]) => {
        this.records = subjects.map(subject => ({
          id: subject.subjectCode,
          label: `${subject.subjectName} (${subject.subjectCode})`,
          raw: subject
        }));
      });
    } else {
      this.records = [];
    }
  }


  selectRecord(id: string) {
    this.valueSelected.emit(id);
  }
}
