import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GpuExamplesImageBlurComponent } from './gpu-examples-image-blur.component';

describe('GpuExamplesImageBlurComponent', () => {
  let component: GpuExamplesImageBlurComponent;
  let fixture: ComponentFixture<GpuExamplesImageBlurComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ GpuExamplesImageBlurComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GpuExamplesImageBlurComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
