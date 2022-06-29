import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GpuThinkerMethodDecoratorComponent } from './gpu-thinker-method-decorator.component';

describe('GpuThinkerMethodDecoratorComponent', () => {
  let component: GpuThinkerMethodDecoratorComponent;
  let fixture: ComponentFixture<GpuThinkerMethodDecoratorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ GpuThinkerMethodDecoratorComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(GpuThinkerMethodDecoratorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
