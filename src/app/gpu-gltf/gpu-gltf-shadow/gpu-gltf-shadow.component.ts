import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';

import { Transform } from './engine/core/transform.js';
import { Camera } from './engine/core/camera.js';
import { PointLight, AmbientLight, DirectionalLight, ShadowCastingLight } from './engine/core/light.js';
import { Skybox } from './engine/core/skybox.js';
import { Mesh } from './engine/core/mesh.js';
import { BoundingVolume } from './engine/core/bounding-volume.js';

import { GltfLoader } from './engine/loaders/gltf.js';

import { FlyingControls, FlyingControlsSystem } from './engine/controls/flying-controls.js';

import { BoneVisualizerSystem } from './engine/debug/bone-visualizer.js';
import { BoundsVisualizerSystem } from './engine/debug/bounds-visualizer.js';

import { WebGPUWorld } from './engine/webgpu/webgpu-world.js';

import { BoxGeometry } from './engine/geometry/box.js';
import { PBRMaterial, UnlitMaterial } from './engine/core/materials.js';
import { WebGPULightSpriteSystem } from './engine/webgpu/webgpu-light-sprite.js';

import { WebGPUTextureDebugSystem, WebGPUDebugTextureView } from './engine/webgpu/webgpu-texture-debug.js';
import { WebGPUBloomSystem } from './engine/webgpu/webgpu-bloom.js';

import { WebGPUShadowSettings } from './engine/webgpu/webgpu-shadow.js';

