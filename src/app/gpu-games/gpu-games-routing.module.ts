import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { GpuGamesSpookyballComponent } from './gpu-games-spookyball/gpu-games-spookyball.component';
import { GpuGamesComponent } from './gpu-games.component';

const routes: Routes = [
  {
    path: '',
    component: GpuGamesComponent,
    children: [
      {
        path: 'spookyball',
        component: GpuGamesSpookyballComponent
      },
      {
        path: '',
        redirectTo: 'spookyball',
        pathMatch: 'full'
      }
    ]
  }
];


@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class GpuGamesRoutingModule { }
