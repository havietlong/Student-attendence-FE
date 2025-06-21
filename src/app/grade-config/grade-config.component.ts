import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Route } from '@angular/router';
import { SidebarComponent } from "../components/sidebar/sidebar.component";
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
// @ts-ignore
export interface ScoreType {
  scoreTypeId: string;
  scoreTypeName: string;
}

export interface SubjectScoreConfig {
  scoreTypeId: string; // foreign key to ScoreType
  scoreTypeName?: string; // optional, for display if needed
  weightPercent: number;
}


@Component({
  selector: 'app-grade-config',
  standalone: true,
  imports: [FormsModule, SidebarComponent, CommonModule],
  templateUrl: './grade-config.component.html',
  styleUrls: ['./grade-config.component.css']
})
export class GradeConfigComponent implements OnInit {

  courseClassId: string = '';
  gradeTypes: ScoreType[] = [];
  subjectCode: string = '';
  editBuffer = { scoreTypeId: '', scoreTypeName: '' };
  newScoreType: ScoreType = {
    scoreTypeId: '',
    scoreTypeName: ''
  };

  editIndex: number | null = null;

  showModal = false;

  submitScoreType() {
    this.http.post<ScoreType>('http://localhost:3000/score-types', {
      scoreTypeId: this.newScoreType.scoreTypeId,
      scoreTypeName: this.newScoreType.scoreTypeName
    }).subscribe({
      next: (created) => {
        this.gradeTypes.push(created);
        // this.showModal = false;
        this.newScoreType = { scoreTypeId: '', scoreTypeName: '' };
      },
      error: () => alert('Không thể thêm loại điểm.')
    });
  }





  isDuplicateScoreType(): boolean {
    const code = this.newScoreType.scoreTypeId?.trim().toLowerCase();
    const name = this.newScoreType.scoreTypeName?.trim().toLowerCase();
    return this.gradeTypes.some(
      (type) =>
        type.scoreTypeId.toLowerCase() === code ||
        type.scoreTypeName.toLowerCase() === name
    );
  }




  startEdit(index: number) {
    this.editIndex = index;
    this.editBuffer = { ...this.gradeTypes[index] };
  }

  cancelEdit() {
    this.editIndex = null;
    this.editBuffer = { scoreTypeId: '', scoreTypeName: '' };
  }

  saveEdit(id: string) {
    this.http.patch(`http://localhost:3000/score-types/${id}`, this.editBuffer).subscribe({
      next: () => {
        this.gradeTypes[this.editIndex!] = { ...this.editBuffer };
        this.cancelEdit();
      },
      error: () => alert('❌ Cập nhật thất bại')
    });
  }


  deleteScoreType(type: ScoreType) {
    if (confirm(`Xóa loại điểm "${type.scoreTypeName}"?`)) {
      this.http.delete(`http://localhost:3000/score-types/${type.scoreTypeId}`).subscribe({
        next: () => {
          this.gradeTypes = this.gradeTypes.filter(t => t.scoreTypeId !== type.scoreTypeId);
        },
        error: () => alert('❌ Xóa thất bại')
      });
    }
  }




  onScoreTypeChange(i: number, selectedName: string) {
    const match = this.gradeTypes.find(type => type.scoreTypeName === selectedName);
    if (match) {
      this.gradingConfig[i].scoreTypeId = match.scoreTypeId;
      this.gradingConfig[i].scoreTypeName = match.scoreTypeName;
    }
  }

  constructor(private route: ActivatedRoute, private http: HttpClient) { }

  ngOnInit(): void {
  const courseClassId = this.route.snapshot.paramMap.get('courseClassId');
  if (courseClassId) {
    this.courseClassId = courseClassId;

    // ✅ Load score types
    this.http.get<ScoreType[]>('http://localhost:3000/score-types').subscribe({
      next: (res) => this.gradeTypes = res,
      error: () => alert('Không thể tải danh sách loại điểm.')
    });

    // ✅ Load existing configs
    this.http.get<SubjectScoreConfig[]>(`http://localhost:3000/subject-score-config/${courseClassId}`)
      .subscribe({
        next: (res) => this.gradingConfig = res,
        error: () => alert('Không thể tải cấu hình điểm.')
      });
  }
}



  gradingConfig: SubjectScoreConfig[] = [];

  addRow() {
    this.gradingConfig.push({ scoreTypeId: '', scoreTypeName: '', weightPercent: 0 });
  }

  removeRow(index: number) {
    this.gradingConfig.splice(index, 1);
  }

  getTotalPercentage(): number {
    return this.gradingConfig.reduce((sum, row) => sum + Number(row.weightPercent || 0), 0);
  }

  saveConfig() {
    if (this.getTotalPercentage() !== 100) {
      alert('Tổng tỷ lệ phải bằng 100%!');
      return;
    }

    const payload = this.gradingConfig.map(item => ({
      subjectCode: this.subjectCode,            // make sure you have this variable
      scoreTypeId: item.scoreTypeId,            // already selected
      weightPercent: item.weightPercent          // renamed if needed
    }));

    this.http.post(`http://localhost:3000/subject-score-config/many`, payload)
      .subscribe({
        next: () => alert('✅ Đã lưu cấu hình điểm thành công'),
        error: () => alert('❌ Không thể lưu cấu hình điểm')
      });
  }


}
