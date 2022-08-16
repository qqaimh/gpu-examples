import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';

import { mat4, vec3 } from 'gl-matrix';

import { mesh } from './meshes/stanfordDragon';

import vertexShadowWGSL from './shaders/vertexShadow.wgsl';
import vertexWGSL from './shaders/vertex.wgsl';
import fragmentWGSL from './shaders/fragment.wgsl';

const shadowDepthTextureSize = 1024;

@Component({
  selector: 'app-gpu-examples-shadow-mapping',
  templateUrl: './gpu-examples-shadow-mapping.component.html',
  styleUrls: ['./gpu-examples-shadow-mapping.component.scss']
})
export class GpuExamplesShadowMappingComponent implements OnInit {
  @ViewChild('theCanvas', {static: true}) theCanvas!: ElementRef;

  constructor() { }

  ngOnInit(): void {
    this.draw();
  }

  // This example shows how to sample from a depth texture to render shadows.
  async draw() {
    const adapter: GPUAdapter = await navigator.gpu.requestAdapter();
    const device: GPUDevice = await adapter.requestDevice();

    if (!this.theCanvas.nativeElement) return;

    const context: GPUCanvasContext = (this.theCanvas.nativeElement as HTMLCanvasElement).getContext('webgpu');

    const devicePixelRatio = window.devicePixelRatio || 1;
    const presentationSize = [
      this.theCanvas.nativeElement.clientWidth * devicePixelRatio,
      this.theCanvas.nativeElement.clientHeight * devicePixelRatio,
    ];
    const aspect = presentationSize[0] / presentationSize[1];
    const presentationFormat: GPUTextureFormat = navigator.gpu.getPreferredCanvasFormat();
    context.configure({
      device,
      format: presentationFormat,
      size: presentationSize,
      alphaMode: 'premultiplied'
    });

    // Create the model vertex buffer.
    const vertexBuffer: GPUBuffer = device.createBuffer({
      size: mesh.positions.length * 3 * 2 * Float32Array.BYTES_PER_ELEMENT,
      usage: GPUBufferUsage.VERTEX,
      mappedAtCreation: true,
    });
    {
      const mapping: Float32Array = new Float32Array(vertexBuffer.getMappedRange());
      for (let i = 0; i < mesh.positions.length; ++i) {
        mapping.set(mesh.positions[i], 6 * i);
        mapping.set(mesh.normals[i], 6 * i + 3);
      }
      vertexBuffer.unmap();
    }

    // Create the model index buffer.
    const indexCount = mesh.triangles.length * 3;
    const indexBuffer = device.createBuffer({
      size: indexCount * Uint16Array.BYTES_PER_ELEMENT,
      usage: GPUBufferUsage.INDEX,
      mappedAtCreation: true,
    });
    {
      const mapping = new Uint16Array(indexBuffer.getMappedRange());
      for (let i = 0; i < mesh.triangles.length; ++i) {
        mapping.set(mesh.triangles[i], 3 * i);
      }
      indexBuffer.unmap();
    }

    // Create the depth texture for rendering/sampling the shadow map.
    const shadowDepthTexture: GPUTexture = device.createTexture({
      size: [shadowDepthTextureSize, shadowDepthTextureSize, 1],
      usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING,
      format: 'depth32float',
    });
    const shadowDepthTextureView: GPUTextureView = shadowDepthTexture.createView();

    // Create some common descriptors used for both the shadow pipeline
    // and the color rendering pipeline.
    const vertexBuffers: Iterable<GPUVertexBufferLayout> = [
      {
        arrayStride: Float32Array.BYTES_PER_ELEMENT * 6,
        attributes: [
          {
            // position
            shaderLocation: 0,
            offset: 0,
            format: 'float32x3',
          },
          {
            // normal
            shaderLocation: 1,
            offset: Float32Array.BYTES_PER_ELEMENT * 3,
            format: 'float32x3',
          },
        ],
      },
    ];

    const primitive: GPUPrimitiveState = {
      topology: 'triangle-list',
      cullMode: 'back',
    };

    const uniformBufferBindGroupLayout: GPUBindGroupLayout = device.createBindGroupLayout({
      entries: [
        {
          binding: 0,
          visibility: GPUShaderStage.VERTEX,
          buffer: {
            type: 'uniform',
          },
        },
      ],
    });

    const shadowPipeline: GPURenderPipeline = await device.createRenderPipelineAsync({
      layout: device.createPipelineLayout({
        bindGroupLayouts: [
          uniformBufferBindGroupLayout,
          uniformBufferBindGroupLayout,
        ],
      }),
      vertex: {
        module: device.createShaderModule({
          code: vertexShadowWGSL,
        }),
        entryPoint: 'main',
        buffers: vertexBuffers,
      },
      depthStencil: {
        depthWriteEnabled: true,
        depthCompare: 'less',
        format: 'depth32float',
      },
      primitive,
    });

    // Create a bind group layout which holds the scene uniforms and
    // the texture+sampler for depth. We create it manually because the WebPU
    // implementation doesn't infer this from the shader (yet).
    const bglForRender = device.createBindGroupLayout({
      entries: [
        {
          binding: 0,
          visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
          buffer: {
            type: 'uniform',
          },
        },
        {
          binding: 1,
          visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
          texture: {
            sampleType: 'depth',
          },
        },
        {
          binding: 2,
          visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
          sampler: {
            type: 'comparison',
          },
        },
      ],
    });

    const pipeline: GPURenderPipeline = await device.createRenderPipelineAsync({
      layout: device.createPipelineLayout({
        bindGroupLayouts: [
          bglForRender, 
          uniformBufferBindGroupLayout
        ],
      }),
      vertex: {
        module: device.createShaderModule({
          code: vertexWGSL,
        }),
        entryPoint: 'main',
        buffers: vertexBuffers,
      },
      fragment: {
        module: device.createShaderModule({
          code: fragmentWGSL,
        }),
        entryPoint: 'main',
        targets: [
          {
            format: presentationFormat,
          },
        ],
      },
      depthStencil: {
        depthWriteEnabled: true,
        depthCompare: 'less',
        format: 'depth24plus-stencil8',
      },
      primitive,
    });

    const depthTexture: GPUTexture = device.createTexture({
      size: presentationSize,
      format: 'depth24plus-stencil8',
      usage: GPUTextureUsage.RENDER_ATTACHMENT,
    });

    const renderPassDescriptor: GPURenderPassDescriptor = {
      colorAttachments: [
        {
          // view is acquired and set in render loop.
          view: undefined,

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
        stencilClearValue: 0,
        stencilLoadOp: 'clear',
        stencilStoreOp: 'store',
      },
    };

    const modelUniformBuffer: GPUBuffer = device.createBuffer({
      size: 4 * 16, // 4x4 matrix
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    const sceneUniformBuffer: GPUBuffer = device.createBuffer({
      // Two 4x4 viewProj matrices,
      // one for the camera and one for the light.
      // Then a vec3 for the light position.
      size: 2 * 4 * 16 + 3 * 4,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    const sceneBindGroupForShadow: GPUBindGroup = device.createBindGroup({
      layout: uniformBufferBindGroupLayout,
      entries: [
        {
          binding: 0,
          resource: {
            buffer: sceneUniformBuffer,
          },
        },
      ],
    });

    const sceneBindGroupForRender: GPUBindGroup = device.createBindGroup({
      layout: bglForRender,
      entries: [
        {
          binding: 0,
          resource: {
            buffer: sceneUniformBuffer,
          },
        },
        {
          binding: 1,
          resource: shadowDepthTextureView,
        },
        {
          binding: 2,
          resource: device.createSampler({
            compare: 'less',
          }),
        },
      ],
    });

    const modelBindGroup: GPUBindGroup = device.createBindGroup({
      layout: uniformBufferBindGroupLayout,
      entries: [
        {
          binding: 0,
          resource: {
            buffer: modelUniformBuffer,
          },
        },
      ],
    });

    const eyePosition = vec3.fromValues(0, 50, -100);
    const upVector = vec3.fromValues(0, 1, 0);
    const origin = vec3.fromValues(0, 0, 0);

    const projectionMatrix = mat4.create();
    mat4.perspective(projectionMatrix, (2 * Math.PI) / 5, aspect, 1, 2000.0);

    const viewMatrix = mat4.create();
    mat4.lookAt(viewMatrix, eyePosition, origin, upVector);

    const lightPosition = vec3.fromValues(50, 100, -100);
    const lightViewMatrix = mat4.create();
    mat4.lookAt(lightViewMatrix, lightPosition, origin, upVector);

    const lightProjectionMatrix = mat4.create();
    {
      const left = -80;
      const right = 80;
      const bottom = -80;
      const top = 80;
      const near = -200;
      const far = 300;
      mat4.ortho(lightProjectionMatrix, left, right, bottom, top, near, far);
    }

    const lightViewProjMatrix = mat4.create();
    mat4.multiply(lightViewProjMatrix, lightProjectionMatrix, lightViewMatrix);

    const viewProjMatrix = mat4.create();
    mat4.multiply(viewProjMatrix, projectionMatrix, viewMatrix);

    // Move the model so it's centered.
    const modelMatrix = mat4.create();
    mat4.translate(modelMatrix, modelMatrix, vec3.fromValues(0, -5, 0));
    mat4.translate(modelMatrix, modelMatrix, vec3.fromValues(0, -40, 0));

    // The camera/light aren't moving, so write them into buffers now.
    {
      const lightMatrixData = lightViewProjMatrix as Float32Array;
      device.queue.writeBuffer(
        sceneUniformBuffer,
        0,
        lightMatrixData.buffer,
        lightMatrixData.byteOffset,
        lightMatrixData.byteLength
      );

      const cameraMatrixData = viewProjMatrix as Float32Array;
      device.queue.writeBuffer(
        sceneUniformBuffer,
        64,
        cameraMatrixData.buffer,
        cameraMatrixData.byteOffset,
        cameraMatrixData.byteLength
      );

      const lightData = lightPosition as Float32Array;
      device.queue.writeBuffer(
        sceneUniformBuffer,
        128,
        lightData.buffer,
        lightData.byteOffset,
        lightData.byteLength
      );

      const modelData = modelMatrix as Float32Array;
      device.queue.writeBuffer(
        modelUniformBuffer,
        0,
        modelData.buffer,
        modelData.byteOffset,
        modelData.byteLength
      );
    }

    // Rotates the camera around the origin based on time.
    function getCameraViewProjMatrix() {
      const eyePosition = vec3.fromValues(0, 50, -100);

      const rad = Math.PI * (Date.now() / 2000);
      vec3.rotateY(eyePosition, eyePosition, origin, rad);

      const viewMatrix = mat4.create();
      mat4.lookAt(viewMatrix, eyePosition, origin, upVector);

      mat4.multiply(viewProjMatrix, projectionMatrix, viewMatrix);
      return viewProjMatrix as Float32Array;
    }

    const shadowPassDescriptor: GPURenderPassDescriptor = {
      colorAttachments: [],
      depthStencilAttachment: {
        view: shadowDepthTextureView,
        depthClearValue: 1.0,
        depthLoadOp: 'clear',
        depthStoreOp: 'store',
      },
    };

    const frame = () => {
      // Sample is no longer the active page.
      if (!this.theCanvas.nativeElement) return;

      const cameraViewProj = getCameraViewProjMatrix();
      device.queue.writeBuffer(
        sceneUniformBuffer,
        64,
        cameraViewProj.buffer,
        cameraViewProj.byteOffset,
        cameraViewProj.byteLength
      );

      renderPassDescriptor.colorAttachments[0].view = context
        .getCurrentTexture()
        .createView();

      const commandEncoder: GPUCommandEncoder = device.createCommandEncoder();
      {
        const shadowPass: GPURenderPassEncoder = commandEncoder.beginRenderPass(shadowPassDescriptor);
        shadowPass.setPipeline(shadowPipeline);
        shadowPass.setBindGroup(0, sceneBindGroupForShadow);
        shadowPass.setBindGroup(1, modelBindGroup);
        shadowPass.setVertexBuffer(0, vertexBuffer);
        shadowPass.setIndexBuffer(indexBuffer, 'uint16');
        shadowPass.drawIndexed(indexCount);

        shadowPass.end();
      }
      {
        const renderPass: GPURenderPassEncoder = commandEncoder.beginRenderPass(renderPassDescriptor);
        renderPass.setPipeline(pipeline);
        renderPass.setBindGroup(0, sceneBindGroupForRender);
        renderPass.setBindGroup(1, modelBindGroup);
        renderPass.setVertexBuffer(0, vertexBuffer);
        renderPass.setIndexBuffer(indexBuffer, 'uint16');
        renderPass.drawIndexed(indexCount);

        renderPass.end();
      }
      device.queue.submit([commandEncoder.finish()]);
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

}
