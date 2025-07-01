import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { SidebarComponent } from '../components/sidebar/sidebar.component';
import { FormsModule } from '@angular/forms';
import { log } from 'node:console';

@Component({
  selector: 'app-student-grade-list',
  standalone: true,
  imports: [CommonModule, SidebarComponent, FormsModule],
  templateUrl: './student-grade-list.component.html',
  styleUrls: ['./student-grade-list.component.css']
})
export class StudentGradeListComponent implements OnInit {
  studentId = '';
  role! : String | null;
  scoreDetails: any[] = [];
  filteredDetails: any[] = [];
  subjectGroups: any[] = [];
  overallGPA: number = 0;
  academicClassification: string = '';

  // Dropdown options
  semesters: string[] = [];
  academicYears: string[] = [];

  selectedSemester: string = '';
  selectedAcademicYear: string = '';

  constructor(private http: HttpClient, private cdr: ChangeDetectorRef) { }

  ngOnInit(): void {
    if (typeof window !== 'undefined') {
      this.role = localStorage.getItem('role'); // Safe to use here
     if (this.role === 'student') {
        const student = localStorage.getItem('student');
        if (student) {
          const parsedLecturer = JSON.parse(student);
          this.studentId = parsedLecturer.studentId;
        }
      }
    }

    this.http.get<any[]>(`http://localhost:3000/score-details/student/${this.studentId}`).subscribe({
      next: (details) => {
        console.log(details);




        this.scoreDetails = details;
        this.extractFilterOptions();
        this.applyFilter(); // default no filter

      },
      error: () => alert('❌ Lỗi khi tải điểm sinh viên')
    });
  }

  extractFilterOptions(): void {
    const semSet = new Set<string>();
    const yearSet = new Set<string>();

    for (const d of this.scoreDetails) {
      const sem = d.courseClass.semester;
      const year = d.courseClass.academicYear;

      semSet.add(sem);
      yearSet.add(year);
    }

    this.semesters = Array.from(semSet).sort();
    this.academicYears = Array.from(yearSet).sort();
  }

  applyFilter(): void {
    this.filteredDetails = this.scoreDetails.filter(d => {
      const semMatch = !this.selectedSemester || d.courseClass.semester === this.selectedSemester;
      const yearMatch = !this.selectedAcademicYear || d.courseClass.academicYear === this.selectedAcademicYear;
      return semMatch && yearMatch;
    });

    this.groupScoresBySubject();
    this.calculateGPA();
  }

  groupScoresBySubject(): void {
    const map = new Map<string, any>();
    const fetchPromises: Promise<any>[] = [];

    for (const detail of this.filteredDetails) {
      const subjectName = detail.courseClass.subject.subjectName;
      const subjectCode = detail.courseClass.subject.subjectCode;
      const courseClassId = detail.courseClass.courseClassId;
      const credit = detail.courseClass.subject.credit;

      const key = courseClassId;

      if (!map.has(key)) {
        const group: {
          subjectName: string;
          subjectCode: string;
          courseClassId: string;
          credit: number;
          scores: any[];
          scoreConfig: any[]; // <- Explicitly tell TypeScript this is an array
          average: number;
        } = {
          subjectName,
          subjectCode,
          courseClassId,
          credit,
          scores: [],
          scoreConfig: [],
          average: 0
        };


        map.set(key, group);

        // 🟡 Fetch score config
        const fetch = this.http
          .get<any[]>(`http://localhost:3000/subject-score-config/${courseClassId}`)
          .toPromise()
          .then(async (config) => {
            if (!config) return;

            group.scoreConfig = config;

            const hasChuyenCan = config.some(c => c.scoreType?.scoreTypeId === 'CC');

            if (hasChuyenCan) {
              const attendance: any[] =
                (await this.http.get<any[]>(`http://localhost:3000/attendance/student/${this.studentId}/class/${courseClassId}`).toPromise()) || [];

              console.log(attendance);

              const statusToScore: Record<string, number> = {
                'present': 10,
                'late': 6,
                'absent': 0,
              };

              const ccScores = attendance.map(a => {
                const status = a.status.toLowerCase();
                return statusToScore[status] ?? 0;
              });
              const avgCC = ccScores.length
                ? ccScores.reduce((a, b) => a + b, 0) / ccScores.length
                : 0;

              group.scores.push({
                scoreTypeId: 'CC',
                type: 'Chuyên Cần',
                date: 'Hệ thống',
                score: +avgCC.toFixed(2)
              });
            }
          })
          .catch(() => console.warn(`⚠️ Failed to load config or attendance for ${courseClassId}`));


        fetchPromises.push(fetch);
      }

      map.get(key).scores.push({
        scoreTypeId: detail.scoreType.scoreTypeId,
        type: detail.scoreType.scoreTypeName,
        date: new Date(detail.entryDate).toLocaleDateString('vi-VN'),
        score: detail.score
      });
    }

    this.subjectGroups = Array.from(map.values());
    Promise.all(fetchPromises).then(() => this.calculateGPA());
  }

