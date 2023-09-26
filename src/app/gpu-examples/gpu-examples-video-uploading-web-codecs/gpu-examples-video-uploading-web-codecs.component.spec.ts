import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GpuExamplesVideoUploadingWebCodecsComponent } from './gpu-examples-video-uploading-web-codecs.component';

describe('GpuExamplesVideoUploadingWebCodecsComponent', () => {
  let component: GpuExamplesVideoUploadingWebCodecsComponent;
  let fixture: ComponentFixture<GpuExamplesVideoUploadingWebCodecsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [GpuExamplesVideoUploadingWebCodecsComponent]
    });
    fixture = TestBed.createComponent(GpuExamplesVideoUploadingWebCodecsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
