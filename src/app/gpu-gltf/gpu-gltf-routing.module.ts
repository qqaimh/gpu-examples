import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { GpuGltfCameraComponent } from './gpu-gltf-camera/gpu-gltf-camera.component';
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
