import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GpuExamplesShadowMappingComponent } from './gpu-examples-shadow-mapping.component';

describe('GpuExamplesShadowMappingComponent', () => {
  let component: GpuExamplesShadowMappingComponent;
  let fixture: ComponentFixture<GpuExamplesShadowMappingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ GpuExamplesShadowMappingComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GpuExamplesShadowMappingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
