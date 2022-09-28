import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { GpuGltfRoutingModule } from './gpu-gltf-routing.module';
import { GpuGltfComponent } from './gpu-gltf.component';
import { SharedModule } from '../shared/shared.module';
import { GpuGltfCameraComponent } from './gpu-gltf-camera/gpu-gltf-camera.component';
import { GpuGltfShadowComponent } from './gpu-gltf-shadow/gpu-gltf-shadow.component';
import { GpuGltfKtxComponent } from './gpu-gltf-ktx/gpu-gltf-ktx.component';
import { GpuGltfMetaballsComponent } from './gpu-gltf-metaballs/gpu-gltf-metaballs.component';
import { GpuGltfClusteredBallComponent } from './gpu-gltf-clustered-ball/gpu-gltf-clustered-ball.component';


@NgModule({
  declarations: [
    GpuGltfComponent,
    GpuGltfCameraComponent,
    GpuGltfShadowComponent,
    GpuGltfKtxComponent,
    GpuGltfMetaballsComponent,
    GpuGltfClusteredBallComponent
  ],
  imports: [
    CommonModule,
    GpuGltfRoutingModule,
    SharedModule,
  ]
})
export class GpuGltfModule { }
