import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GpuExamplesGameOfLifeComponent } from './gpu-examples-game-of-life.component';

describe('GpuExamplesGameOfLifeComponent', () => {
  let component: GpuExamplesGameOfLifeComponent;
  let fixture: ComponentFixture<GpuExamplesGameOfLifeComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [GpuExamplesGameOfLifeComponent]
    });
    fixture = TestBed.createComponent(GpuExamplesGameOfLifeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
