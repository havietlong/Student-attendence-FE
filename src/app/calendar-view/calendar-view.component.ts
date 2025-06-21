import { Component, HostListener, OnDestroy, OnInit, Renderer2 } from '@angular/core';
import { CalendarMonthModule, DateAdapter, CalendarUtils, CalendarA11y, CalendarDateFormatter, CalendarEventTitleFormatter, CalendarDayModule, CalendarEvent } from 'angular-calendar';
import { adapterFactory } from 'angular-calendar/date-adapters/date-fns';
import { CommonModule, DatePipe, formatDate } from '@angular/common';
import { SidebarComponent } from "../components/sidebar/sidebar.component";
import { CourseClassModalComponent } from "../modals/course-class-modal/course-class-modal.component";
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { subMonths, addMonths } from 'date-fns';
import { FormsModule } from '@angular/forms';


@Component({
  standalone: true,
  imports: [CommonModule, CalendarMonthModule, SidebarComponent, CourseClassModalComponent, CalendarDayModule, FormsModule],
  providers: [DatePipe,
    {
      provide: DateAdapter,
      useFactory: adapterFactory,
    },
    CalendarUtils,
    CalendarA11y,
    CalendarDateFormatter,
    CalendarEventTitleFormatter,

  ],
  selector: 'app-calendar-view',
  templateUrl: './calendar-view.component.html',
  styleUrl: './calendar-view.component.css',
})
export class CalendarViewComponent {
  onEventClick(eventData: { event: any; sourceEvent: MouseEvent | KeyboardEvent }) {
    const { event, sourceEvent } = eventData;

    if (!(sourceEvent instanceof MouseEvent)) return;

    sourceEvent.preventDefault();
    this.selectedSession = event;
    this.menuX = sourceEvent.clientX;
    this.menuY = sourceEvent.clientY;
    this.menuVisible = true;
  }


  private globalClickUnlistener!: () => void;
  refresh: Subject<void> = new Subject();
  searchedSession: number | null = null;
  viewDate: Date = new Date();
  showModal = false;
  selectedDate = new Date();
  events: any = [];
  showContextMenu = false;
  contextMenuPosition = { x: 0, y: 0 };
  contextMenuDate: Date | null = null;
  selectedCourseClassId: string = '';
  selectedSession: any;




  constructor(
    private http: HttpClient,
    private renderer: Renderer2,
    private route: ActivatedRoute,
    private datePipe: DatePipe,
    private router: Router,
  ) { }

  goToPreviousMonth(): void {
    this.viewDate = subMonths(this.viewDate, 1);
  }

  onSessionRightClick(event: MouseEvent, calendarEvent: any) {
    if (event.button !== 2) return; // Only right-click
    event.preventDefault();
    this.selectedSession = calendarEvent;
    this.menuX = event.clientX;
    this.menuY = event.clientY;
    this.menuVisible = true;
  }

  isValidDate(date: any): boolean {
    return date instanceof Date && !isNaN(date.getTime());
  }


  sessionNumber: number | null = null;
  sessionDate: Date | null = null;
  courseStartDate: string = ''; // Set this from your UI or backend
  courseDays: string[] = []; // E.g., ['1', '3'] for Mon and Wed


  findSessionDate() {
    if (!this.selectedCourseClassId || !this.sessionNumber || this.originalEvents.length === 0) {
      this.sessionDate = null;
      return;
    }

    const sessions = this.originalEvents
      .filter(s => s.courseClassId === this.selectedCourseClassId)
      .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());

    const session = sessions[this.sessionNumber - 1];

    console.log('📅 Resolved session date:', session);

