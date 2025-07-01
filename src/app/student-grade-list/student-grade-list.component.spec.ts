import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StudentGradeListComponent } from './student-grade-list.component';

describe('StudentGradeListComponent', () => {
  let component: StudentGradeListComponent;
  let fixture: ComponentFixture<StudentGradeListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StudentGradeListComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(StudentGradeListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
