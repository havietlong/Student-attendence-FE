import { Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { StudentListComponent } from './student-list/student-list.component';
import { AddUsersComponent } from './add-users/add-users.component';
import { ManageAcademicComponent } from './manage-academic/manage-academic.component';
import { CalendarViewComponent } from './calendar-view/calendar-view.component';
import { StudentDashboardComponent } from './student/student-dashboard/student-dashboard.component';
import { CourseRegistratoinComponent } from './course-registratoin/course-registratoin.component';
import { ManageCourseClassComponent } from './manage-course-class/manage-course-class.component';
import { CourseDetailComponent } from './course-detail/course-detail.component';
import { StudentClassesComponent } from './student-classes/student-classes.component';
import { LecturerDashboardComponent } from './lecturer-dashboard/lecturer-dashboard.component';
import { GradeConfigComponent } from './grade-config/grade-config.component';
import { UserDetailComponent } from './user-detail/user-detail.component';

export const routes: Routes = [    
    { path: 'login', component: LoginComponent },
    { path: 'admin-dashboard', component: DashboardComponent },
    { path: 'studentList/:courseClassId', component: StudentListComponent },
    { path: 'studentList', component: StudentListComponent },
    { path: 'addStudent', component: AddUsersComponent },
    { path: 'addAcademics', component: ManageAcademicComponent },
    { path: 'calendar', component: CalendarViewComponent },
    { path: 'student-dashboard', component: StudentDashboardComponent },
    { path: 'course-registration', component: CourseRegistratoinComponent },
    { path: 'manage-course', component: ManageCourseClassComponent },
    { path: 'course-detail/course-classes/:subjectCode', component: CourseDetailComponent },
    { path: 'calendar/:courseClassId', component: CalendarViewComponent },
    { path: 'calendar/student/:studentId', component: CalendarViewComponent },
    { path: 'calendar/lecturer/:lecturerId', component: CalendarViewComponent },
    { path:'course-registered/:studentId',component:CourseRegistratoinComponent},
    { path: 'manage-course/:lecturerId', component: CourseDetailComponent },
    { path:'lecturer-dashboard', component:LecturerDashboardComponent},
    { path:'grade-config/:courseClassId', component:GradeConfigComponent},
    
    { path: 'student-profile/:studentId', component: UserDetailComponent },
];
