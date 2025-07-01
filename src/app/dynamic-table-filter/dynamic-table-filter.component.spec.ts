import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DynamicTableFilterComponent } from './dynamic-table-filter.component';

describe('DynamicTableFilterComponent', () => {
  let component: DynamicTableFilterComponent;
  let fixture: ComponentFixture<DynamicTableFilterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DynamicTableFilterComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(DynamicTableFilterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
