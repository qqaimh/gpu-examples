import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GpuOrillusionClusteredBallComponent } from './gpu-orillusion-clustered-ball.component';

describe('GpuOrillusionClusteredBallComponent', () => {
  let component: GpuOrillusionClusteredBallComponent;
  let fixture: ComponentFixture<GpuOrillusionClusteredBallComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [GpuOrillusionClusteredBallComponent]
    });
    fixture = TestBed.createComponent(GpuOrillusionClusteredBallComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