  getSubjectStatus(subjectCode: string): string {
    const detail = this.scoreDetails.find(d => d.courseClass?.subjectCode === subjectCode);
    if (!detail || !detail.courseClass?.endDate) return 'Không rõ';

    const endDate = new Date(detail.courseClass.endDate);
    console.log(endDate);
    
    const today = new Date();

    return today > endDate ? 'Đã kết thúc' : 'Đang học';
  }





  calculateGPA(): void {
    let totalWeightedScore = 0;
    let totalCredits = 0;

    console.log('🔍 Calculating GPA...');

    for (const subject of this.subjectGroups) {
      console.log(`\n📚 Subject: ${subject.subjectName} (${subject.subjectCode})`);
      const scoreConfigs = subject.scoreConfig || [];
      const scoreMap: { [scoreTypeId: string]: number[] } = {};

      // Step 1: Group scores
      for (const s of subject.scores) {
        const scoreTypeId = s.scoreTypeId;
        if (!scoreMap[scoreTypeId]) {
          scoreMap[scoreTypeId] = [];
        }
        scoreMap[scoreTypeId].push(s.score);
      }

      console.log('📥 Grouped scores by type:', scoreMap);
      console.log('⚖️ Score config with weights:', scoreConfigs.map((c: { scoreType: { scoreTypeId: any; }; scoreTypeId: any; weightPercent: any; }) => ({
        id: c.scoreType?.scoreTypeId ?? c.scoreTypeId,
        weight: c.weightPercent
      })));

      // Step 2: Weighted calculation
      let weightedSum = 0;
      let totalWeight = 0;

      for (const config of scoreConfigs) {
        const scoreTypeId = config.scoreType?.scoreTypeId ?? config.scoreTypeId;
        const weight = config.weightPercent;
        const scores = scoreMap[scoreTypeId];

        if (scores && scores.length > 0) {
          const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
          const contribution = avg * (weight / 100);
          weightedSum += contribution;
          console.log(`✅ ${scoreTypeId} avg = ${avg}, contribution = ${contribution}`);
        }
      }
      subject.average = +weightedSum.toFixed(2);



      const credit = subject.credit || 0;
      totalWeightedScore += subject.average * credit;
      totalCredits += credit;

      console.log(`✅ Subject average: ${subject.average}`);
      console.log(`🎓 Credits: ${credit}, Weighted subject score: ${(subject.average * credit).toFixed(2)}`);
    }

    this.overallGPA = totalCredits > 0 ? +(totalWeightedScore / totalCredits).toFixed(2) : 0;
    this.academicClassification = this.classifyAcademicPerformance(this.overallGPA);

    console.log('\n🏁 Final GPA:', this.overallGPA);
    console.log('📌 Classification:', this.academicClassification);
  }




  classifyAcademicPerformance(score: number): string {
    if (score >= 9.0) return 'Xuất sắc';
    if (score >= 8.0) return 'Giỏi';
    if (score >= 6.5) return 'Khá';
    if (score >= 5.0) return 'Trung bình';
    return 'Yếu';
  }

  isSubjectFinished(endDate: string): boolean {
    const today = new Date();
    const subjectEnd = new Date(endDate);
    return subjectEnd < today;
  }

}
