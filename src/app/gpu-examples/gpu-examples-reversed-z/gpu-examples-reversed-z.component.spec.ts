import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GpuExamplesReversedZComponent } from './gpu-examples-reversed-z.component';

describe('GpuExamplesReversedZComponent', () => {
  let component: GpuExamplesReversedZComponent;
  let fixture: ComponentFixture<GpuExamplesReversedZComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ GpuExamplesReversedZComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GpuExamplesReversedZComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
