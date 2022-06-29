import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GpuExamplesParticlesComponent } from './gpu-examples-particles.component';

describe('GpuExamplesParticlesComponent', () => {
  let component: GpuExamplesParticlesComponent;
  let fixture: ComponentFixture<GpuExamplesParticlesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ GpuExamplesParticlesComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GpuExamplesParticlesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
