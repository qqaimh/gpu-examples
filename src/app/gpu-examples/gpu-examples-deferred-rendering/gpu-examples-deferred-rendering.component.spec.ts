import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GpuExamplesDeferredRenderingComponent } from './gpu-examples-deferred-rendering.component';

describe('GpuExamplesDeferredRenderingComponent', () => {
  let component: GpuExamplesDeferredRenderingComponent;
  let fixture: ComponentFixture<GpuExamplesDeferredRenderingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ GpuExamplesDeferredRenderingComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GpuExamplesDeferredRenderingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
