import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';

import { mat4, vec3 } from 'gl-matrix';

import {
  cubeVertexArray,
  cubeVertexSize,
  cubeUVOffset,
  cubePositionOffset,
  cubeVertexCount,
} from './meshes/cube';

import instancedVertWGSL from './shaders/instanced.vert.wgsl';
import vertexPositionColorWGSL from './shaders/vertexPositionColor.frag.wgsl';

@Component({
  selector: 'app-gpu-examples-instanced-cube',
  templateUrl: './gpu-examples-instanced-cube.component.html',
  styleUrls: ['./gpu-examples-instanced-cube.component.scss']
})
export class GpuExamplesInstancedCubeComponent implements OnInit {
  @ViewChild('theCanvas', {static: true}) theCanvas!: ElementRef;

  constructor() { }

  ngOnInit(): void {
    this.draw();
  }

  async draw() {
    const adapter: GPUAdapter = await navigator.gpu.requestAdapter();
    const device: GPUDevice = await adapter.requestDevice();

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
    });

    // Create a vertex buffer from the cube data.
    const verticesBuffer = device.createBuffer({
      size: cubeVertexArray.byteLength,
      usage: GPUBufferUsage.VERTEX,
      mappedAtCreation: true,
    });
    new Float32Array(verticesBuffer.getMappedRange()).set(cubeVertexArray);
    verticesBuffer.unmap();

    const pipeline = device.createRenderPipeline({
      vertex: {
        module: device.createShaderModule({
          code: instancedVertWGSL,
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

    const depthTexture = device.createTexture({
      size: presentationSize,
      format: 'depth24plus',
      usage: GPUTextureUsage.RENDER_ATTACHMENT,
    });

    const xCount = 4;
    const yCount = 4;
    const numInstances = xCount * yCount;
    const matrixFloatCount = 16; // 4x4 matrix
    const matrixSize = 4 * matrixFloatCount;
    const uniformBufferSize = numInstances * matrixSize;

    // Allocate a buffer large enough to hold transforms for every
    // instance.
    const uniformBuffer = device.createBuffer({
      size: uniformBufferSize,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
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
      ],
    });

    const aspect = presentationSize[0] / presentationSize[1];
    const projectionMatrix = mat4.create();
    mat4.perspective(projectionMatrix, (2 * Math.PI) / 5, aspect, 1, 100.0);

    const modelMatrices = new Array(numInstances);
    const mvpMatricesData = new Float32Array(matrixFloatCount * numInstances);

    const step = 4.0;

    // Initialize the matrix data for every instance.
    let m = 0;
    for (let x = 0; x < xCount; x++) {
      for (let y = 0; y < yCount; y++) {
        modelMatrices[m] = mat4.create();
        mat4.translate(
          modelMatrices[m],
          modelMatrices[m],
          vec3.fromValues(
            step * (x - xCount / 2 + 0.5),
            step * (y - yCount / 2 + 0.5),
            0
          )
        );
        m++;
      }
    }

    const viewMatrix = mat4.create();
    mat4.translate(viewMatrix, viewMatrix, vec3.fromValues(0, 0, -12));

    const tmpMat4 = mat4.create();

    // Update the transformation matrix data for each instance.
    function updateTransformationMatrix() {
      const now = Date.now() / 1000;

      let m = 0,
        i = 0;
      for (let x = 0; x < xCount; x++) {
        for (let y = 0; y < yCount; y++) {
          mat4.rotate(
            tmpMat4,
            modelMatrices[i],
            1,
            vec3.fromValues(
              Math.sin((x + 0.5) * now),
              Math.cos((y + 0.5) * now),
              0
            )
          );

          mat4.multiply(tmpMat4, viewMatrix, tmpMat4);
          mat4.multiply(tmpMat4, projectionMatrix, tmpMat4);

          mvpMatricesData.set(tmpMat4, m);

          i++;
          m += matrixFloatCount;
        }
      }
    }

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

    const frame = () => {
      // Sample is no longer the active page.
      if (!this.theCanvas.nativeElement) return;

      // Update the matrix data.
      updateTransformationMatrix();
      device.queue.writeBuffer(
        uniformBuffer,
        0,
        mvpMatricesData.buffer,
        mvpMatricesData.byteOffset,
        mvpMatricesData.byteLength
      );

      renderPassDescriptor.colorAttachments[0].view = context
        .getCurrentTexture()
        .createView();

      const commandEncoder = device.createCommandEncoder();
      const passEncoder = commandEncoder.beginRenderPass(renderPassDescriptor);
      passEncoder.setPipeline(pipeline);
      passEncoder.setBindGroup(0, uniformBindGroup);
      passEncoder.setVertexBuffer(0, verticesBuffer);
      passEncoder.draw(cubeVertexCount, numInstances, 0, 0);
      passEncoder.end();
      device.queue.submit([commandEncoder.finish()]);

      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

}
