import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GpuGamesSpookyballComponent } from './gpu-games-spookyball.component';

describe('GpuGamesSpookyballComponent', () => {
  let component: GpuGamesSpookyballComponent;
  let fixture: ComponentFixture<GpuGamesSpookyballComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ GpuGamesSpookyballComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GpuGamesSpookyballComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
