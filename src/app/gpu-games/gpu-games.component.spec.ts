import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GpuGamesComponent } from './gpu-games.component';

describe('GpuGamesComponent', () => {
  let component: GpuGamesComponent;
  let fixture: ComponentFixture<GpuGamesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ GpuGamesComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GpuGamesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
