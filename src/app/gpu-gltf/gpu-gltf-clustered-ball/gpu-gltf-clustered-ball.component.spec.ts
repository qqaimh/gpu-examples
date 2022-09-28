import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GpuGltfClusteredBallComponent } from './gpu-gltf-clustered-ball.component';

describe('GpuGltfClusteredBallComponent', () => {
  let component: GpuGltfClusteredBallComponent;
  let fixture: ComponentFixture<GpuGltfClusteredBallComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ GpuGltfClusteredBallComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GpuGltfClusteredBallComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
