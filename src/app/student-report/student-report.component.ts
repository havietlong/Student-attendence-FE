import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { SidebarComponent } from '../components/sidebar/sidebar.component';
import { CommonModule } from '@angular/common';

interface ScoreEntry {
  scoreTypeId: string;
  weightPercent: number;
  score: number | null;
}

interface SubjectTranscript {
  subjectCode: string;
  subjectName: string;
  credit: number;
  average: number | string;
}

@Component({
  selector: 'app-student-report',
  standalone: true,
  imports: [CommonModule, SidebarComponent],
  templateUrl: './student-report.component.html',
  styleUrls: ['./student-report.component.css']
})
export class StudentReportComponent implements OnInit {

  transcript: SubjectTranscript[] = [];
  gpa: number | string = '-';
  classification: string = '-';
  studentId!: String;
  totalCredits = 120; // Optional: total program credits
  creditsCompleted = 0;

  constructor(private http: HttpClient) { }

  ngOnInit(): void {
    if (typeof window !== 'undefined') {
      const student = localStorage.getItem('student');
      if (student) {
        const parsedLecturer = JSON.parse(student);
        this.studentId = parsedLecturer.studentId;
      }
    }

    this.http.get<any[]>(`http://localhost:3000/score-details/student/${this.studentId}`)
      .subscribe({
        next: (details) => this.processScores(details),
        error: () => alert('❌ Lỗi khi tải điểm sinh viên')
      });


  }

  async processScores(data: any[]): Promise<void> {
    const subjectMap = new Map<
      string,
      {
        subjectName: string;
        credit: number;
        courseClassId: string;
        scores: ScoreEntry[];
      }
    >();

    for (const detail of data) {
      const subjectCode = detail.courseClass.subjectCode;
      const subjectName = detail.courseClass.subject.subjectName;
      const credit = detail.courseClass.subject.credit;
      const courseClassId = detail.courseClass.courseClassId;

      if (!subjectMap.has(subjectCode)) {
        subjectMap.set(subjectCode, {
          subjectName,
          credit,
          courseClassId,
          scores: [],
        });
      }

      subjectMap.get(subjectCode)!.scores.push({
        scoreTypeId: detail.scoreType.scoreTypeId,
        weightPercent: 0,
        score: detail.score,
      });
    }

    const result: SubjectTranscript[] = [];
    let totalWeighted = 0;
    let totalCredits = 0;

    for (const [subjectCode, group] of subjectMap.entries()) {
      console.log(`\n📚 Subject: ${group.subjectName} (${subjectCode})`);
      const config: any[] =
        (await this.http
          .get<any[]>(`http://localhost:3000/subject-score-config/${group.courseClassId}`)
          .toPromise()
          .catch(() => [])) || [];

      const weightMap: Record<string, number> = {};
      for (const conf of config) {
        const id = conf.scoreType?.scoreTypeId ?? conf.scoreTypeId;
        weightMap[id] = conf.weightPercent;
      }

      console.log('⚖️ Score config:', weightMap);

      // Add Chuyên Cần if needed
      const hasCC = config.some(c => (c.scoreType?.scoreTypeId ?? c.scoreTypeId) === 'CC');
      if (hasCC) {
        const attendance: any[] =
          (await this.http
            .get<any[]>(`http://localhost:3000/attendance/student/${this.studentId}/class/${group.courseClassId}`)
            .toPromise()
            .catch(() => [])) || [];

        const statusToScore: Record<string, number> = {
          present: 10,
          late: 6,
          absent: 0,
        };

        const ccScores = attendance.map(a => statusToScore[a.status?.toLowerCase()] ?? 0);
        const avgCC =
          ccScores.length > 0 ? ccScores.reduce((a, b) => a + b, 0) / ccScores.length : 0;

        console.log(`📝 Chuyên Cần (from attendance): avg = ${avgCC.toFixed(2)}`);

        group.scores.push({
          scoreTypeId: 'CC',
          weightPercent: weightMap['CC'] || 0,
          score: +avgCC.toFixed(2),
        });
      }

      for (const s of group.scores) {
        s.weightPercent = weightMap[s.scoreTypeId] || 0;
      }

      // ✅ Group scores by type
      const grouped = group.scores.reduce((acc: any, cur) => {
        if (!acc[cur.scoreTypeId]) acc[cur.scoreTypeId] = [];
        acc[cur.scoreTypeId].push(cur.score);
        return acc;
      }, {});
      console.log('📥 Grouped Scores:', grouped);

      // ✅ Calculate weighted average per type
      let sum = 0;
      for (const scoreTypeId in grouped) {
        const scores: number[] = grouped[scoreTypeId].filter((s: number | null) => s !== null && !isNaN(s));
        if (scores.length > 0) {
          const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
          const weight = weightMap[scoreTypeId] || 0;
          const contribution = avg * (weight / 100);
          sum += contribution;
          console.log(`➡️ ${scoreTypeId}: ${avg.toFixed(2)} x ${weight}% = ${contribution.toFixed(2)}`);
        } else {
          console.warn(`⚠️ No valid scores for type ${scoreTypeId}`);
        }
      }

      const avg = parseFloat(sum.toFixed(2));
      console.log(`✅ Weighted Avg for ${subjectCode}:`, avg);

      const courseFinished = await this.http
        .get<any>(`http://localhost:3000/course-classes/${group.courseClassId}`)
        .toPromise()
        .then(course => course.isFinished)
        .catch(() => false); // Fallback if error

      console.log(courseFinished);
      
      result.push({
        subjectCode,
        subjectName: group.subjectName,
        credit: group.credit,
        average: avg,
      });

      if (courseFinished && avg >= 5.0) {
        totalWeighted += avg * group.credit;
        totalCredits += group.credit;
        console.log(`🎓 Passed & Finished: +${group.credit} credits * ${avg} = ${(avg * group.credit).toFixed(2)}`);
      } else {
        console.log(`🚫 Not counted: Either not finished or failed.`);
      }
    }

    this.transcript = result;
    this.creditsCompleted = totalCredits;

    if (totalCredits > 0) {
      this.gpa = parseFloat((totalWeighted / totalCredits).toFixed(2));
      this.classification = this.getClassification(this.gpa);
      console.log('\n🏁 Final GPA:', this.gpa);
      console.log('📌 Classification:', this.classification);
    }
  }





  // Placeholder: you should load weight config from API ideally
  getWeight(subjectCode: string, scoreTypeId: string): number {
    const defaultWeights: { [key: string]: number } = {
      TX: 20,
      GK: 30,
      CK: 50
    };
    return defaultWeights[scoreTypeId] || 0;
  }

  calculateWeightedAverage(scores: ScoreEntry[]): number | null {
    let sum = 0;
    let totalWeight = 0;

    for (const entry of scores) {
      if (entry.score !== null && !isNaN(entry.score)) {
        sum += entry.score * (entry.weightPercent / 100);
        totalWeight += entry.weightPercent;
      }
    }

    return totalWeight > 0 ? parseFloat(sum.toFixed(2)) : null;
  }

  getClassification(score: number): string {
    if (score >= 9.0) return 'Xuất sắc';
    if (score >= 8.0) return 'Giỏi';
    if (score >= 6.5) return 'Khá';
    if (score >= 5.0) return 'Trung bình';
    return 'Yếu';

  }


  printTranscript(): void {
    window.print();
  }

  downloadPdf(): void {
    alert('📄 Chức năng tải PDF sẽ được phát triển sau.');
  }
}
