import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GpuGltfMetaballsComponent } from './gpu-gltf-metaballs.component';

describe('GpuGltfMetaballsComponent', () => {
  let component: GpuGltfMetaballsComponent;
  let fixture: ComponentFixture<GpuGltfMetaballsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ GpuGltfMetaballsComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GpuGltfMetaballsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
