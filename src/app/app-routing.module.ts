import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: 'examples',
    loadChildren:() => import('./gpu-examples/gpu-examples.module').then(m => m.GpuExamplesModule)
  },
  {
    path: 'gltf',
    loadChildren:() => import('./gpu-gltf/gpu-gltf.module').then(m => m.GpuGltfModule)
  },
  {
    path: 'games',
    loadChildren:() => import('./gpu-games/gpu-games.module').then(m => m.GpuGamesModule)
  },
  {
    path: 'thinker',
    loadChildren:() => import('./gpu-thinker/gpu-thinker.module').then(m => m.GpuThinkerModule)
  },
  {
    path: '',
    redirectTo: 'examples',
    pathMatch: 'full'
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
