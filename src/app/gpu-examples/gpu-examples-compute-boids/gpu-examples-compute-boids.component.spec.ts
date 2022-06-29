import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GpuExamplesComputeBoidsComponent } from './gpu-examples-compute-boids.component';

describe('GpuExamplesComputeBoidsComponent', () => {
  let component: GpuExamplesComputeBoidsComponent;
  let fixture: ComponentFixture<GpuExamplesComputeBoidsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ GpuExamplesComputeBoidsComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GpuExamplesComputeBoidsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
