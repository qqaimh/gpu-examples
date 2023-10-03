import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GpuExamplesABufferComponent } from './gpu-examples-abuffer.component';

describe('GpuExamplesABufferComponent', () => {
  let component: GpuExamplesABufferComponent;
  let fixture: ComponentFixture<GpuExamplesABufferComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [GpuExamplesABufferComponent]
    });
    fixture = TestBed.createComponent(GpuExamplesABufferComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
