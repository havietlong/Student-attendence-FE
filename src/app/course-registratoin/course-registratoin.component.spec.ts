import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CourseRegistratoinComponent } from './course-registratoin.component';

describe('CourseRegistratoinComponent', () => {
  let component: CourseRegistratoinComponent;
  let fixture: ComponentFixture<CourseRegistratoinComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CourseRegistratoinComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CourseRegistratoinComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
