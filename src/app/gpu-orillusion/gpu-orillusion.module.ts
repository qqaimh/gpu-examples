import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GpuOrillusionComponent } from './gpu-orillusion.component';
import { GpuOrillusionRoutingModule } from './gpu-orillusion-routing.module';
import { GpuOrillusionClusteredBallComponent } from './gpu-orillusion-clustered-ball/gpu-orillusion-clustered-ball.component';
import { SharedModule } from '../shared/shared.module';



@NgModule({
  declarations: [
    GpuOrillusionComponent,
    GpuOrillusionClusteredBallComponent
  ],
  imports: [
    CommonModule,
    GpuOrillusionRoutingModule,
    SharedModule,
  ]
})
export class GpuOrillusionModule { }
