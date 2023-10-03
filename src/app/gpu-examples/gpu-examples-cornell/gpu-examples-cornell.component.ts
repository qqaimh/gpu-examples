import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import * as dat from 'dat.gui';
import Scene from './scene';
import Common from './common';
import Radiosity from './radiosity';
import Rasterizer from './rasterizer';
import Raytracer from './raytracer';
import Tonemapper from './tonemapper';

@Component({
  selector: 'gpu-examples-gpu-examples-cornell',
  templateUrl: './gpu-examples-cornell.component.html',
  styleUrls: ['./gpu-examples-cornell.component.scss']
})
export class GpuExamplesCornellComponent implements OnInit {
  @ViewChild('theCanvas', { static: true }) theCanvas!: ElementRef;

  gui: dat.GUI = new dat.GUI({ autoPlace: false });

  constructor(private ele: ElementRef) { }

  ngOnInit(): void {
    this.ele.nativeElement.appendChild(this.gui.domElement);
    this.draw();
  }

  async draw() {
    if (!this.theCanvas.nativeElement) return;

    const presentationFormat = navigator.gpu.getPreferredCanvasFormat();
    const requiredFeatures: GPUFeatureName[] =
      presentationFormat === 'bgra8unorm' ? ['bgra8unorm-storage'] : [];
    const adapter = await navigator.gpu.requestAdapter();
    for (const feature of requiredFeatures) {
      if (!adapter.features.has(feature)) {
        throw new Error(
          `sample requires ${feature}, but is not supported by the adapter`
        );
      }
    }
    const device = await adapter.requestDevice({ requiredFeatures });

    const params: {
      renderer: 'rasterizer' | 'raytracer';
      rotateCamera: boolean;
    } = {
      renderer: 'rasterizer',
      rotateCamera: true,
    };

    this.gui.add(params, 'renderer', ['rasterizer', 'raytracer']);
    this.gui.add(params, 'rotateCamera', true);

    this.theCanvas.nativeElement.width = this.theCanvas.nativeElement.clientWidth * devicePixelRatio;
    this.theCanvas.nativeElement.height = this.theCanvas.nativeElement.clientHeight * devicePixelRatio;

    const context = this.theCanvas.nativeElement.getContext('webgpu') as GPUCanvasContext;
    context.configure({
      device,
      format: presentationFormat,
      usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.STORAGE_BINDING,
      alphaMode: 'premultiplied',
    });

    const framebuffer = device.createTexture({
      label: 'framebuffer',
      size: [this.theCanvas.nativeElement.width, this.theCanvas.nativeElement.height],
      format: 'rgba16float',
      usage:
        GPUTextureUsage.RENDER_ATTACHMENT |
        GPUTextureUsage.STORAGE_BINDING |
        GPUTextureUsage.TEXTURE_BINDING,
    });

    const scene = new Scene(device);
    const common = new Common(device, scene.quadBuffer);
    const radiosity = new Radiosity(device, common, scene);
    const rasterizer = new Rasterizer(
      device,
      common,
      scene,
      radiosity,
      framebuffer
    );
    const raytracer = new Raytracer(device, common, radiosity, framebuffer);

    const frame = () => {
      if (!this.theCanvas.nativeElement) return;

      const canvasTexture = context.getCurrentTexture();
      const commandEncoder = device.createCommandEncoder();

      common.update({
        rotateCamera: params.rotateCamera,
        aspect: this.theCanvas.nativeElement.width / this.theCanvas.nativeElement.height,
      });
      radiosity.run(commandEncoder);

      switch (params.renderer) {
        case 'rasterizer': {
          rasterizer.run(commandEncoder);
          break;
        }
        case 'raytracer': {
          raytracer.run(commandEncoder);
          break;
        }
      }

      const tonemapper = new Tonemapper(
        device,
        common,
        framebuffer,
        canvasTexture
      );
      tonemapper.run(commandEncoder);

      device.queue.submit([commandEncoder.finish()]);

      requestAnimationFrame(frame);
    }

    requestAnimationFrame(frame);
  }
}
