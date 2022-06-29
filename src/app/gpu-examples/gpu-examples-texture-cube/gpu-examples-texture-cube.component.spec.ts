import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GpuExamplesTextureCubeComponent } from './gpu-examples-texture-cube.component';

describe('GpuExamplesTextureCubeComponent', () => {
  let component: GpuExamplesTextureCubeComponent;
  let fixture: ComponentFixture<GpuExamplesTextureCubeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ GpuExamplesTextureCubeComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(GpuExamplesTextureCubeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
