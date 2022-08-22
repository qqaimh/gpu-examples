import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';

import { GltfDemo } from './utils/gltf-demo';
import { GltfRenderer } from './utils/gltfRenderer';

@Component({
  selector: 'app-gpu-gltf-camera',
  templateUrl: './gpu-gltf-camera.component.html',
  styleUrls: ['./gpu-gltf-camera.component.scss']
})
export class GpuGltfCameraComponent implements OnInit {
  @ViewChild('theCanvas', { static: true }) theCanvas!: ElementRef;


  constructor() {
  }

  ngOnInit(): void {
    const demo = new GltfDemo(GltfRenderer);
  }

}