import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GpuNavigationComponent } from './gpu-navigation/gpu-navigation.component';
import { RouterModule } from '@angular/router';



@NgModule({
  declarations: [
    GpuNavigationComponent,
  ],
  exports: [
    GpuNavigationComponent
  ],
  imports: [
    CommonModule,
    RouterModule
  ]
})
export class SharedModule { }
