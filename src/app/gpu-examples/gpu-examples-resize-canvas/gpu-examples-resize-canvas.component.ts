import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';

import triangleVertWGSL from './shaders/triangle.vert.wgsl';
import redFragWGSL from './shaders/red.frag.wgsl';

@Component({
  selector: 'app-gpu-examples-resize-canvas',
  templateUrl: './gpu-examples-resize-canvas.component.html',
  styleUrls: ['./gpu-examples-resize-canvas.component.scss']
})
export class GpuExamplesResizeCanvasComponent implements OnInit {
  @ViewChild('theCanvas', {static: true}) theCanvas!: ElementRef;

  devicePixelRatio = window.devicePixelRatio || 1;

  constructor() { }

  ngOnInit(): void {
    this.draw();
  }

  async draw() {
    const adapter = await navigator.gpu.requestAdapter();
    const device = await adapter!.requestDevice();

    if (this.theCanvas.nativeElement === null) return;
    const context: GPUCanvasContext = (this.theCanvas.nativeElement as HTMLCanvasElement).getContext('webgpu');

    const presentationFormat: GPUTextureFormat = navigator.gpu.getPreferredCanvasFormat();

    this.theCanvas.nativeElement.width = this.theCanvas.nativeElement.clientWidth * this.devicePixelRatio;
    this.theCanvas.nativeElement.height = this.theCanvas.nativeElement.clientHeight * this.devicePixelRatio;

    context.configure({
      device,
      format: presentationFormat,
      alphaMode: 'premultiplied'
    });

    const sampleCount = 4;

    const pipeline: GPURenderPipeline = await device.createRenderPipelineAsync({
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
      multisample: {
        count: 4,
      },
      layout: 'auto'
    });

    let renderTarget: GPUTexture | undefined = undefined;
    let renderTargetView: GPUTextureView;

    this.theCanvas.nativeElement.classList.add('animatedCanvasSize');

    const frame = () => {
      // Sample is no longer the active page.
      if (!this.theCanvas.nativeElement) return;

      const currentWidth = this.theCanvas.nativeElement.clientWidth * this.devicePixelRatio;
      const currentHeight = this.theCanvas.nativeElement.clientHeight * this.devicePixelRatio;

      // The canvas size is animating via CSS.
      // When the size changes, we need to reallocate the render target.
      // We also need to set the physical size of the canvas to match the computed CSS size.
      if (
        (this.theCanvas.nativeElement.width !== currentWidth || this.theCanvas.nativeElement.height !== currentHeight)
        && currentWidth && currentHeight
      ) {
        if (renderTarget !== undefined) {
          // Destroy the previous render target
          renderTarget.destroy();
        }

        this.theCanvas.nativeElement.width = currentWidth;
        this.theCanvas.nativeElement.height = currentHeight;


        renderTarget = device.createTexture({
          size: [this.theCanvas.nativeElement.width, this.theCanvas.nativeElement.height],
          sampleCount,
          format: presentationFormat,
          usage: GPUTextureUsage.RENDER_ATTACHMENT,
        });

        renderTargetView = renderTarget.createView();
      }

      const commandEncoder = device.createCommandEncoder();

      const renderPassDescriptor: GPURenderPassDescriptor = {
        colorAttachments: [
          {
            view: renderTargetView,
            resolveTarget: context.getCurrentTexture().createView(),
            clearValue: { r: 0.2, g: 0.2, b: 0.2, a: 1.0 },
            loadOp: 'clear',
            storeOp: 'store',
          },
        ],
      };

      const passEncoder = commandEncoder.beginRenderPass(renderPassDescriptor);
      passEncoder.setPipeline(pipeline);
      passEncoder.draw(3);
      passEncoder.end();

      device.queue.submit([commandEncoder.finish()]);
      requestAnimationFrame(frame);
    }

    requestAnimationFrame(frame);
  }

}
