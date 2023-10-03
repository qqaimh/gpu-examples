import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GpuExamplesWorkerComponent } from './gpu-examples-worker.component';

describe('GpuExamplesWorkerComponent', () => {
  let component: GpuExamplesWorkerComponent;
  let fixture: ComponentFixture<GpuExamplesWorkerComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [GpuExamplesWorkerComponent]
    });
    fixture = TestBed.createComponent(GpuExamplesWorkerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
