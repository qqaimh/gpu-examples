import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GpuThinkerComponent } from './gpu-thinker.component';

describe('GpuThinkerComponent', () => {
  let component: GpuThinkerComponent;
  let fixture: ComponentFixture<GpuThinkerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ GpuThinkerComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(GpuThinkerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
