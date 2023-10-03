import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GpuExamplesCornellComponent } from './gpu-examples-cornell.component';

describe('GpuExamplesCornellComponent', () => {
  let component: GpuExamplesCornellComponent;
  let fixture: ComponentFixture<GpuExamplesCornellComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [GpuExamplesCornellComponent]
    });
    fixture = TestBed.createComponent(GpuExamplesCornellComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
