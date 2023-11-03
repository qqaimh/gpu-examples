import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { GpuOrillusionComponent } from './gpu-orillusion.component';
import { GpuOrillusionClusteredBallComponent } from './gpu-orillusion-clustered-ball/gpu-orillusion-clustered-ball.component';

const routes: Routes = [
  {
    path: '',
    component: GpuOrillusionComponent,
    children: [
      {
        path: 'clusteredball',
        component: GpuOrillusionClusteredBallComponent
      },
      {
        path: '',
        redirectTo: 'clusteredball',
        pathMatch: 'full'
      }
    ]
  }
];


@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class GpuOrillusionRoutingModule { }