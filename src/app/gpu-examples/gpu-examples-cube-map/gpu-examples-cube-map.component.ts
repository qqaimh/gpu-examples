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
import sampleCubemapWGSL from './shaders/sampleCubemap.frag.wgsl';

@Component({
  selector: 'app-gpu-examples-cube-map',
  templateUrl: './gpu-examples-cube-map.component.html',
  styleUrls: ['./gpu-examples-cube-map.component.scss']
})
export class GpuExamplesCubeMapComponent implements OnInit {
  @ViewChild('theCanvas', {static: true}) theCanvas!: ElementRef;

  constructor() { }

  ngOnInit(): void {
    this.draw();
  }

  async draw()  {
    const adapter: GPUAdapter = await navigator.gpu.requestAdapter();
    const device: GPUDevice = await adapter.requestDevice();

    if (!this.theCanvas.nativeElement) return;
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
          code: sampleCubemapWGSL,
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

        // Since we are seeing from inside of the cube
        // and we are using the regular cube geomtry data with outward-facing normals,
        // the cullMode should be 'front' or 'none'.
        cullMode: 'none',
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

    // Fetch the 6 separate images for negative/positive x, y, z axis of a cubemap
    // and upload it into a GPUTexture.
    let cubemapTexture: GPUTexture;
    {
      // The order of the array layers is [+X, -X, +Y, -Y, +Z, -Z]
      const imgSrcs = [
        `../../assets/img/cubemap/posx.jpg`,
        `../../assets/img/cubemap/negx.jpg`,
        `../../assets/img/cubemap/posy.jpg`,
        `../../assets/img/cubemap/negy.jpg`,
        `../../assets/img/cubemap/posz.jpg`,
        `../../assets/img/cubemap/negz.jpg`,
      ];
      const promises: Promise<ImageBitmap>[] = imgSrcs.map((src) => {
        const img = document.createElement('img');
        img.src = src;
        return img.decode().then(() => createImageBitmap(img));
      });
      const imageBitmaps = await Promise.all(promises);

      cubemapTexture = device.createTexture({
        dimension: '2d',
        // Create a 2d array texture.
        // Assume each image has the same size.
        size: [imageBitmaps[0].width, imageBitmaps[0].height, 6],
        format: 'rgba8unorm',
        usage:
          GPUTextureUsage.TEXTURE_BINDING |
          GPUTextureUsage.COPY_DST |
          GPUTextureUsage.RENDER_ATTACHMENT,
      });

      for (let i = 0; i < imageBitmaps.length; i++) {
        const imageBitmap = imageBitmaps[i];
        device.queue.copyExternalImageToTexture(
          { source: imageBitmap },
          { texture: cubemapTexture, origin: [0, 0, i] },
          [imageBitmap.width, imageBitmap.height]
        );
      }
    }

    const uniformBufferSize = 4 * 16; // 4x4 matrix
    const uniformBuffer: GPUBuffer = device.createBuffer({
      size: uniformBufferSize,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

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
            offset: 0,
            size: uniformBufferSize,
          },
        },
        {
          binding: 1,
          resource: sampler,
        },
        {
          binding: 2,
          resource: cubemapTexture.createView({
            dimension: 'cube',
          }),
        },
      ],
    });

    const renderPassDescriptor: GPURenderPassDescriptor = {
      colorAttachments: [
        {
          view: undefined, // Assigned later
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

    const aspect = presentationSize[0] / presentationSize[1];
    const projectionMatrix = mat4.create();
    mat4.perspective(projectionMatrix, (2 * Math.PI) / 5, aspect, 1, 3000);

    const modelMatrix = mat4.create();
    mat4.scale(modelMatrix, modelMatrix, vec3.fromValues(1000, 1000, 1000));
    const modelViewProjectionMatrix = mat4.create() as Float32Array;
    const viewMatrix = mat4.create();

    const tmpMat4 = mat4.create();

    // Comppute camera movement:
    // It rotates around Y axis with a slight pitch movement.
    function updateTransformationMatrix() {
      const now = Date.now() / 800;

      mat4.rotate(
        tmpMat4,
        viewMatrix,
        (Math.PI / 10) * Math.sin(now),
        vec3.fromValues(1, 0, 0)
      );
      mat4.rotate(tmpMat4, tmpMat4, now * 0.2, vec3.fromValues(0, 1, 0));

      mat4.multiply(modelViewProjectionMatrix, tmpMat4, modelMatrix);
      mat4.multiply(
        modelViewProjectionMatrix,
        projectionMatrix,
        modelViewProjectionMatrix
      );
    }

    const frame = () => {
      // Sample is no longer the active page.
      if (!this.theCanvas.nativeElement) return;

      updateTransformationMatrix();
      device.queue.writeBuffer(
        uniformBuffer,
        0,
        modelViewProjectionMatrix.buffer,
        modelViewProjectionMatrix.byteOffset,
        modelViewProjectionMatrix.byteLength
      );

      renderPassDescriptor.colorAttachments[0].view = context.getCurrentTexture().createView();

      const commandEncoder: GPUCommandEncoder = device.createCommandEncoder();
      const passEncoder: GPURenderPassEncoder = commandEncoder.beginRenderPass(renderPassDescriptor);
      passEncoder.setPipeline(pipeline);
      passEncoder.setVertexBuffer(0, verticesBuffer);
      passEncoder.setBindGroup(0, uniformBindGroup);
      passEncoder.draw(cubeVertexCount, 1, 0, 0);
      passEncoder.end();
      device.queue.submit([commandEncoder.finish()]);

      requestAnimationFrame(frame);
    }

    requestAnimationFrame(frame);
  }

}
