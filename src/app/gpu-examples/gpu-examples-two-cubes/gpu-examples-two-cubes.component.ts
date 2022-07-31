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
import vertexPositionColorWGSL from './shaders/vertexPositionColor.frag.wgsl';

@Component({
  selector: 'app-gpu-examples-two-cubes',
  templateUrl: './gpu-examples-two-cubes.component.html',
  styleUrls: ['./gpu-examples-two-cubes.component.scss']
})
export class GpuExamplesTwoCubesComponent implements OnInit {
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
          code: vertexPositionColorWGSL,
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

    const matrixSize = 4 * 16; // 4x4 matrix
    const offset = 256; // uniformBindGroup offset must be 256-byte aligned
    const uniformBufferSize = offset + matrixSize;

    const uniformBuffer: GPUBuffer = device.createBuffer({
      size: uniformBufferSize,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    const uniformBindGroup1: GPUBindGroup = device.createBindGroup({
      layout: pipeline.getBindGroupLayout(0),
      entries: [
        {
          binding: 0,
          resource: {
            buffer: uniformBuffer,
            offset: 0,
            size: matrixSize,
          },
        },
      ],
    });

    const uniformBindGroup2: GPUBindGroup = device.createBindGroup({
      layout: pipeline.getBindGroupLayout(0),
      entries: [
        {
          binding: 0,
          resource: {
            buffer: uniformBuffer,
            offset: offset,
            size: matrixSize,
          },
        },
      ],
    });

    const renderPassDescriptor: GPURenderPassDescriptor = {
      colorAttachments: [
        {
          view: context
          .getCurrentTexture()
          .createView(), // Assigned later

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

    const modelMatrix1 = mat4.create();
    mat4.translate(modelMatrix1, modelMatrix1, vec3.fromValues(-2, 0, 0));
    const modelMatrix2 = mat4.create();
    mat4.translate(modelMatrix2, modelMatrix2, vec3.fromValues(2, 0, 0));
    const modelViewProjectionMatrix1 = mat4.create() as Float32Array;
    const modelViewProjectionMatrix2 = mat4.create() as Float32Array;
    const viewMatrix = mat4.create();
    mat4.translate(viewMatrix, viewMatrix, vec3.fromValues(0, 0, -7));

    const tmpMat41 = mat4.create();
    const tmpMat42 = mat4.create();

    function updateTransformationMatrix() {
      const now = Date.now() / 1000;

      mat4.rotate(
        tmpMat41,
        modelMatrix1,
        1,
        vec3.fromValues(Math.sin(now), Math.cos(now), 0)
      );
      mat4.rotate(
        tmpMat42,
        modelMatrix2,
        1,
        vec3.fromValues(Math.cos(now), Math.sin(now), 0)
      );

      mat4.multiply(modelViewProjectionMatrix1, viewMatrix, tmpMat41);
      mat4.multiply(
        modelViewProjectionMatrix1,
        projectionMatrix,
        modelViewProjectionMatrix1
      );
      mat4.multiply(modelViewProjectionMatrix2, viewMatrix, tmpMat42);
      mat4.multiply(
        modelViewProjectionMatrix2,
        projectionMatrix,
        modelViewProjectionMatrix2
      );
    }

    const frame = () => {
      // Sample is no longer the active page.
      if (!this.theCanvas.nativeElement) return;

      updateTransformationMatrix();
      device.queue.writeBuffer(
        uniformBuffer,
        0,
        modelViewProjectionMatrix1.buffer,
        modelViewProjectionMatrix1.byteOffset,
        modelViewProjectionMatrix1.byteLength
      );
      device.queue.writeBuffer(
        uniformBuffer,
        offset,
        modelViewProjectionMatrix2.buffer,
        modelViewProjectionMatrix2.byteOffset,
        modelViewProjectionMatrix2.byteLength
      );

      (renderPassDescriptor.colorAttachments as Array<GPURenderPassColorAttachment>)[0].view = context
        .getCurrentTexture()
        .createView();

      const commandEncoder: GPUCommandEncoder = device.createCommandEncoder();
      const passEncoder: GPURenderPassEncoder = commandEncoder.beginRenderPass(renderPassDescriptor);
      passEncoder.setPipeline(pipeline);
      passEncoder.setVertexBuffer(0, verticesBuffer);

      // Bind the bind group (with the transformation matrix) for
      // each cube, and draw.
      passEncoder.setBindGroup(0, uniformBindGroup1);
      passEncoder.draw(cubeVertexCount, 1, 0, 0);

      passEncoder.setBindGroup(0, uniformBindGroup2);
      passEncoder.draw(cubeVertexCount, 1, 0, 0);

      passEncoder.end();
      device.queue.submit([commandEncoder.finish()]);

      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

}
