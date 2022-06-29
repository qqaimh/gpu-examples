import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { GpuThinkerMethodDecoratorComponent } from './gpu-thinker-method-decorator/gpu-thinker-method-decorator.component';
import { GpuThinkerComponent } from './gpu-thinker.component';

const routes: Routes = [
  {
    path: '',
    component: GpuThinkerComponent,
    children: [
      {
        path: 'method-decorator',
        component: GpuThinkerMethodDecoratorComponent
      },
      {
        path: '',
        redirectTo: 'method-decorator',
        pathMatch: 'full'
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class GpuThinkerRoutingModule { }
