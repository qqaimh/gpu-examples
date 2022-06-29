import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { GpuThinkerRoutingModule } from './gpu-thinker-routing.module';
import { GpuThinkerComponent } from './gpu-thinker.component';
import { SharedModule } from '../shared/shared.module';
import { GpuThinkerMethodDecoratorComponent } from './gpu-thinker-method-decorator/gpu-thinker-method-decorator.component';


@NgModule({
  declarations: [
    GpuThinkerComponent,
    GpuThinkerMethodDecoratorComponent
  ],
  imports: [
    CommonModule,
    GpuThinkerRoutingModule,
    SharedModule,
  ]
})
export class GpuThinkerModule { }
