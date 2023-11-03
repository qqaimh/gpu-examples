import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GpuOrillusionComponent } from './gpu-orillusion.component';

describe('GpuOrillusionComponent', () => {
  let component: GpuOrillusionComponent;
  let fixture: ComponentFixture<GpuOrillusionComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [GpuOrillusionComponent]
    });
    fixture = TestBed.createComponent(GpuOrillusionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
