import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { GpuExamplesRoutingModule } from './gpu-examples-routing.module';
import { GpuExamplesComponent } from './gpu-examples.component';
import { GpuExamplesHelloTriangleComponent } from './gpu-examples-hello-triangle/gpu-examples-hello-triangle.component';
import { GpuExamplesHelloTriangleMsaaComponent } from './gpu-examples-hello-triangle-msaa/gpu-examples-hello-triangle-msaa.component';
import { GpuExamplesResizeCanvasComponent } from './gpu-examples-resize-canvas/gpu-examples-resize-canvas.component';
import { GpuExamplesRotatingCubeComponent } from './gpu-examples-rotating-cube/gpu-examples-rotating-cube.component';
import { GpuExamplesTwoCubesComponent } from './gpu-examples-two-cubes/gpu-examples-two-cubes.component';
import { GpuExamplesTextureCubeComponent } from './gpu-examples-texture-cube/gpu-examples-texture-cube.component';
import { SharedModule } from '../shared/shared.module';
import { GpuExamplesInstancedCubeComponent } from './gpu-examples-instanced-cube/gpu-examples-instanced-cube.component';
import { GpuExamplesFractalCubeComponent } from './gpu-examples-fractal-cube/gpu-examples-fractal-cube.component';
import { GpuExamplesCubeMapComponent } from './gpu-examples-cube-map/gpu-examples-cube-map.component';
import { GpuExamplesComputeBoidsComponent } from './gpu-examples-compute-boids/gpu-examples-compute-boids.component';
import { GpuExamplesAnimometerComponent } from './gpu-examples-animometer/gpu-examples-animometer.component';
import { GpuExamplesVideoUploadingComponent } from './gpu-examples-video-uploading/gpu-examples-video-uploading.component';
import { GpuExamplesImageBlurComponent } from './gpu-examples-image-blur/gpu-examples-image-blur.component';
import { GpuExamplesShadowMappingComponent } from './gpu-examples-shadow-mapping/gpu-examples-shadow-mapping.component';
import { GpuExamplesReversedZComponent } from './gpu-examples-reversed-z/gpu-examples-reversed-z.component';
import { GpuExamplesDeferredRenderingComponent } from './gpu-examples-deferred-rendering/gpu-examples-deferred-rendering.component';
import { GpuExamplesParticlesComponent } from './gpu-examples-particles/gpu-examples-particles.component';
import { GpuExamplesVideoUploadingWebCodecsComponent } from './gpu-examples-video-uploading-web-codecs/gpu-examples-video-uploading-web-codecs.component';
import { GpuExamplesCamerasComponent } from './gpu-examples-cameras/gpu-examples-cameras.component';
import { GpuExamplesABufferComponent } from './gpu-examples-abuffer/gpu-examples-abuffer.component';
import { GpuExamplesWorkerComponent } from './gpu-examples-worker/gpu-examples-worker.component';
import { GpuExamplesRenderBundlesComponent } from './gpu-examples-render-bundles/gpu-examples-render-bundles.component';
import { GpuExamplesSamplerParametersComponent } from './gpu-examples-sampler-parameters/gpu-examples-sampler-parameters.component';
import { GpuExamplesCornellComponent } from './gpu-examples-cornell/gpu-examples-cornell.component';
import { GpuExamplesGameOfLifeComponent } from './gpu-examples-game-of-life/gpu-examples-game-of-life.component';


@NgModule({
  declarations: [
    GpuExamplesComponent,
    GpuExamplesHelloTriangleComponent,
    GpuExamplesHelloTriangleMsaaComponent,
    GpuExamplesResizeCanvasComponent,
    GpuExamplesRotatingCubeComponent,
    GpuExamplesTwoCubesComponent,
    GpuExamplesTextureCubeComponent,
    GpuExamplesInstancedCubeComponent,
    GpuExamplesFractalCubeComponent,
    GpuExamplesCubeMapComponent,
    GpuExamplesComputeBoidsComponent,
    GpuExamplesAnimometerComponent,
    GpuExamplesVideoUploadingComponent,
    GpuExamplesImageBlurComponent,
    GpuExamplesShadowMappingComponent,
    GpuExamplesReversedZComponent,
    GpuExamplesDeferredRenderingComponent,
    GpuExamplesParticlesComponent,
    GpuExamplesVideoUploadingWebCodecsComponent,
    GpuExamplesCamerasComponent,
    GpuExamplesABufferComponent,
    GpuExamplesWorkerComponent,
    GpuExamplesRenderBundlesComponent,
    GpuExamplesSamplerParametersComponent,
    GpuExamplesCornellComponent,
    GpuExamplesGameOfLifeComponent
  ],
  imports: [
    CommonModule,
    GpuExamplesRoutingModule,
    SharedModule,
  ]
})
export class GpuExamplesModule { }
