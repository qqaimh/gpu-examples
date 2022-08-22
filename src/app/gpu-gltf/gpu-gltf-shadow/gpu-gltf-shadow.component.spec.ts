import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GpuGltfShadowComponent } from './gpu-gltf-shadow.component';

describe('GpuGltfShadowComponent', () => {
  let component: GpuGltfShadowComponent;
  let fixture: ComponentFixture<GpuGltfShadowComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ GpuGltfShadowComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GpuGltfShadowComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
