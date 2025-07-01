import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AttendanceVisualizationComponent } from './attendance-visualization.component';

describe('AttendanceVisualizationComponent', () => {
  let component: AttendanceVisualizationComponent;
  let fixture: ComponentFixture<AttendanceVisualizationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AttendanceVisualizationComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AttendanceVisualizationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
