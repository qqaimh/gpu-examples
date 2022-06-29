import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GpuExamplesInstancedCubeComponent } from './gpu-examples-instanced-cube.component';

describe('GpuExamplesInstancedCubeComponent', () => {
  let component: GpuExamplesInstancedCubeComponent;
  let fixture: ComponentFixture<GpuExamplesInstancedCubeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ GpuExamplesInstancedCubeComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(GpuExamplesInstancedCubeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
