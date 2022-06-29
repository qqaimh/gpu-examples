import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';

import triangleVertWGSL from './shaders/triangle.vert.wgsl';
import redFragWGSL from './shaders/red.frag.wgsl';

@Component({
  selector: 'app-gpu-examples-hello-triangle',
  templateUrl: './gpu-examples-hello-triangle.component.html',
  styleUrls: ['./gpu-examples-hello-triangle.component.scss']
})
export class GpuExamplesHelloTriangleComponent implements OnInit {
  @ViewChild('theCanvas', {static: true}) theCanvas!: ElementRef;

  constructor(
  ) { 
  }

  ngOnInit(): void {
    this.draw();
  }

  async draw()  {
    const adapter = await navigator.gpu.requestAdapter();
    const device = await adapter.requestDevice();
  
    if (!this.theCanvas.nativeElement) return;
    const context: GPUCanvasContext = (this.theCanvas.nativeElement as HTMLCanvasElement).getContext('webgpu');

    const presentationFormat: GPUTextureFormat = navigator.gpu.getPreferredCanvasFormat();
  
    context.configure({
      device,
      format: presentationFormat,
      alphaMode: 'opaque',
    });
  
    const pipeline = device.createRenderPipeline({
  vertex: {
    module: device.createShaderModule({
      code: triangleVertWGSL,
    }),
    entryPoint: 'main',
  },
  fragment: {
    module: device.createShaderModule({
      code: redFragWGSL,
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
  layout: 'auto'
});
  
    const frame = () => {
      // Sample is no longer the active page.
      if (!this.theCanvas.nativeElement) return;
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
      passEncoder.draw(3, 1, 0, 0);
      passEncoder.end();
  
      device.queue.submit([commandEncoder.finish()]);
      requestAnimationFrame(frame);
    }
  
    requestAnimationFrame(frame);

  }

}
