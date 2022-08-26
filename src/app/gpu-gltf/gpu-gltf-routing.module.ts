import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { GpuGltfCameraComponent } from './gpu-gltf-camera/gpu-gltf-camera.component';
import { GpuGltfKtxComponent } from './gpu-gltf-ktx/gpu-gltf-ktx.component';
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
