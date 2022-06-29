import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GpuExamplesHelloTriangleMsaaComponent } from './gpu-examples-hello-triangle-msaa.component';

describe('GpuExamplesHelloTriangleMsaaComponent', () => {
  let component: GpuExamplesHelloTriangleMsaaComponent;
  let fixture: ComponentFixture<GpuExamplesHelloTriangleMsaaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ GpuExamplesHelloTriangleMsaaComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(GpuExamplesHelloTriangleMsaaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
