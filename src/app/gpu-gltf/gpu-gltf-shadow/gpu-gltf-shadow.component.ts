import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';

import { Transform } from './engine/core/transform.js';
import { Camera } from './engine/core/camera.js';
import { PointLight, AmbientLight, DirectionalLight, ShadowCastingLight } from './engine/core/light.js';
import { Skybox } from './engine/core/skybox.js';

import { GltfLoader } from './engine/loaders/gltf.js';

import { FlyingControls, FlyingControlsSystem } from './engine/controls/flying-controls.js';

import { WebGPUWorld } from './engine/webgpu/webgpu-world.js';

import { WebGPUTextureDebugSystem, WebGPUDebugTextureView } from './engine/webgpu/webgpu-texture-debug.js';
import { WebGPUBloomSystem } from './engine/webgpu/webgpu-bloom.js';

import { WebGPUShadowSettings } from './engine/webgpu/webgpu-shadow.js';

import { vec3, quat } from 'gl-matrix';

import * as dat from 'dat.gui';
import Stats from 'stats.js';


@Component({
  selector: 'app-gpu-gltf-shadow',
  templateUrl: './gpu-gltf-shadow.component.html',
  styleUrls: ['./gpu-gltf-shadow.component.scss']
})
export class GpuGltfShadowComponent implements OnInit, AfterViewInit {
  @ViewChild('theCanvas', { static: true }) theCanvas!: ElementRef;
  @ViewChild('paneContainer', { static: true }) paneContainer!: ElementRef;

  constructor(private ele: ElementRef) {

  }

  async ngOnInit() {


  }

  ngAfterViewInit(): void {
    this.draw()
  }

  async draw() {
    const appSettings = {
      showShadowMap: false,
      depthBias: 5,
      depthBiasSlopeScale: 5,
      shadowMapResolution: 4096,
      cascadeCount: 3,
      visualizeCascades: false,
      lockFrustum: false,
      enableBloom: true,
    
      sunAngle: 0.5,
    };
    
    let gui = new dat.GUI();
    
    this.paneContainer.nativeElement.appendChild(gui.domElement);
    
    const stats = new Stats();
    this.paneContainer.nativeElement.appendChild(stats.dom);
    
    const canvas = document.querySelector('canvas');
    
    const world = new WebGPUWorld(canvas);
    world
      .registerSystem(FlyingControlsSystem)
    
    const renderer = await world.renderer();
    
    const gltfLoader = new GltfLoader(renderer);
    
    const projection = new Camera();
    projection.zNear = 0.25;
    projection.zFar = 64;
    
    const camera = world.create(
      new Transform({ position: [0, 2, 10] }),
      projection
    );
    
    const flyingControls = new FlyingControls();
    flyingControls.speed = 10;
    camera.add(flyingControls);
    
    // Add a skybox
    world.create(new Skybox(renderer['textureLoader'].fromUrl('../../../assets/shadow/textures/skybox/cube-basis-mipmap.ktx2')));
    
    const sunLightTransform = new Transform({ position: [0, 42, -42] });
    const sunTransformDistance = vec3.length(sunLightTransform.position);
    const sunDirectionalLight = new DirectionalLight({
      direction: vec3.normalize(vec3.create(), sunLightTransform.position),
      color: [1, 1, 0.4],
      intensity: 7
    });
    
    const shadowCastingLight = new ShadowCastingLight({
      width: 100, height: 60,
      textureSize: appSettings.shadowMapResolution,
      cascades: 3,
    });
    
    world.create(
      sunDirectionalLight,
      sunLightTransform,
      shadowCastingLight,
      new AmbientLight(0.02, 0.02, 0.01),
    );
    
    // Load a scene
    gltfLoader.instanceFromUrl(world, '../../../assets/shadow/models/city-set-draco.glb');
    
    gui.add(appSettings, 'showShadowMap').onChange(() => {
      world.query(WebGPUDebugTextureView).forEach((entity) => {
        entity.destroy();
      });
    
      if (appSettings.showShadowMap) {
        world.registerRenderSystem(WebGPUTextureDebugSystem);
        world.create(new WebGPUDebugTextureView(renderer['shadowDepthTexture']?.createView(), true));
      } else {
        world.removeSystem(WebGPUTextureDebugSystem);
      }
    });
    
    gui.add(appSettings, 'shadowMapResolution').options([
      512, 1024, 2048, 4096
    ]).onChange(() => {
      shadowCastingLight.textureSize = appSettings.shadowMapResolution;
    });
    
    const shadowSettings = world.singleton.get(WebGPUShadowSettings);
    shadowSettings.depthBias = appSettings.depthBias;
    shadowSettings.depthBiasSlopeScale = appSettings.depthBiasSlopeScale;
    
    gui.add(appSettings, 'depthBias').onChange(() => {
      shadowSettings.depthBias = appSettings.depthBias;
      shadowSettings.updated = true;
    });
    
    gui.add(appSettings, 'depthBiasSlopeScale').onChange(() => {
      shadowSettings.depthBiasSlopeScale = appSettings.depthBiasSlopeScale;
      shadowSettings.updated = true;
    });
    
    const cascadeCount = gui.add(appSettings, 'cascadeCount').min(0).max(4).step(1).onChange(() => {
      shadowCastingLight.cascades = appSettings.cascadeCount;
    });
    
    const visualizeCascades = gui.add(appSettings, 'visualizeCascades').onChange(() => {
      shadowCastingLight['visualizeCascades'] = appSettings.visualizeCascades;
    });
    
    const lockFrustum = gui.add(appSettings, 'lockFrustum').onChange(() => {
      shadowSettings.lockCascadeFrustum = appSettings.lockFrustum;
    });
    
    function updateSun() {
      sunLightTransform.position[0] = Math.sin(appSettings.sunAngle) * sunTransformDistance;
      sunLightTransform.position[2] = Math.cos(appSettings.sunAngle) * sunTransformDistance;
      vec3.normalize(sunDirectionalLight.direction, sunLightTransform.position);
    }
    gui.add(appSettings, 'sunAngle').min(0).max(Math.PI * 2).step(0.01).onChange(updateSun);
    updateSun();
    
    gui.add(appSettings, 'enableBloom').onChange(() => {
      if (appSettings.enableBloom) {
        world.registerRenderSystem(WebGPUBloomSystem);
      } else {
        world.removeSystem(WebGPUBloomSystem);
      }
    });
    
    function onFrame() {
      requestAnimationFrame(onFrame);
    
      stats.begin();
      world.execute();
      stats.end();
    }
    requestAnimationFrame(onFrame);
  }

}
