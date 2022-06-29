import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GpuExamplesCubeMapComponent } from './gpu-examples-cube-map.component';

describe('GpuExamplesCubeMapComponent', () => {
  let component: GpuExamplesCubeMapComponent;
  let fixture: ComponentFixture<GpuExamplesCubeMapComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ GpuExamplesCubeMapComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GpuExamplesCubeMapComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
