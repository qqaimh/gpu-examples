import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GpuExamplesTwoCubesComponent } from './gpu-examples-two-cubes.component';

describe('GpuExamplesTwoCubesComponent', () => {
  let component: GpuExamplesTwoCubesComponent;
  let fixture: ComponentFixture<GpuExamplesTwoCubesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ GpuExamplesTwoCubesComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(GpuExamplesTwoCubesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
