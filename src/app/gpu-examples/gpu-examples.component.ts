import { Component, OnInit } from '@angular/core';
import { GpuNavigationModel } from '../shared/models';

@Component({
  selector: 'app-gpu-examples',
  templateUrl: './gpu-examples.component.html',
  styleUrls: ['./gpu-examples.component.scss']
})
export class GpuExamplesComponent implements OnInit {
  gpuNavigations: GpuNavigationModel[] = [
    {
      name: 'HelloTriangle',
      url: './hello-triangle',
    },
    {
      name: 'HelloTriangleMsaa',
      url: './hello-triangle-msaa',
    },
    {
      name: 'resizeCanvas',
      url: './resize-canvas',
    },
    {
      name: 'rotatingCube',
      url: './rotating-cube',
    },
    {
      name: 'twoCubes',
      url: './two-cubes',
    },
    {
      name: 'textureCube',
      url: './texture-cube',
    },
    {
      name: 'instancedCube',
      url: './instanced-cube',
    },
    {
      name: 'fractalCube',
      url: './fractal-cube',
    },
    {
      name: 'cubeMap',
      url: './cube-map',
    },
    {
      name: 'computeBoids',
      url: './compute-boids',
    },
    {
      name: 'animometer',
      url: './animometer',
    },
    {
      name: 'videoUploading',
      url: './video-uploading',
    },
    {
      name: 'imageBlur',
      url: './image-blur',
    },
    {
      name: 'shadowMapping',
      url: './shadow-mapping',
    },
    {
      name: 'reversedZ',
      url: './reversed-z',
    },
    {
      name: 'deferredRendering',
      url: './deferred-rendering',
    },
    {
      name: 'particles',
      url: './particles',
    },
  ];

  constructor() { }

  ngOnInit(): void {
  }

}
