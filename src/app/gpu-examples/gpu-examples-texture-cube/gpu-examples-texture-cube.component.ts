import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { mat4, vec3 } from 'gl-matrix';

import {
  cubeVertexArray,
  cubeVertexSize,
  cubeUVOffset,
  cubePositionOffset,
  cubeVertexCount,
} from './meshes/cube';

import basicVertWGSL from './shaders/basic.vert.wgsl';
import sampleTextureMixColorWGSL from './shaders/sampleTextureMixColor.frag.wgsl';

@Component({
  selector: 'app-gpu-examples-texture-cube',
  templateUrl: './gpu-examples-texture-cube.component.html',
  styleUrls: ['./gpu-examples-texture-cube.component.scss']
})
export class GpuExamplesTextureCubeComponent implements OnInit {
  @ViewChild('theCanvas', {static: true}) theCanvas!: ElementRef;

  constructor() { }

  ngOnInit(): void {
    this.draw();
  }

  async draw() {
    const adapter: GPUAdapter = await navigator.gpu.requestAdapter();
    const device: GPUDevice = await adapter!.requestDevice();

    if (this.theCanvas.nativeElement === null) return;
    const context: GPUCanvasContext = (this.theCanvas.nativeElement as HTMLCanvasElement).getContext('webgpu');

    const devicePixelRatio = window.devicePixelRatio || 1;
    const presentationSize = [
      this.theCanvas.nativeElement.clientWidth * devicePixelRatio,
      this.theCanvas.nativeElement.clientHeight * devicePixelRatio,
    ];
    const presentationFormat: GPUTextureFormat = navigator.gpu.getPreferredCanvasFormat();

    context.configure({
      device,
      format: presentationFormat,
      size: presentationSize,
      alphaMode: 'premultiplied'
    });

    // Create a vertex buffer from the cube data.
    const verticesBuffer: GPUBuffer = device.createBuffer({
      size: cubeVertexArray.byteLength,
      usage: GPUBufferUsage.VERTEX,
      mappedAtCreation: true,
    });
    new Float32Array(verticesBuffer.getMappedRange()).set(cubeVertexArray);
    verticesBuffer.unmap();

    const pipeline: GPURenderPipeline = device.createRenderPipeline({
      vertex: {
        module: device.createShaderModule({
          code: basicVertWGSL,
        }),
        entryPoint: 'main',
        buffers: [
          {
            arrayStride: cubeVertexSize,
            attributes: [
              {
                // position
                shaderLocation: 0,
                offset: cubePositionOffset,
                format: 'float32x4',
              },
              {
                // uv
                shaderLocation: 1,
                offset: cubeUVOffset,
                format: 'float32x2',
              },
            ],
          },
        ],
      },
      fragment: {
        module: device.createShaderModule({
          code: sampleTextureMixColorWGSL,
        }),
        entryPoint: 'main',
        targets: [
          {
            format: presentationFormat,
          },
        ],
      },
      primitive: {
        topology: 'triangle-list',

        // Backface culling since the cube is solid piece of geometry.
        // Faces pointing away from the camera will be occluded by faces
        // pointing toward the camera.
        cullMode: 'back',
      },

      // Enable depth testing so that the fragment closest to the camera
      // is rendered in front.
      depthStencil: {
        depthWriteEnabled: true,
        depthCompare: 'less',
        format: 'depth24plus',
      },
      layout: 'auto'
    });

    const depthTexture: GPUTexture = device.createTexture({
      size: presentationSize,
      format: 'depth24plus',
      usage: GPUTextureUsage.RENDER_ATTACHMENT,
    });

    const uniformBufferSize = 4 * 16; // 4x4 matrix
    const uniformBuffer: GPUBuffer = device.createBuffer({
      size: uniformBufferSize,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    // Fetch the image and upload it into a GPUTexture.
    let cubeTexture: GPUTexture;
    {
      const img: HTMLImageElement = document.createElement('img');
      img.src = '../../assets/img/Di-3d.png';
      await img.decode();
      const imageBitmap: ImageBitmap = await createImageBitmap(img);

      cubeTexture = device.createTexture({
        size: [imageBitmap.width, imageBitmap.height, 1],
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
    }

    // Create a sampler with linear filtering for smooth interpolation.
    const sampler: GPUSampler = device.createSampler({
      magFilter: 'linear',
      minFilter: 'linear',
    });

    const uniformBindGroup: GPUBindGroup = device.createBindGroup({
      layout: pipeline.getBindGroupLayout(0),
      entries: [
        {
          binding: 0,
          resource: {
            buffer: uniformBuffer,
          },
        },
        {
          binding: 1,
          resource: sampler,
        },
        {
          binding: 2,
          resource: cubeTexture.createView(),
        },
      ],
    });

    const renderPassDescriptor: GPURenderPassDescriptor = {
      colorAttachments: [
        {
          view: undefined, // Assigned later

          clearValue: { r: 0.5, g: 0.5, b: 0.5, a: 1.0 },
          loadOp: 'clear',
          storeOp: 'store',
        },
      ] as Iterable<GPURenderPassColorAttachment | null>,
      depthStencilAttachment: {
        view: depthTexture.createView(),

        depthClearValue: 1.0,
        depthLoadOp: 'clear',
        depthStoreOp: 'store',
      },
    };
 
    const aspect = presentationSize[0] / presentationSize[1];
    const projectionMatrix = mat4.create();
    mat4.perspective(projectionMatrix, (2 * Math.PI) / 5, aspect, 1, 100.0);

    function getTransformationMatrix() {
      const viewMatrix = mat4.create();
      mat4.translate(viewMatrix, viewMatrix, vec3.fromValues(0, 0, -4));
      const now = Date.now() / 1000;
      mat4.rotate(
        viewMatrix,
        viewMatrix,
        1,
        vec3.fromValues(Math.sin(now), Math.cos(now), 0)
      );

      const modelViewProjectionMatrix = mat4.create();
      mat4.multiply(modelViewProjectionMatrix, projectionMatrix, viewMatrix);

      return modelViewProjectionMatrix as Float32Array;
    }

    const frame = () => {
      // Sample is no longer the active page.
      if (!this.theCanvas.nativeElement) return;

      const transformationMatrix: Float32Array = getTransformationMatrix();
      device.queue.writeBuffer(
        uniformBuffer,
        0,
        transformationMatrix.buffer,
        transformationMatrix.byteOffset,
        transformationMatrix.byteLength
      );
      (renderPassDescriptor.colorAttachments as Array<GPURenderPassColorAttachment>)[0].view = context.getCurrentTexture().createView();

      const commandEncoder: GPUCommandEncoder = device.createCommandEncoder();
      const passEncoder: GPURenderPassEncoder = commandEncoder.beginRenderPass(renderPassDescriptor);
      passEncoder.setPipeline(pipeline);
      passEncoder.setBindGroup(0, uniformBindGroup);
      passEncoder.setVertexBuffer(0, verticesBuffer);
      passEncoder.draw(cubeVertexCount, 1, 0, 0);
      passEncoder.end();
      device.queue.submit([commandEncoder.finish()]);

      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

}
