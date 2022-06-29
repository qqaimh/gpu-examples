import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GpuNavigationComponent } from './gpu-navigation.component';

describe('GpuNavigationComponent', () => {
  let component: GpuNavigationComponent;
  let fixture: ComponentFixture<GpuNavigationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ GpuNavigationComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(GpuNavigationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
