import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GpuExamplesSamplerParametersComponent } from './gpu-examples-sampler-parameters.component';

describe('GpuExamplesSamplerParametersComponent', () => {
  let component: GpuExamplesSamplerParametersComponent;
  let fixture: ComponentFixture<GpuExamplesSamplerParametersComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [GpuExamplesSamplerParametersComponent]
    });
    fixture = TestBed.createComponent(GpuExamplesSamplerParametersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
