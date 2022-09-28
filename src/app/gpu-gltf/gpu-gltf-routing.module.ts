import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { GpuGltfCameraComponent } from './gpu-gltf-camera/gpu-gltf-camera.component';
import { GpuGltfClusteredBallComponent } from './gpu-gltf-clustered-ball/gpu-gltf-clustered-ball.component';
import { GpuGltfKtxComponent } from './gpu-gltf-ktx/gpu-gltf-ktx.component';
import { GpuGltfMetaballsComponent } from './gpu-gltf-metaballs/gpu-gltf-metaballs.component';
import { GpuGltfShadowComponent } from './gpu-gltf-shadow/gpu-gltf-shadow.component';
import { GpuGltfComponent } from './gpu-gltf.component';

const routes: Routes = [
  {
    path: '',
    component: GpuGltfComponent,
    children: [
      {
        path: 'camera',
        component: GpuGltfCameraComponent
      },
      {
        path: 'shadow',
        component: GpuGltfShadowComponent
      },
      {
        path: 'ktx2',
        component: GpuGltfKtxComponent
      },
      {
        path: 'metaballs',
        component: GpuGltfMetaballsComponent
      },
      {
        path: 'clusteredball',
        component: GpuGltfClusteredBallComponent
      },
      {
        path: '',
        redirectTo: 'camera',
        pathMatch: 'full'
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class GpuGltfRoutingModule { }
