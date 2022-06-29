import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GpuExamplesComponent } from './gpu-examples.component';

describe('GpuExamplesComponent', () => {
  let component: GpuExamplesComponent;
  let fixture: ComponentFixture<GpuExamplesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ GpuExamplesComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(GpuExamplesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
