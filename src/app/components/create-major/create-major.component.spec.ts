import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateMajorComponent } from './create-major.component';

describe('CreateMajorComponent', () => {
  let component: CreateMajorComponent;
  let fixture: ComponentFixture<CreateMajorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateMajorComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CreateMajorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
