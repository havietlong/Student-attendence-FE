import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ManageCourseClassComponent } from './manage-course-class.component';

describe('ManageCourseClassComponent', () => {
  let component: ManageCourseClassComponent;
  let fixture: ComponentFixture<ManageCourseClassComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ManageCourseClassComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ManageCourseClassComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
