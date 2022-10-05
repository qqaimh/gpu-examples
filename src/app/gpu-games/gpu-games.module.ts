import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { GpuGamesRoutingModule } from './gpu-games-routing.module';
import { GpuGamesComponent } from './gpu-games.component';
import { SharedModule } from '../shared/shared.module';
import { GpuGamesSpookyballComponent } from './gpu-games-spookyball/gpu-games-spookyball.component';


@NgModule({
  declarations: [
    GpuGamesComponent,
    GpuGamesSpookyballComponent
  ],
  imports: [
    CommonModule,
    GpuGamesRoutingModule,
    SharedModule,
  ]
})
export class GpuGamesModule { }
