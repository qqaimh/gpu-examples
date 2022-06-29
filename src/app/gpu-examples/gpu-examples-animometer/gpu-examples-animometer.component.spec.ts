import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GpuExamplesAnimometerComponent } from './gpu-examples-animometer.component';

describe('GpuExamplesAnimometerComponent', () => {
  let component: GpuExamplesAnimometerComponent;
  let fixture: ComponentFixture<GpuExamplesAnimometerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ GpuExamplesAnimometerComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GpuExamplesAnimometerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
