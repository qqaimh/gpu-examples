import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GpuExamplesRotatingCubeComponent } from './gpu-examples-rotating-cube.component';

describe('GpuExamplesRotatingCubeComponent', () => {
  let component: GpuExamplesRotatingCubeComponent;
  let fixture: ComponentFixture<GpuExamplesRotatingCubeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ GpuExamplesRotatingCubeComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(GpuExamplesRotatingCubeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
