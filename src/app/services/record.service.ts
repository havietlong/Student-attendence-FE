import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class RecordService {
  constructor(private http: HttpClient) {}

  getMajors() {
    return this.http.get<{ code: string, name: string }[]>('http://localhost:3000/majors');
  }

  getSubjects() {
    return this.http.get<{ code: string, name: string }[]>('http://localhost:3000/subject');
  }
}
