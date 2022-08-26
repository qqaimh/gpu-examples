import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GpuGltfKtxComponent } from './gpu-gltf-ktx.component';

describe('GpuGltfKtxComponent', () => {
  let component: GpuGltfKtxComponent;
  let fixture: ComponentFixture<GpuGltfKtxComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ GpuGltfKtxComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GpuGltfKtxComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
