import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';

import * as dat from 'dat.gui';
import Stats from 'stats.js';

import { Gltf2Loader } from './js/mini-gltf2.js';
import { FlyingCamera } from './js/camera.js';

import { WebGL2Renderer } from './js/webgl2-renderer/webgl2-renderer.js';
import { WebGPURenderer } from './js/webgpu-renderer/webgpu-renderer.js';

@Component({
  selector: 'app-gpu-gltf-clustered-ball',
  templateUrl: './gpu-gltf-clustered-ball.component.html',
  styleUrls: ['./gpu-gltf-clustered-ball.component.scss']
})
export class GpuGltfClusteredBallComponent implements OnInit, AfterViewInit {
  @ViewChild('theCanvas', { static: true }) theCanvas!: ElementRef;
  @ViewChild('paneContainer', { static: true }) paneContainer!: ElementRef;

  constructor() { }

  ngOnInit(): void {
  }

  ngAfterViewInit(): void {
    this.draw()
  }

  draw() {
    let renderer = null;
    let gltf = null;

    const stats = new Stats();
    this.paneContainer.nativeElement.appendChild(stats.dom);

    const camera = new FlyingCamera();
    camera.position = [0, 1.5, 0];
    camera.rotateView(-Math.PI * 0.5, 0);

    const appSettings = {
      renderer: 'webGPU',
      output: 'clustered-forward',
      mesh: '../../../assets/sponza/sponza-ktx.glb',
      renderLightSprites: true,
      lightPattern: 'wandering',
      lightCount: 128,
      maxLightRange: 2,
    };

    const meshPaths = {
      'Sponza': '../../../assets/sponza/sponza.glb',
      'Sponza (Compressed Textures)': '../../../assets/sponza/sponza-ktx.glb',
    };

    let gui = new dat.GUI();

    

    gui.add(appSettings, 'output', {
      naiveForward: 'naive-forward',
      depth: 'depth',
      depthSlice: 'depth-slice',
      clusterDistance: 'cluster-distance',
      lightsPerCluster: 'lights-per-cluster',
      clusteredForward: 'clustered-forward',
    }).onChange(onOutputChange);

    gui.add(appSettings, 'mesh', meshPaths).onChange(initGltf);

    gui.add(appSettings, 'renderLightSprites').onChange(() => {
      if (renderer) {
        renderer.lightManager.render = appSettings.renderLightSprites;
      }
    });

    /*gui.add(appSettings, 'lightPattern', {
      wandering: 'wandering',
      grid: 'grid',
    }).onChange(onLightPatternChange);*/

    gui.add(appSettings, 'lightCount', 5, 1024).onFinishChange(() => {
      if (renderer) {
        renderer.lightManager.lightCount = appSettings.lightCount;
      }
    });

    gui.add(appSettings, 'maxLightRange', 0.1, 5).onFinishChange(() => {
      if (renderer) {
        renderer.updateLightRange(appSettings.maxLightRange);
      }
    });

    this.paneContainer.nativeElement.appendChild(gui.domElement);

    const onApiChange = async () => {
      let prevCanvas;
      if (renderer) {
        prevCanvas = renderer.canvas;
        renderer.stop();
        camera.element = null;
      }

      switch (appSettings.renderer) {
        case 'webGL2':
          renderer = new WebGL2Renderer(this.theCanvas.nativeElement as HTMLCanvasElement);
          break;
        case 'webGPU':
          renderer = new WebGPURenderer(this.theCanvas.nativeElement as HTMLCanvasElement);
          break;
        default:
          renderer = null;
          if (prevCanvas) {
            document.body.removeChild(prevCanvas);
          }
          break;
      }

      if (renderer) {
        try {
          await renderer.init();
          renderer.setStats(stats);
          if (gltf) {
            await renderer.setGltf(gltf);
          }
          renderer.camera = camera;
          // if (prevCanvas) {
          //   document.body.removeChild(prevCanvas);
          // }
          // document.body.appendChild(renderer.canvas);
          camera.element = renderer.canvas;
          renderer.lightManager.lightCount = appSettings.lightCount;
          renderer.updateLightRange(appSettings.maxLightRange);
          renderer.lightManager.render = appSettings.renderLightSprites;

          onOutputChange();

          renderer.start();
        } catch (err) {
          console.error('renderer init failed', err);
          renderer.stop();
          renderer = null;
        }
      }
    }
    
    gui.add(appSettings, 'renderer', {
      webGL2: 'webGL2',
      webGPU: 'webGPU'
    }).onChange(onApiChange);

    onApiChange();

    function onOutputChange() {
      if (renderer) {
        renderer.setOutputType(appSettings.output);
      }
    }

    function onLightPatternChange() {
      if (renderer) {
        renderer.onLightPatternChange(appSettings.lightPattern);
      }
    }

    async function initGltf() {
      const gltfLoader = new Gltf2Loader();
      gltf = await gltfLoader.loadFromUrl(appSettings.mesh);
      if (renderer) {
        renderer.setGltf(gltf);
      }
    }
    initGltf();

  }

}
