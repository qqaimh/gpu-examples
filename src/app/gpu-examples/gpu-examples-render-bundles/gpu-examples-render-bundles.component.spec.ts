import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GpuExamplesRenderBundlesComponent } from './gpu-examples-render-bundles.component';

describe('GpuExamplesRenderBundlesComponent', () => {
  let component: GpuExamplesRenderBundlesComponent;
  let fixture: ComponentFixture<GpuExamplesRenderBundlesComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [GpuExamplesRenderBundlesComponent]
    });
    fixture = TestBed.createComponent(GpuExamplesRenderBundlesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
