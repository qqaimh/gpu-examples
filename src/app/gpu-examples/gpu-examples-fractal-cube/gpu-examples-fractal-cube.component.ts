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
import sampleSelfWGSL from './shaders/sampleSelf.frag.wgsl';

@Component({
  selector: 'app-gpu-examples-fractal-cube',
  templateUrl: './gpu-examples-fractal-cube.component.html',
  styleUrls: ['./gpu-examples-fractal-cube.component.scss']
})
export class GpuExamplesFractalCubeComponent implements OnInit {
  @ViewChild('theCanvas', {static: true}) theCanvas!: ElementRef;

  devicePixelRatio = window.devicePixelRatio || 1;

  constructor() { }

  ngOnInit(): void {
    this.draw();
  }

  async draw()  {
    const adapter = await navigator.gpu.requestAdapter();
    const device = await adapter.requestDevice();
  
    if (!this.theCanvas.nativeElement) return;
    const context = this.theCanvas.nativeElement.getContext('webgpu');
  
    this.theCanvas.nativeElement.width = this.theCanvas.nativeElement.clientWidth * this.devicePixelRatio;
    this.theCanvas.nativeElement.height = this.theCanvas.nativeElement.clientHeight * this.devicePixelRatio;

    const presentationFormat = navigator.gpu.getPreferredCanvasFormat();
  
    context.configure({
      device,
      format: presentationFormat,
  
      // Specify we want both RENDER_ATTACHMENT and COPY_SRC since we
      // will copy out of the swapchain texture.
      usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.COPY_SRC,
      //size: presentationSize,
      alphaMode: 'premultiplied'
    });
  
    // Create a vertex buffer from the cube data.
    const verticesBuffer = device.createBuffer({
      size: cubeVertexArray.byteLength,
      usage: GPUBufferUsage.VERTEX,
      mappedAtCreation: true,
    });
    new Float32Array(verticesBuffer.getMappedRange()).set(cubeVertexArray);
    verticesBuffer.unmap();
  
    const pipeline: GPURenderPipeline = await device.createRenderPipelineAsync({
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
          code: sampleSelfWGSL,
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
  
    const depthTexture = device.createTexture({
      size: [this.theCanvas.nativeElement.width, this.theCanvas.nativeElement.height],
      format: 'depth24plus',
      usage: GPUTextureUsage.RENDER_ATTACHMENT,
    });
  
    const uniformBufferSize = 4 * 16; // 4x4 matrix
    const uniformBuffer = device.createBuffer({
      size: uniformBufferSize,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
  
    // We will copy the frame's rendering results into this texture and
    // sample it on the next frame.
    const cubeTexture = device.createTexture({
      size: [this.theCanvas.nativeElement.width, this.theCanvas.nativeElement.height],
      format: presentationFormat,
      usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST,
    });
  
    // Create a sampler with linear filtering for smooth interpolation.
    const sampler = device.createSampler({
      magFilter: 'linear',
      minFilter: 'linear',
    });
  
    const uniformBindGroup = device.createBindGroup({
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
      ],
      depthStencilAttachment: {
        view: depthTexture.createView(),
  
        depthClearValue: 1.0,
        depthLoadOp: 'clear',
        depthStoreOp: 'store',
      },
    };
  
    const aspect = this.theCanvas.nativeElement.width / this.theCanvas.nativeElement.height;
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
  
      const transformationMatrix = getTransformationMatrix();
      device.queue.writeBuffer(
        uniformBuffer,
        0,
        transformationMatrix.buffer,
        transformationMatrix.byteOffset,
        transformationMatrix.byteLength
      );
  
      const swapChainTexture = context.getCurrentTexture();
      renderPassDescriptor.colorAttachments[0].view = swapChainTexture.createView();
  
      const commandEncoder = device.createCommandEncoder();
      const passEncoder = commandEncoder.beginRenderPass(renderPassDescriptor);
      passEncoder.setPipeline(pipeline);
      passEncoder.setBindGroup(0, uniformBindGroup);
      passEncoder.setVertexBuffer(0, verticesBuffer);
      passEncoder.draw(cubeVertexCount, 1, 0, 0);
      passEncoder.end();
  
      // Copy the rendering results from the swapchain into |cubeTexture|.
      commandEncoder.copyTextureToTexture(
        {
          texture: swapChainTexture,
        },
        {
          texture: cubeTexture,
        },
        [this.theCanvas.nativeElement.width, this.theCanvas.nativeElement.height],
      );
  
      device.queue.submit([commandEncoder.finish()]);
  
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

}
