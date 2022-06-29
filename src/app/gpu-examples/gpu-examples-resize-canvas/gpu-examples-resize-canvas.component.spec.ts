import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GpuExamplesResizeCanvasComponent } from './gpu-examples-resize-canvas.component';

describe('GpuExamplesResizeCanvasComponent', () => {
  let component: GpuExamplesResizeCanvasComponent;
  let fixture: ComponentFixture<GpuExamplesResizeCanvasComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ GpuExamplesResizeCanvasComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(GpuExamplesResizeCanvasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
