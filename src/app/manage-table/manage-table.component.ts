import { Component, EventEmitter, Input, Output, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { NgxPaginationModule } from 'ngx-pagination';

@Component({
  selector: 'app-manage-table',
  standalone: true,
  imports: [CommonModule,NgxPaginationModule],
  templateUrl: './manage-table.component.html',
  styleUrls: ['./manage-table.component.css']
})
export class ManageTableComponent implements OnChanges {
  @Input() records: any[] = [];
  @Input() entityName: string = '';
  @Input() displayKeys: string[] = [];

  @Output() refresh = new EventEmitter<void>();

  constructor(private http: HttpClient) { }
  currentPage: number = 1;
  itemsPerPage: number = 10; // You can make this @Input() if you want to configure it from the parent

  ngOnChanges(changes: SimpleChanges) {
    if (changes['displayKeys']) {
      console.log('✅ displayKeys changed:', this.displayKeys);
    }
    if (changes['records']) {
      console.log('✅ records changed:', this.records);
    }
  }

  deleteRecord(record: any) {
    if (!confirm('Are you sure you want to delete this record?')) return;

    this.http.delete(`http://localhost:3000/${this.entityName}s/${record[`${this.entityName}Id`]}`).subscribe({
      next: () => {
        alert('Record deleted successfully!');
        this.refresh.emit();
      },
      error: (err) => {
        console.error('Error deleting record:', err);
        alert('Failed to delete the record.');
      }
    });
  }
}
