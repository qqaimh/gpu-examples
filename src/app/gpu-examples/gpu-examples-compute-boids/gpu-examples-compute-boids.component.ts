import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import * as dat from 'dat.gui';

import spriteWGSL from './shaders/sprite.wgsl';
import updateSpritesWGSL from './shaders/updateSprites.wgsl';

@Component({
  selector: 'app-gpu-examples-compute-boids',
  templateUrl: './gpu-examples-compute-boids.component.html',
  styleUrls: ['./gpu-examples-compute-boids.component.scss']
})
export class GpuExamplesComputeBoidsComponent implements OnInit {
  @ViewChild('theCanvas', { static: true }) theCanvas!: ElementRef;

  gui: dat.GUI = new dat.GUI({ autoPlace: false });

  devicePixelRatio = window.devicePixelRatio || 1;

  constructor(private ele: ElementRef) { }

  ngOnInit(): void {
    this.ele.nativeElement.appendChild(this.gui.domElement);
    this.draw();
  }

  async draw() {
    const adapter: GPUAdapter = await navigator.gpu.requestAdapter();
    const device: GPUDevice = await adapter.requestDevice();

    if (!this.theCanvas.nativeElement) return;
    const context: GPUCanvasContext = (this.theCanvas.nativeElement as HTMLCanvasElement).getContext('webgpu');

    this.theCanvas.nativeElement.width = this.theCanvas.nativeElement.clientWidth * this.devicePixelRatio;
    this.theCanvas.nativeElement.height = this.theCanvas.nativeElement.clientHeight * this.devicePixelRatio;

    const presentationFormat: GPUTextureFormat = navigator.gpu.getPreferredCanvasFormat();
    context.configure({
      device,
      format: presentationFormat,
      alphaMode: 'premultiplied'
    });

    const spriteShaderModule: GPUShaderModule = device.createShaderModule({ code: spriteWGSL });
    const renderPipeline: GPURenderPipeline = await device.createRenderPipelineAsync({
      vertex: {
        module: spriteShaderModule,
        entryPoint: 'vert_main',
        buffers: [
          {
            // instanced particles buffer
            // 如果我们采用了多实例绘制的方法来绘制图形，并且希望不同的实例之间读取到的buffer数据是不同的，我们就需要使用到这种 instance 的模式
            arrayStride: 4 * 4,
            stepMode: 'instance',  // 顶点数据的地址基于 arrayStride 不断的进行累加，但是在两个实例之间，顶点数据的地址不会被重置
            attributes: [
              {
                // instance position
                shaderLocation: 0,
                offset: 0,
                format: 'float32x2',
              },
              {
                // instance velocity
                shaderLocation: 1,
                offset: 2 * 4,
                format: 'float32x2',
              },
            ],
          },
          {
            // vertex buffer
            arrayStride: 2 * 4,
            stepMode: 'vertex',  // 顶点数据的地址基于 arrayStride 不断的进行累加，但是在两个实例之间，顶点数据的地址会被重置
            attributes: [
              {
                // vertex positions
                shaderLocation: 2,
                offset: 0,
                format: 'float32x2',
              },
            ],
          },
        ],
      },
      fragment: {
        module: spriteShaderModule,
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
      layout: 'auto'
    });

    const computePipeline: GPUComputePipeline = await device.createComputePipelineAsync({
      compute: {
        module: device.createShaderModule({
          code: updateSpritesWGSL,
        }),
        entryPoint: 'main',
      },
      layout: 'auto'
    });

    const renderPassDescriptor: GPURenderPassDescriptor = {
      colorAttachments: [
        {
          view: undefined, // Assigned later
          clearValue: { r: 0.0, g: 0.0, b: 0.0, a: 1.0 },
          loadOp: 'clear',
          storeOp: 'store',
        },
      ],
    };

    // 代表鸟的三角形三个顶点
    const vertexBufferData = new Float32Array([
      -0.01, -0.02, 0.01,
      -0.02, 0.0, 0.02,
    ]);
    const spriteVertexBuffer: GPUBuffer = device.createBuffer({
      size: vertexBufferData.byteLength,
      usage: GPUBufferUsage.VERTEX,
      mappedAtCreation: true,
    });
    new Float32Array(spriteVertexBuffer.getMappedRange()).set(vertexBufferData);
    spriteVertexBuffer.unmap();

    const simParams = {
      deltaT: 0.04,
      rule1Distance: 0.1,    // 如果两个个体之间的距离小于0.1，我们认为他们是一个群体
      rule2Distance: 0.025,  // 如果两个个体之间的距离小于0.025，则认为他们靠的太近，需要分开一点点
      rule3Distance: 0.025,  // 如果两个个体之间的距离小于0.03，则认为他们离的太远，希望他们靠近彼此一些
      rule1Scale: 0.02,      // 规则1的权重
      rule2Scale: 0.05,     // 规则2的权重
      rule3Scale: 0.005,    // 规则3的权重
    };
    const simParamBufferSize = 7 * Float32Array.BYTES_PER_ELEMENT;
    const simParamBuffer = device.createBuffer({
      size: simParamBufferSize,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    function updateSimParams() {
      device.queue.writeBuffer(
        simParamBuffer,
        0,
        new Float32Array([
          simParams.deltaT,
          simParams.rule1Distance,
          simParams.rule2Distance,
          simParams.rule3Distance,
          simParams.rule1Scale,
          simParams.rule2Scale,
          simParams.rule3Scale,
        ])
      );
    }
    updateSimParams();
    Object.keys(simParams).forEach((k) => {
      this.gui.add(simParams, k as any).onFinishChange(updateSimParams);
    });

    // 构建鸟群初始数据，前两位是鸟的位置，后两位是鸟的速度矢量
    const numParticles = 1500;
    const initialParticleData = new Float32Array(numParticles * 4);
    for (let i = 0; i < numParticles; ++i) {
      initialParticleData[4 * i + 0] = 2 * (Math.random() - 0.5);
      initialParticleData[4 * i + 1] = 2 * (Math.random() - 0.5);
      initialParticleData[4 * i + 2] = 2 * (Math.random() - 0.5) * 0.1;
      initialParticleData[4 * i + 3] = 2 * (Math.random() - 0.5) * 0.1;
    }

    /*
      使用2套 GPUBuffer 和 GPUBindGroup 对象，一套用于存储当前的鸟群信息（包括位置、速度），另一套用于存储计算的结果。
      计算完毕后我们需要将两套对象交换一下顺序，也就是说，拿第一次的结果当做第二次的输入，用第一次的输入来接收第二次的计算结果。
    */
    const particleBuffers: GPUBuffer[] = new Array(2);
    const particleBindGroups: GPUBindGroup[] = new Array(2);
    for (let i = 0; i < 2; ++i) {
      particleBuffers[i] = device.createBuffer({
        size: initialParticleData.byteLength,
        usage: GPUBufferUsage.VERTEX | GPUBufferUsage.STORAGE,
        mappedAtCreation: true,
      });
      new Float32Array(particleBuffers[i].getMappedRange()).set(
        initialParticleData
      );
      particleBuffers[i].unmap();
    }

    for (let i = 0; i < 2; ++i) {
      particleBindGroups[i] = device.createBindGroup({
        layout: computePipeline.getBindGroupLayout(0),
        entries: [
          {
            binding: 0,
            resource: {
              buffer: simParamBuffer,
            },
          },
          {
            binding: 1,
            resource: {
              buffer: particleBuffers[i],
              offset: 0,
              size: initialParticleData.byteLength,
            },
          },
          {
            binding: 2,
            resource: {
              buffer: particleBuffers[(i + 1) % 2],
              offset: 0,
              size: initialParticleData.byteLength,
            },
          },
        ],
      });
    }

    let t = 0;
    const frame = () => {
      // Sample is no longer the active page.
      if (!this.theCanvas.nativeElement) return;

      renderPassDescriptor.colorAttachments[0].view = context.getCurrentTexture().createView();

      const commandEncoder: GPUCommandEncoder = device.createCommandEncoder();

      /*
        使用2套 GPUBuffer 和 GPUBindGroup 对象，一套用于存储当前的鸟群信息（包括位置、速度），另一套用于存储计算的结果。
        计算完毕后我们需要将两套对象交换一下顺序，也就是说，拿第一次的结果当做第二次的输入，用第一次的输入来接收第二次的计算结果。
      */
      {
        const passEncoder: GPUComputePassEncoder = commandEncoder.beginComputePass();
        passEncoder.setPipeline(computePipeline);
        passEncoder.setBindGroup(0, particleBindGroups[t % 2]);
        passEncoder.dispatchWorkgroups(Math.ceil(numParticles / 64));
        passEncoder.end();
      }

      {
        const passEncoder: GPURenderPassEncoder = commandEncoder.beginRenderPass(renderPassDescriptor);
        passEncoder.setPipeline(renderPipeline);
        passEncoder.setVertexBuffer(0, particleBuffers[(t + 1) % 2]);
        passEncoder.setVertexBuffer(1, spriteVertexBuffer);
        passEncoder.draw(3, numParticles, 0, 0);
        passEncoder.end();
      }
      device.queue.submit([commandEncoder.finish()]);

      ++t;
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

}
