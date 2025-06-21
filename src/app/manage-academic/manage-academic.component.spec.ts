import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ManageAcademicComponent } from './manage-academic.component';

describe('ManageAcademicComponent', () => {
  let component: ManageAcademicComponent;
  let fixture: ComponentFixture<ManageAcademicComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ManageAcademicComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ManageAcademicComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
