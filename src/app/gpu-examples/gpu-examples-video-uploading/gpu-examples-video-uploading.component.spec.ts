import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GpuExamplesVideoUploadingComponent } from './gpu-examples-video-uploading.component';

describe('GpuExamplesVideoUploadingComponent', () => {
  let component: GpuExamplesVideoUploadingComponent;
  let fixture: ComponentFixture<GpuExamplesVideoUploadingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ GpuExamplesVideoUploadingComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GpuExamplesVideoUploadingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