import { BVH } from './engine/util/bvh.js';

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

  gui = new dat.GUI();
  stats = new Stats()

  appSettings = {
    showShadowMap: false,
    depthBias: 5,
    depthBiasSlopeScale: 5,
    shadowMapResolution: 4096,
    cascadeCount: 3,
    visualizeCascades: false,
    lockFrustum: false,
    enableBloom: true,
    visualizeBVH: false,
    bvhVisLevel: 0,

    sunAngle: 0.5,
  };
  sunLightTransform = new Transform({ position: [0, 42, -42] });
  sunTransformDistance = vec3.length(this.sunLightTransform.position);
  sunDirectionalLight = new DirectionalLight({
    direction: vec3.normalize(vec3.create(), this.sunLightTransform.position),
    color: [1, 1, 0.8],
    intensity: 7
  });

  constructor(private ele: ElementRef) {

  }

  async ngOnInit() {


  }

  ngAfterViewInit(): void {
    this.draw()
  }

  async draw() {
    document.body.appendChild(this.gui.domElement);

    document.body.appendChild(this.stats.dom);

    const canvas = document.querySelector('canvas');

    const world = new WebGPUWorld(canvas);
    world.registerSystem(FlyingControlsSystem);

    const renderer = await world.renderer();

    const gltfLoader = new GltfLoader(renderer);

    const bvh = new BVH();

    const projection = new Camera();
    projection.zNear = 0.25;
    projection.zFar = 128;

    const camera = world.create(
      new Transform({ position: [0, 2, 10] }),
      projection,
      bvh
    );

    const flyingControls = new FlyingControls();
    flyingControls.speed = 10;
    camera.add(flyingControls);

    // Add a skybox
    world.create(new Skybox(renderer.textureLoader.fromUrl('./media/textures/skybox/cube-basis-mipmap.ktx2')));



    const shadowCastingLight = new ShadowCastingLight({
      width: 100, height: 60,
      textureSize: this.appSettings.shadowMapResolution,
      cascades: 3,
    });

    world.create(
      this.sunDirectionalLight,
      this.sunLightTransform,
      shadowCastingLight,
      new AmbientLight(0.02, 0.02, 0.01),
    );

    // Load a scene
    gltfLoader.instanceFromUrl(world, './media/models/city-set-draco.glb', bvh);

    /*gltfLoader.instanceFromUrl(world, './media/models/new_sponza.glb', bvh);
    gltfLoader.instanceFromUrl(world, './media/models/new_sponza_ivy.glb', bvh);
    gltfLoader.instanceFromUrl(world, './media/models/new_sponza_curtains.glb', bvh);*/
    //gltfLoader.instanceFromUrl(world, './media/models/new_sponza_candles.glb', bvh);

    /*gltfLoader.fromUrl('./media/models/huge-battle-draco.glb').then(scene => {
          const gltfInstance = scene.createInstance(world, bvh);
          const transform = gltfInstance.get(Transform);
          transform.scale[0] = 150;
          transform.scale[1] = 150;
          transform.scale[2] = 150;
    
          world.create(bvh, new Transform({ scale: transform.scale }));
    });*/

    world.create();

    this.gui.add(this.appSettings, 'showShadowMap').onChange(() => {
      world.query(WebGPUDebugTextureView).forEach((entity) => {
        entity.destroy();
      });

      if (this.appSettings.showShadowMap) {
        world.registerRenderSystem(WebGPUTextureDebugSystem);
        world.create(new WebGPUDebugTextureView(renderer.shadowDepthTexture.createView(), true));
      } else {
        world.removeSystem(WebGPUTextureDebugSystem);
      }
    });

    this.gui.add(this.appSettings, 'shadowMapResolution').options([
      512, 1024, 2048, 4096
    ]).onChange(() => {
      shadowCastingLight.textureSize = this.appSettings.shadowMapResolution;
    });

    const shadowSettings = world.singleton.get(WebGPUShadowSettings);
    shadowSettings.depthBias = this.appSettings.depthBias;
    shadowSettings.depthBiasSlopeScale = this.appSettings.depthBiasSlopeScale;

    this.gui.add(this.appSettings, 'depthBias').onChange(() => {
      shadowSettings.depthBias = this.appSettings.depthBias;
      shadowSettings.updated = true;
    });

    this.gui.add(this.appSettings, 'depthBiasSlopeScale').onChange(() => {
      shadowSettings.depthBiasSlopeScale = this.appSettings.depthBiasSlopeScale;
      shadowSettings.updated = true;
    });

    this.gui.add(this.appSettings, 'cascadeCount').min(0).max(4).step(1).onChange(() => {
      shadowCastingLight.cascades = this.appSettings.cascadeCount;
    });

    this.gui.add(this.appSettings, 'visualizeCascades').onChange(() => {
      shadowCastingLight.visualizeCascades = this.appSettings.visualizeCascades;
    });

    /*this.gui.add(appSettings, 'visualizeBVH').onChange(() => {
      if (appSettings.visualizeBVH) {
        world.registerRenderSystem(BoundsVisualizerSystem);
      } else {
        world.removeSystem(BoundsVisualizerSystem);
      }
    });
    
    this.gui.add(appSettings, 'bvhVisLevel').min(-25).max(25).step(1).onChange(() => {
      bvh.visLevel = appSettings.bvhVisLevel;
    });*/

    this.gui.add(this.appSettings, 'lockFrustum').onChange(() => {
      shadowSettings.lockCascadeFrustum = this.appSettings.lockFrustum;
      projection.lockCullingFrustum = this.appSettings.lockFrustum;
    });

    const updateSun = () => {
      this.sunLightTransform.position[0] = Math.sin(this.appSettings.sunAngle) * this.sunTransformDistance;
      this.sunLightTransform.position[2] = Math.cos(this.appSettings.sunAngle) * this.sunTransformDistance;
      vec3.normalize(this.sunDirectionalLight.direction, this.sunLightTransform.position);
    }
    this.gui.add(this.appSettings, 'sunAngle').min(0).max(Math.PI * 2).step(0.01).onChange(updateSun);
    updateSun();

    this.gui.add(this.appSettings, 'enableBloom').onChange(() => {
      if (this.appSettings.enableBloom) {
        world.registerRenderSystem(WebGPUBloomSystem);
      } else {
        world.removeSystem(WebGPUBloomSystem);
      }
    });

    const onFrame = () => {
      requestAnimationFrame(onFrame);

      this.stats.begin();
      world.execute();
      this.stats.end();
    }
    requestAnimationFrame(onFrame);
  }

}
