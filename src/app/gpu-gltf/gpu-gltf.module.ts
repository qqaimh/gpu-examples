import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { GpuGltfRoutingModule } from './gpu-gltf-routing.module';
import { GpuGltfComponent } from './gpu-gltf.component';
import { SharedModule } from '../shared/shared.module';


@NgModule({
  declarations: [
    GpuGltfComponent
  ],
  imports: [
    CommonModule,
    GpuGltfRoutingModule,
    SharedModule,
  ]
})
export class GpuGltfModule { }
