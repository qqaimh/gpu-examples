import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { GpuGltfComponent } from './gpu-gltf.component';

const routes: Routes = [
  {
    path: '',
    component: GpuGltfComponent,
    children: []
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class GpuGltfRoutingModule { }
