import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GpuGltfComponent } from './gpu-gltf.component';

describe('GpuGltfComponent', () => {
  let component: GpuGltfComponent;
  let fixture: ComponentFixture<GpuGltfComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ GpuGltfComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GpuGltfComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