    this.sessionDate = session ? new Date(session.start) : null;
  }


  goToStudentList(courseClassId: string, date: Date, classSessionId: any) {
    console.log(classSessionId);

    const formattedDate = formatDate(date, 'yyyy-MM-dd', 'en-US');

    this.router.navigate(['/studentList'], {
      queryParams: {
        courseClassId,
        date: formattedDate,
        classSessionId
      }
    });
  }



  goToNextMonth(): void {
    this.viewDate = addMonths(this.viewDate, 1);
  }

  view: 'month' | 'day' = 'day';

  ngOnDestroy(): void {
    if (this.globalClickUnlistener) {
      this.globalClickUnlistener();
    }
  }

  onMenuClick(action: string) {
    switch (action) {
      case 'View Details':
        if (this.contextMenuDate) {
          this.viewDate = this.contextMenuDate;
          this.view = 'day';
        }
        break;

      case 'Add Course':
        this.addCourse();
        break;

      case 'Set Exam Day':
        if (this.contextMenuDate) {
          this.setExamDayByDate(this.contextMenuDate);
        }
        break;
    }

    this.menuVisible = false;
  }


  setExamDayByDate(date: Date) {
    const targetDateStr = this.datePipe.transform(date, 'yyyy-MM-dd');

    // Use your existing logic to find the right session(s)
    const session = this.originalEvents.find(
      s => this.datePipe.transform(s.start, 'yyyy-MM-dd') === targetDateStr
    );

    console.log(session);


    if (!session) {
      alert('❌ No session found on this date.');
      return;
    }

    const url = `http://localhost:3000/class-session/${session.classSessionId}`;
    this.http.patch(url, { isExamDay: true }).subscribe({
      next: () => {
        alert('✅ Exam day has been set for this session!');
        this.refresh.next();
      },
      error: () => {
        alert('❌ Failed to mark session as exam day.');
      }
    });
  }









  getDateFromMouseEvent(event: MouseEvent): Date | null {
    const cell = (event.target as HTMLElement).closest('.cal-cell');
    if (!cell) return null;

    const top = cell.querySelector('.cal-cell-top');
    if (!top) return null;

    const aria = top.getAttribute('aria-label');
    if (!aria) return null;

    // Extract the part like "Wednesday June 18" from the aria-label
    const match = aria.match(/([A-Za-z]+)\s+([A-Za-z]+)\s+(\d{1,2})/);
    if (!match) return null;

    const [, , month, day] = match;
    const year = new Date().getFullYear(); // You might improve this for month transitions

    return new Date(`${month} ${day}, ${year}`);
  }



  viewDateDetails() {
    if (this.contextMenuDate) {
      alert(`Viewing details for: ${this.contextMenuDate.toDateString()}`);
      // or navigate/show a modal with info
    }
    this.showContextMenu = false;
  }

  addCourse() {
    if (this.contextMenuDate) {
      this.selectedDate = this.contextMenuDate;
      this.showModal = true;
    }
    this.showContextMenu = false;
  }

  ngOnInit(): void {
    if (typeof window !== 'undefined') {
      const lecturerData = localStorage.getItem('lecturer');
      const studentData = localStorage.getItem('student');

      const courseClassId = this.route.snapshot.paramMap.get('courseClassId');

      // Show context menu only once DOM is ready
      this.globalClickUnlistener = this.renderer.listen('document', 'click', () => {
        this.showContextMenu = false;
      });

      if (courseClassId) {
        this.view = 'month';
        this.fetchEvents(courseClassId);
      } else if (studentData) {
        const parsed = JSON.parse(studentData);
        this.fetchStudentCourses(parsed.studentId);
      } else if (lecturerData) {
        const parsed = JSON.parse(lecturerData);
        const lecturerId = parsed.lecturerId;
        this.fetchLecturerCourses(lecturerId);
      } else {
        this.fetchEvents(); // fallback
      }
    }
  }

  fetchLecturerCourses(lecturerId: string) {
    const url = `http://localhost:3000/course-classes/lecturer/${lecturerId}`;
    this.http.get<any[]>(url).subscribe(courseClasses => {
      const courseClassIds = courseClasses.map(cls => cls.courseClassId);
      const allEvents: any[] = [];

      courseClassIds.forEach(courseClassId => {
        this.http.get<any[]>(`http://localhost:3000/class-session/by-course-class/${courseClassId}`)
          .subscribe(data => {
            const events = data.map(item => this.mapSessionToEvent(item));
            allEvents.push(...events);
            this.events = allEvents;
            this.originalEvents = allEvents;
            this.courseClassIds = [...new Set(allEvents.map(e => e.courseClassId))];
            console.log(this.courseClassIds);

            this.filterEvents();
            this.refresh.next();
          });
      });
    });
  }


  goToToday(): void {
    this.viewDate = new Date();
  }

  fetchStudentCourses(studentId: string) {
    const url = `http://localhost:3000/course-classes/student/${studentId}`;
    this.http.get<any[]>(url).subscribe(courseClasses => {
      const courseClassIds = courseClasses.map(cls => cls.courseClassId);
      const allEvents: any[] = [];

      // Now call class sessions for each course class
      courseClassIds.forEach(courseClassId => {
        this.http.get<any[]>(`http://localhost:3000/class-session/by-course-class/${courseClassId}`).subscribe(data => {
          const events = data.map(item => this.mapSessionToEvent(item));
          allEvents.push(...events);
          this.events = allEvents;
          this.refresh.next();
        });
      });
    });
  }

  mapSessionToEvent(item: any): any {

    const baseDate = new Date(item.sessionDate);
    const startPeriod = item.startPeriod;
    const periodCount = item.periodCount;

    const periods: { [key: number]: { start: string; end: string } } = {
      1: { start: '07:00', end: '07:45' },
      2: { start: '07:50', end: '08:35' },
      3: { start: '08:40', end: '09:25' },
      4: { start: '09:35', end: '10:20' },
      5: { start: '10:25', end: '11:10' },
      6: { start: '11:15', end: '12:00' },
      7: { start: '12:45', end: '13:30' },
      8: { start: '13:35', end: '14:20' },
      9: { start: '14:25', end: '15:10' },
      10: { start: '15:20', end: '16:05' },
      11: { start: '16:10', end: '16:55' },
      12: { start: '17:00', end: '17:45' },
    };

    const start = periods[startPeriod].start;
    const endPeriod = startPeriod + periodCount - 1;
    const end = periods[endPeriod]?.end || periods[12].end;

    const [startH, startM] = start.split(':').map(Number);
    const [endH, endM] = end.split(':').map(Number);

    const startDate = new Date(baseDate);
    startDate.setHours(startH, startM, 0, 0);

    const endDate = new Date(baseDate);
    endDate.setHours(endH, endM, 0, 0);

    return {
      start: startDate,
      end: endDate,
      title: `${item.courseClass?.subject?.subjectName ?? 'Unknown Subject'} (${item.courseClass?.courseClassId ?? '---'}) - Phòng ${item.classroom} - Tiết ${startPeriod} ➜ ${endPeriod}`,
      allDay: false,
      courseClassId: item.courseClassId,
      classSessionId: item.id
    };
  }




  onDayClick(day: { date: Date }) {
    this.selectedDate = day.date;

    const clickedDateStr = this.selectedDate.toDateString();

    this.selectedSessions = this.originalEvents.filter(
      session => new Date(session.start).toDateString() === clickedDateStr
    );

    this.showModal = true;
    console.log(this.selectedSessions);
  }


  // getPeriodTime(period: number): { start: string; end: string } {
  //   const periods: { [key: number]: { start: string; end: string } } = {
  //     1: { start: '07:00', end: '07:45' },
  //     2: { start: '07:50', end: '08:35' },
  //     3: { start: '08:40', end: '09:25' },
  //     4: { start: '09:35', end: '10:20' },
  //     5: { start: '10:25', end: '11:10' },
  //     6: { start: '11:15', end: '12:00' },
  //     7: { start: '12:45', end: '13:30' },
  //     8: { start: '13:35', end: '14:20' },
  //     9: { start: '14:25', end: '15:10' },
  //     10: { start: '15:20', end: '16:05' },
  //     11: { start: '16:10', end: '16:55' },
  //     12: { start: '17:00', end: '17:45' },
  //   };
  //   return periods[period];
  // }


  closeModal() {
    this.showModal = false;
    this.refresh.next();
  }

  fetchEvents(courseClassId?: string) {
    let url = 'http://localhost:3000/class-session';

    if (courseClassId) {
      url = `http://localhost:3000/class-session/by-course-class/` + courseClassId; // assuming you support filtering server-side
    }

    this.http.get<any[]>(url).subscribe(data => {
      const processedEvents = data.map(item => {
        const baseDate = new Date(item.sessionDate);
        const startPeriod = item.startPeriod;
        const periodCount = item.periodCount;

        const periods: { [key: number]: { start: string; end: string } } = {
          1: { start: '07:00', end: '07:45' },
          2: { start: '07:50', end: '08:35' },
          3: { start: '08:40', end: '09:25' },
          4: { start: '09:35', end: '10:20' },
          5: { start: '10:25', end: '11:10' },
          6: { start: '11:15', end: '12:00' },
          7: { start: '12:45', end: '13:30' },
          8: { start: '13:35', end: '14:20' },
          9: { start: '14:25', end: '15:10' },
          10: { start: '15:20', end: '16:05' },
          11: { start: '16:10', end: '16:55' },
          12: { start: '17:00', end: '17:45' },
        };

        const start = periods[startPeriod].start;
        const endPeriod = startPeriod + periodCount - 1;
        const end = periods[endPeriod]?.end || periods[12].end;

        const [startH, startM] = start.split(':').map(Number);
        const [endH, endM] = end.split(':').map(Number);

        const startDate = new Date(baseDate);
        startDate.setHours(startH, startM, 0, 0);

        const endDate = new Date(baseDate);
        endDate.setHours(endH, endM, 0, 0);

        return {
          start: startDate,
          end: endDate,
          title: `${item.courseClass?.subject?.subjectName ?? 'Unknown Subject'} (${item.courseClass?.courseClassId ?? '---'}) - Phòng ${item.classroom} - Tiết ${startPeriod} ➜ ${endPeriod}`,
          allDay: false,
          courseClassId: item.courseClass?.courseClassId ?? '',
          classSessionId: item.id
        };
      });

      this.originalEvents = processedEvents;
      this.courseClassIds = [...new Set(processedEvents.map(e => e.courseClassId))];
      this.filterEvents();
    });

  }

  filterEvents() {
    if (!this.selectedCourseClassId) {
      this.events = this.originalEvents;
    } else {
      this.events = this.originalEvents.filter(
        e => e.courseClassId === this.selectedCourseClassId
      );
    }
  }



  courseClassIds: string[] = [];
  originalEvents: any[] = []; // store unfiltered events




  menuVisible = false;
  menuX = 0;
  menuY = 0;

  // Show context menu at mouse position
  onRightClick(event: MouseEvent) {
    event.preventDefault();
    this.menuX = event.clientX;
    this.menuY = event.clientY;
    this.menuVisible = true;

    const clickedDate = this.getDateFromMouseEvent(event); // ⛔ Might not work in day view
    if (clickedDate) {
      this.contextMenuDate = clickedDate;
    } else {
      // Fallback for day view
      this.contextMenuDate = this.viewDate;
    }

    console.log('📌 Right clicked date:', this.contextMenuDate);
  }


  // Hide menu on any click outside
  @HostListener('document:click')
  onDocumentClick() {
    this.menuVisible = false;
  }

  today: Date = new Date();

  toggleView() {
    this.view = this.view === 'month' ? 'day' : 'month';
  }

  prevPeriod() {
    const step = this.view === 'month' ? 1 : 1;
    this.viewDate = new Date(this.viewDate);
    this.viewDate.setDate(
      this.viewDate.getDate() - (this.view === 'month' ? 30 : 1)
    );
  }

  nextPeriod() {
    const step = this.view === 'month' ? 30 : 1;
    this.viewDate = new Date(this.viewDate);
    this.viewDate.setDate(
      this.viewDate.getDate() + (this.view === 'month' ? 30 : 1)
    );
  }

  openAddCourseModal() {
    this.selectedDate = new Date(); // Or whatever logic you want
    this.showModal = true;
  }

  selectedSessions: any[] = [];

  /** Called when a date is clicked on the small month view */
  onMiniCalendarDayClicked(date: Date) {
    this.viewDate = date;
    this.selectedDate = date;

    const dayStr = this.datePipe.transform(date, 'yyyy-MM-dd');

    // Filter events matching selected date
    this.selectedSessions = this.originalEvents.filter(event => {
      const eventDate = this.datePipe.transform(event.start, 'yyyy-MM-dd');
      return eventDate === dayStr;
    });
    console.log(this.selectedSessions);

  }

}
