import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GpuExamplesCamerasComponent } from './gpu-examples-cameras.component';

describe('GpuExamplesCamerasComponent', () => {
  let component: GpuExamplesCamerasComponent;
  let fixture: ComponentFixture<GpuExamplesCamerasComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [GpuExamplesCamerasComponent]
    });
    fixture = TestBed.createComponent(GpuExamplesCamerasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
