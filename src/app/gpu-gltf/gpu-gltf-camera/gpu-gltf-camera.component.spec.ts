import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GpuGltfCameraComponent } from './gpu-gltf-camera.component';

describe('GpuGltfCameraComponent', () => {
  let component: GpuGltfCameraComponent;
  let fixture: ComponentFixture<GpuGltfCameraComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ GpuGltfCameraComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GpuGltfCameraComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
