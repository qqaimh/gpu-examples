import { AfterViewInit, Component, ElementRef, OnInit, Renderer2, ViewChild } from '@angular/core';

import * as dat from 'dat.gui';
import Stats from 'stats.js';

import { Gltf2Loader } from './js/mini-gltf2.js';
import { OrbitCamera } from './js/camera.js';

import { WebGPURenderer } from './js/webgpu-renderer/webgpu-renderer';

@Component({
  selector: 'app-gpu-gltf-metaballs',
  templateUrl: './gpu-gltf-metaballs.component.html',
  styleUrls: ['./gpu-gltf-metaballs.component.scss']
})
export class GpuGltfMetaballsComponent implements OnInit, AfterViewInit {
  @ViewChild('theCanvas', { static: true }) theCanvas!: ElementRef;
  @ViewChild('paneContainer', { static: true }) paneContainer!: ElementRef;

  constructor(private render: Renderer2) { }

  ngOnInit(): void {
  }

  ngAfterViewInit(): void {
    this.draw()
  }

  async draw() {
    let renderer = null;
      let gltf = null;

      const stats = new Stats();
      

      const camera = new OrbitCamera();
      camera.target = [0, 1, 0];
      camera.distance = 2.5;
      camera.orbitX = Math.PI * 0.1;
      camera.minOrbitX = Math.PI * -0.1;

      const appSettings = {
        scene: '../../../assets/metaballs/dungeon/dungeon.glb',
        metaballMethod: 'gpuGenerated',
        renderLightSprites: true,
        renderEnvironment: true,
        environmentLights: true,
        metaballLights: true,
        metaballStyle: 'lava',
        metaballResolution: 0.075
      };

      let gui = new dat.GUI();

      gui.add(appSettings, 'metaballMethod', {
        'writeBuffer()': 'writeBuffer',
        'New buffer each frame': 'newBuffer',
        'New staging buffer each frame': 'newStaging',
        'Single staging buffer re-mapped each frame': 'singleStaging',
        'Ring of staging buffers': 'stagingRing',
        'Compute shader': 'gpuGenerated',
        'Point Cloud': 'pointCloud'
      }).onChange(() => {
        if (renderer) {
          renderer.setMetaballMethod(appSettings.metaballMethod);
        }
      });

      let rendering = gui.addFolder('Rendering');

      rendering.add(appSettings, 'renderLightSprites').onChange(() => {
        if (renderer) {
          renderer.lightManager.render = appSettings.renderLightSprites;
        }
      });

      rendering.add(appSettings, 'renderEnvironment').onChange(() => {
        if (renderer) {
          renderer.renderEnvironment = appSettings.renderEnvironment;
        }
      });

      rendering.add(appSettings, 'environmentLights').onChange(() => {
        if (renderer) {
          renderer.enableLights(appSettings.environmentLights, appSettings.metaballLights);
        }
      });

      rendering.add(appSettings, 'metaballLights').onChange(() => {
        if (renderer) {
          renderer.enableLights(appSettings.environmentLights, appSettings.metaballLights);
        }
      });

      rendering.add(appSettings, 'metaballStyle', {
        lava: 'lava',
        water: 'water',
        slime: 'slime',
        none: 'none',
      }).onChange(() => {
        renderer.setMetaballStyle(appSettings.metaballStyle);
      });

      rendering.add(appSettings, 'metaballResolution', {
        low: 0.2,
        medium: 0.1,
        high: 0.075,
        ultra: 0.05,
        "CPU melting": 0.03,
      }).onChange(() => {
        renderer.setMetaballStep(appSettings.metaballResolution);
      });

      this.paneContainer.nativeElement.appendChild(gui.domElement);
      this.render.setStyle(stats.domElement, 'position','relative');
      this.render.setStyle(stats.domElement, 'margin-top','30px')
      this.paneContainer.nativeElement.appendChild(stats.domElement);

      const init = async() => {
        renderer = new WebGPURenderer(this.theCanvas.nativeElement);
       
        try {
          await renderer.init();
          renderer.setStats(stats);
          if (gltf) {
            await renderer.setScene(gltf);
          }
          renderer.camera = camera;
          camera.element = renderer.canvas;
          renderer.lightManager.lightCount = appSettings['lightCount'];
          renderer.updateLightRange(appSettings['maxLightRange']);
          renderer.lightManager.render = appSettings.renderLightSprites;
          renderer.renderEnvironment = appSettings.renderEnvironment;
          renderer.setMetaballStep(appSettings.metaballResolution);
          renderer.setMetaballStyle(appSettings.metaballStyle);
          renderer.setMetaballMethod(appSettings.metaballMethod);


          renderer.start();

          const gltfLoader = new Gltf2Loader();
          gltfLoader.loadFromUrl(appSettings.scene).then((gltf) => {
            renderer.setScene(gltf);
          });
        } catch (err) {
          console.error('renderer init failed', err);
          renderer.stop();
          renderer = null;
        }
      }
      init();
  }

}
