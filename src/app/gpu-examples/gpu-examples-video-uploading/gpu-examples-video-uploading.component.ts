import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';

import fullscreenTexturedQuadWGSL from './shaders/fullscreenTexturedQuad.wgsl';
import sampleExternalTextureWGSL from './shaders/sampleExternalTexture.wgsl';

@Component({
  selector: 'app-gpu-examples-video-uploading',
  templateUrl: './gpu-examples-video-uploading.component.html',
  styleUrls: ['./gpu-examples-video-uploading.component.scss']
})
export class GpuExamplesVideoUploadingComponent implements OnInit {
  @ViewChild('theCanvas', {static: true}) theCanvas!: ElementRef;
  
  constructor() { }

  ngOnInit(): void {
    this.draw();
  }

  async draw() {
    // Set video element
    const video = document.createElement('video');
    video.loop = true;
    video.autoplay = true;
    video.muted = true;
    video.src = '../../assets/video/pano.webm';
    await video.play();

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

    const pipeline = device.createRenderPipeline({
      vertex: {
        module: device.createShaderModule({
          code: fullscreenTexturedQuadWGSL,
        }),
        entryPoint: 'vert_main',
      },
      fragment: {
        module: device.createShaderModule({
          code: sampleExternalTextureWGSL,
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
      },
      layout: undefined
    });

    const sampler = device.createSampler({
      magFilter: 'linear',
      minFilter: 'linear',
    });

    const frame = () => {
      // Sample is no longer the active page.
      if (!this.theCanvas.nativeElement) return;

      const uniformBindGroup = device.createBindGroup({
        layout: pipeline.getBindGroupLayout(0),
        entries: [
          {
            binding: 1,
            resource: sampler,
          },
          {
            binding: 2,
            resource: device.importExternalTexture({
              source: video,
            }),
          },
        ],
      });

      const commandEncoder = device.createCommandEncoder();
      const textureView = context.getCurrentTexture().createView();

      const renderPassDescriptor: GPURenderPassDescriptor = {
        colorAttachments: [
          {
            view: textureView,
            clearValue: { r: 0.0, g: 0.0, b: 0.0, a: 1.0 },
            loadOp: 'clear',
            storeOp: 'store',
          },
        ],
      };

      const passEncoder = commandEncoder.beginRenderPass(renderPassDescriptor);
      passEncoder.setPipeline(pipeline);
      passEncoder.setBindGroup(0, uniformBindGroup);
      passEncoder.draw(6, 1, 0, 0);
      passEncoder.end();
      device.queue.submit([commandEncoder.finish()]);

      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

}
