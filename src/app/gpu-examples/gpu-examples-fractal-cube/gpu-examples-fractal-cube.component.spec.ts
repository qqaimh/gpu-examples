import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GpuExamplesFractalCubeComponent } from './gpu-examples-fractal-cube.component';

describe('GpuExamplesFractalCubeComponent', () => {
  let component: GpuExamplesFractalCubeComponent;
  let fixture: ComponentFixture<GpuExamplesFractalCubeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ GpuExamplesFractalCubeComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GpuExamplesFractalCubeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
