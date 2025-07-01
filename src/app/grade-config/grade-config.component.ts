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
  configId?: number;
  courseClassId: string;
  scoreTypeId: string;
  scoreTypeName?: string; // Optional: used in dropdown or display
  weightPercent: number;
  scoreType?: {
    scoreTypeId: string;
    scoreTypeName: string;
  };
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

      this.http.get<any>(`http://localhost:3000/course-classes/${this.courseClassId}`)
        .subscribe({
          next: (courseClass) => {
            console.log(courseClass);

            this.subjectCode = courseClass.subjectCode; // ✅ Now subjectCode is ready for saveConfig
          },
          error: () => alert('❌ Không thể tải thông tin lớp học phần')
        });


      // ✅ Load score types
      this.http.get<ScoreType[]>('http://localhost:3000/score-types').subscribe({
        next: (res) => this.gradeTypes = res,
        error: () => alert('Không thể tải danh sách loại điểm.')
      });

      // ✅ Load existing configs
      this.http.get<SubjectScoreConfig[]>(`http://localhost:3000/subject-score-config/${courseClassId}`)
        .subscribe({
          next: (res) => {
            this.gradingConfig = res.map(item => ({
              configId: item.configId,
              courseClassId: item.courseClassId,
              scoreTypeId: item.scoreType?.scoreTypeId || '',
              scoreTypeName: item.scoreType?.scoreTypeName || '',
              weightPercent: item.weightPercent
            }));
            console.log(res);
          },
          error: () => alert('Không thể tải cấu hình điểm.')
        });
    }
  }





  gradingConfig: SubjectScoreConfig[] = [];

  addRow() {
    this.gradingConfig.push({ scoreTypeId: '', scoreTypeName: '', weightPercent: 0, courseClassId: this.courseClassId });
  }

  removeRow(index: number) {
    const row = this.gradingConfig[index];

    // If it's an existing config with a configId → call backend
    if (row.configId) {
      if (confirm('Bạn chắc chắn muốn xoá cấu hình điểm này?')) {
        this.http.delete(`http://localhost:3000/subject-score-config/${row.configId}`)
          .subscribe({
            next: () => {
              this.gradingConfig.splice(index, 1);
              alert('✅ Xoá thành công!');
            },
            error: () => alert('❌ Xoá thất bại')
          });
      }
    } else {
      // If it's a newly added row (no configId yet), just remove locally
      this.gradingConfig.splice(index, 1);
    }
  }


  getTotalPercentage(): number {
    return this.gradingConfig.reduce((sum, row) => sum + Number(row.weightPercent || 0), 0);
  }

  saveConfig() {
    // 1. Total percent must be 100
    if (this.getTotalPercentage() !== 100) {
      alert('❌ Tổng tỷ lệ phải bằng 100%!');
      return;
    }

    // 2. Prevent duplicate scoreTypeId
    const seen = new Set();
    for (let item of this.gradingConfig) {
      if (seen.has(item.scoreTypeId)) {
        alert(`❌ Loại điểm "${item.scoreTypeId}" bị trùng.`);
        return;
      }
      seen.add(item.scoreTypeId);
    }

    // 3. Separate new and existing configs
    const newConfigs = this.gradingConfig.filter(item => item.configId === undefined);
    const updatedConfigs = this.gradingConfig.filter(item => item.configId !== undefined);

    // 4. POST new configs
    if (newConfigs.length > 0) {
      const postPayload = newConfigs.map(item => ({
        courseClassId: this.courseClassId,
        scoreTypeId: item.scoreTypeId,
        weightPercent: item.weightPercent
      }));

      this.http.post(`http://localhost:3000/subject-score-config/many`, postPayload).subscribe({
        next: () => console.log('✅ Thêm cấu hình điểm thành công'),
        error: () => alert('❌ Không thể thêm cấu hình điểm')
      });
    }

    // 5. PATCH updated configs
    for (const item of updatedConfigs) {
      const payload = {
 
        courseClassId: item.courseClassId,
        scoreTypeId: item.scoreTypeId,
        weightPercent: item.weightPercent
      };

      this.http.patch(`http://localhost:3000/subject-score-config/${item.configId}`, payload).subscribe({
        next: () => console.log(`✅ Updated configId ${item.configId}`),
        error: () => alert(`❌ Update failed for configId ${item.configId}`)
      });
    }



    alert('✅ Đã gửi cấu hình điểm thành công!');
  }





  deleteConfigRow(configId: number, index: number) {
    if (!confirm('Bạn chắc chắn muốn xoá cấu hình điểm này?')) return;

    this.http.delete(`http://localhost:3000/subject-score-config/${configId}`)
      .subscribe({
        next: () => {
          this.gradingConfig.splice(index, 1);
          alert('✅ Xoá thành công!');
        },
        error: () => alert('❌ Không thể xoá cấu hình điểm.')
      });
  }

}
