import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';

import * as dat from 'dat.gui';
import blurWGSL from './shaders/blur.wgsl';
import fullscreenTexturedQuadWGSL from './shaders/fullscreenTexturedQuad.wgsl';

// Contants from the blur.wgsl shader.
const tileDim = 128;
const batch = [4, 4];

@Component({
  selector: 'app-gpu-examples-image-blur',
  templateUrl: './gpu-examples-image-blur.component.html',
  styleUrls: ['./gpu-examples-image-blur.component.scss']
})
export class GpuExamplesImageBlurComponent implements OnInit {
  @ViewChild('theCanvas', {static: true}) theCanvas!: ElementRef;

  gui: dat.GUI  = new dat.GUI({ autoPlace: false });

  constructor(private ele: ElementRef) { }

  ngOnInit(): void {
    this.ele.nativeElement.appendChild(this.gui.domElement);
    this.draw();
  }

  // This example shows how to blur an image using a WebGPU compute shader.
  async draw() {
    const adapter = await navigator.gpu.requestAdapter();
    const device = await adapter.requestDevice();

    if (!this.theCanvas.nativeElement) return;
    const context = this.theCanvas.nativeElement.getContext('webgpu');

    const devicePixelRatio = window.devicePixelRatio || 1;
    const presentationSize = [
      this.theCanvas.nativeElement.clientWidth * devicePixelRatio,
      this.theCanvas.nativeElement.clientHeight * devicePixelRatio,
    ];
    const presentationFormat = context.getPreferredFormat(adapter);

    context.configure({
      device,
      format: presentationFormat,
      size: presentationSize,
    });

    const blurPipeline = device.createComputePipeline({
      compute: {
        module: device.createShaderModule({
          code: blurWGSL,
        }),
        entryPoint: 'main',
      },
      layout: undefined
    });

    const fullscreenQuadPipeline = device.createRenderPipeline({
      vertex: {
        module: device.createShaderModule({
          code: fullscreenTexturedQuadWGSL,
        }),
        entryPoint: 'vert_main',
      },
      fragment: {
        module: device.createShaderModule({
          code: fullscreenTexturedQuadWGSL,
        }),
        entryPoint: 'frag_main',
        targets: [
          {
            format: presentationFormat,
          },
        ],
      },
      primitive: {
        topology: 'triangle-list',
      },
      layout: undefined
    });

    const sampler = device.createSampler({
      magFilter: 'linear',
      minFilter: 'linear',
    });

    const img = document.createElement('img');
    img.src = '../../assets/img/Di-3d.png';
    await img.decode();
    const imageBitmap = await createImageBitmap(img);

    const [srcWidth, srcHeight] = [imageBitmap.width, imageBitmap.height];
    const cubeTexture = device.createTexture({
      size: [srcWidth, srcHeight, 1],
      format: 'rgba8unorm',
      usage:
        GPUTextureUsage.TEXTURE_BINDING |
        GPUTextureUsage.COPY_DST |
        GPUTextureUsage.RENDER_ATTACHMENT,
    });
    device.queue.copyExternalImageToTexture(
      { source: imageBitmap },
      { texture: cubeTexture },
      [imageBitmap.width, imageBitmap.height]
    );

    const textures = [0, 1].map(() => {
      return device.createTexture({
        size: {
          width: srcWidth,
          height: srcHeight,
        },
        format: 'rgba8unorm',
        usage:
          GPUTextureUsage.COPY_DST |
          GPUTextureUsage.STORAGE_BINDING |
          GPUTextureUsage.TEXTURE_BINDING,
      });
    });

    const buffer0 = (() => {
      const buffer = device.createBuffer({
        size: 4,
        mappedAtCreation: true,
        usage: GPUBufferUsage.UNIFORM,
      });
      new Uint32Array(buffer.getMappedRange())[0] = 0;
      buffer.unmap();
      return buffer;
    })();

    const buffer1 = (() => {
      const buffer = device.createBuffer({
        size: 4,
        mappedAtCreation: true,
        usage: GPUBufferUsage.UNIFORM,
      });
      new Uint32Array(buffer.getMappedRange())[0] = 1;
      buffer.unmap();
      return buffer;
    })();

    const blurParamsBuffer = device.createBuffer({
      size: 8,
      usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.UNIFORM,
    });

    const computeConstants = device.createBindGroup({
      layout: blurPipeline.getBindGroupLayout(0),
      entries: [
        {
          binding: 0,
          resource: sampler,
        },
        {
          binding: 1,
          resource: {
            buffer: blurParamsBuffer,
          },
        },
      ],
    });

    const computeBindGroup0 = device.createBindGroup({
      layout: blurPipeline.getBindGroupLayout(1),
      entries: [
        {
          binding: 1,
          resource: cubeTexture.createView(),
        },
        {
          binding: 2,
          resource: textures[0].createView(),
        },
        {
          binding: 3,
          resource: {
            buffer: buffer0,
          },
        },
      ],
    });

    const computeBindGroup1 = device.createBindGroup({
      layout: blurPipeline.getBindGroupLayout(1),
      entries: [
        {
          binding: 1,
          resource: textures[0].createView(),
        },
        {
          binding: 2,
          resource: textures[1].createView(),
        },
        {
          binding: 3,
          resource: {
            buffer: buffer1,
          },
        },
      ],
    });

    const computeBindGroup2 = device.createBindGroup({
      layout: blurPipeline.getBindGroupLayout(1),
      entries: [
        {
          binding: 1,
          resource: textures[1].createView(),
        },
        {
          binding: 2,
          resource: textures[0].createView(),
        },
        {
          binding: 3,
          resource: {
            buffer: buffer0,
          },
        },
      ],
    });

    const showResultBindGroup = device.createBindGroup({
      layout: fullscreenQuadPipeline.getBindGroupLayout(0),
      entries: [
        {
          binding: 0,
          resource: sampler,
        },
        {
          binding: 1,
          resource: textures[1].createView(),
        },
      ],
    });

    const settings = {
      filterSize: 15,
      iterations: 2,
    };

    let blockDim: number;
    const updateSettings = () => {
      blockDim = tileDim - (settings.filterSize - 1);
      device.queue.writeBuffer(
        blurParamsBuffer,
        0,
        new Uint32Array([settings.filterSize, blockDim])
      );
    };
    this.gui.add(settings, 'filterSize', 1, 33).step(2).onChange(updateSettings);
    this.gui.add(settings, 'iterations', 1, 10).step(1);

    updateSettings();

    const frame = () => {
      // Sample is no longer the active page.
      if (!this.theCanvas.nativeElement) return;

      const commandEncoder = device.createCommandEncoder();

      const computePass = commandEncoder.beginComputePass();
      computePass.setPipeline(blurPipeline);
      computePass.setBindGroup(0, computeConstants);

      computePass.setBindGroup(1, computeBindGroup0);
      computePass.dispatch(
        Math.ceil(srcWidth / blockDim),
        Math.ceil(srcHeight / batch[1])
      );

      computePass.setBindGroup(1, computeBindGroup1);
      computePass.dispatch(
        Math.ceil(srcHeight / blockDim),
        Math.ceil(srcWidth / batch[1])
      );

      for (let i = 0; i < settings.iterations - 1; ++i) {
        computePass.setBindGroup(1, computeBindGroup2);
        computePass.dispatch(
          Math.ceil(srcWidth / blockDim),
          Math.ceil(srcHeight / batch[1])
        );

        computePass.setBindGroup(1, computeBindGroup1);
        computePass.dispatch(
          Math.ceil(srcHeight / blockDim),
          Math.ceil(srcWidth / batch[1])
        );
      }

      computePass.end();

      const passEncoder = commandEncoder.beginRenderPass({
        colorAttachments: [
          {
            view: context.getCurrentTexture().createView(),
            clearValue: { r: 0.0, g: 0.0, b: 0.0, a: 1.0 },
            loadOp: 'clear',
            storeOp: 'store',
          },
        ],
      });

      passEncoder.setPipeline(fullscreenQuadPipeline);
      passEncoder.setBindGroup(0, showResultBindGroup);
      passEncoder.draw(6, 1, 0, 0);
      passEncoder.end();
      device.queue.submit([commandEncoder.finish()]);

      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

}
