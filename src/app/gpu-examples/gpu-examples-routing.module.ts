import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { GpuExamplesAnimometerComponent } from './gpu-examples-animometer/gpu-examples-animometer.component';
import { GpuExamplesComputeBoidsComponent } from './gpu-examples-compute-boids/gpu-examples-compute-boids.component';
import { GpuExamplesCubeMapComponent } from './gpu-examples-cube-map/gpu-examples-cube-map.component';
import { GpuExamplesDeferredRenderingComponent } from './gpu-examples-deferred-rendering/gpu-examples-deferred-rendering.component';
import { GpuExamplesFractalCubeComponent } from './gpu-examples-fractal-cube/gpu-examples-fractal-cube.component';
import { GpuExamplesHelloTriangleMsaaComponent } from './gpu-examples-hello-triangle-msaa/gpu-examples-hello-triangle-msaa.component';
import { GpuExamplesHelloTriangleComponent } from './gpu-examples-hello-triangle/gpu-examples-hello-triangle.component';
import { GpuExamplesImageBlurComponent } from './gpu-examples-image-blur/gpu-examples-image-blur.component';
import { GpuExamplesInstancedCubeComponent } from './gpu-examples-instanced-cube/gpu-examples-instanced-cube.component';
import { GpuExamplesParticlesComponent } from './gpu-examples-particles/gpu-examples-particles.component';
import { GpuExamplesResizeCanvasComponent } from './gpu-examples-resize-canvas/gpu-examples-resize-canvas.component';
import { GpuExamplesReversedZComponent } from './gpu-examples-reversed-z/gpu-examples-reversed-z.component';
import { GpuExamplesRotatingCubeComponent } from './gpu-examples-rotating-cube/gpu-examples-rotating-cube.component';
import { GpuExamplesShadowMappingComponent } from './gpu-examples-shadow-mapping/gpu-examples-shadow-mapping.component';
import { GpuExamplesTextureCubeComponent } from './gpu-examples-texture-cube/gpu-examples-texture-cube.component';
import { GpuExamplesTwoCubesComponent } from './gpu-examples-two-cubes/gpu-examples-two-cubes.component';
import { GpuExamplesVideoUploadingComponent } from './gpu-examples-video-uploading/gpu-examples-video-uploading.component';
import { GpuExamplesComponent } from './gpu-examples.component';

const routes: Routes = [  
  {
    path: '',
    component: GpuExamplesComponent,
    children: [
      {
        path: 'hello-triangle',
        component: GpuExamplesHelloTriangleComponent
      },
      {
        path: 'hello-triangle-msaa',
        component: GpuExamplesHelloTriangleMsaaComponent
      },
      {
        path: 'resize-canvas',
        component: GpuExamplesResizeCanvasComponent
      },
      {
        path: 'rotating-cube',
        component: GpuExamplesRotatingCubeComponent
      },
      {
        path: 'two-cubes',
        component: GpuExamplesTwoCubesComponent
      },
      {
        path: 'texture-cube',
        component: GpuExamplesTextureCubeComponent
      },
      {
        path: 'instanced-cube',
        component: GpuExamplesInstancedCubeComponent
      },
      {
        path: 'fractal-cube',
        component: GpuExamplesFractalCubeComponent
      },
      {
        path: 'cube-map',
        component: GpuExamplesCubeMapComponent
      },
      {
        path: 'compute-boids',
        component: GpuExamplesComputeBoidsComponent
      },
      {
        path: 'animometer',
        component: GpuExamplesAnimometerComponent
      },
      {
        path: 'video-uploading',
        component: GpuExamplesVideoUploadingComponent
      },
      {
        path: 'image-blur',
        component: GpuExamplesImageBlurComponent
      },
      {
        path: 'shadow-mapping',
        component: GpuExamplesShadowMappingComponent
      },
      {
        path: 'reversed-z',
        component: GpuExamplesReversedZComponent
      },
      {
        path: 'deferred-rendering',
        component: GpuExamplesDeferredRenderingComponent
      },
      {
        path: 'particles',
        component: GpuExamplesParticlesComponent
      },
      {
        path: '',
        redirectTo: 'hello-triangle',
        pathMatch: 'full'
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class GpuExamplesRoutingModule { }
