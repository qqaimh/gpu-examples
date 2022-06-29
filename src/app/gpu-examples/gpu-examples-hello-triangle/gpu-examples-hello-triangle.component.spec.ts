import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GpuExamplesHelloTriangleComponent } from './gpu-examples-hello-triangle.component';

describe('GpuExamplesHelloTriangleComponent', () => {
  let component: GpuExamplesHelloTriangleComponent;
  let fixture: ComponentFixture<GpuExamplesHelloTriangleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ GpuExamplesHelloTriangleComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(GpuExamplesHelloTriangleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
