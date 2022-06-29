import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GpuHeadComponent } from './gpu-head.component';

describe('GpuHeadComponent', () => {
  let component: GpuHeadComponent;
  let fixture: ComponentFixture<GpuHeadComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ GpuHeadComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(GpuHeadComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
