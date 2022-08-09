import { TinyGltfWebGpu } from './tiny-gltf'

import commonWGSL from '../shaders/common.wgsl';

// We can map the attributes to any location index we want as long as we're consistent
// between the pipeline definitions and the shader source.
const ShaderLocations = {
  POSITION: 0,
  NORMAL: 1,
};

// This renderer class will handle the bits of the glTF loading/rendering that we're most
// interested in. Specifically: Creating the necessary pipelines and bind groups and
// performing the actuall bind and draw calls during the render loop.
export class GltfRenderer {
  // Not bothering with textures in this sample, so skip loading them.
  static loadImageSlots = [];

  pipelineGpuData = new Map();

  app;
  device;
  nodeBindGroupLayout;
  gltfPipelineLayout;
  shaderModule;

  constructor(demoApp, gltf) {
    this.app = demoApp;
    this.device = demoApp.device;

    this.nodeBindGroupLayout = this.device.createBindGroupLayout({
      label: `glTF Node BindGroupLayout`,
      entries: [{
        binding: 0, // Node uniforms
        visibility: GPUShaderStage.VERTEX,
        buffer: {},
      }],
    });

    this.gltfPipelineLayout = this.device.createPipelineLayout({
      label: 'glTF Pipeline Layout',
      bindGroupLayouts: [
        this.app.frameBindGroupLayout,
        this.nodeBindGroupLayout,
      ]
    });

    const primitiveInstances = new Map();

    for (const node of gltf.nodes) {
      if ('mesh' in node) {
        this.setupMeshNode(gltf, node, primitiveInstances);
      }
    }

    for (const mesh of gltf.meshes) {
      for (const primitive of mesh.primitives) {
        this.setupPrimitive(gltf, primitive, primitiveInstances);
      }
    }
  }

  getShaderModule() {
    if (!this.shaderModule) {
      const code = `
              struct Camera {
                projection : mat4x4<f32>,
                view : mat4x4<f32>,
                position : vec3<f32>,
                time : f32,
              };
              @group(0) @binding(0) var<uniform> camera : Camera;

              @group(1) @binding(0) var<uniform> model : mat4x4<f32>;

              struct VertexInput {
                @location(${ShaderLocations.POSITION}) position : vec3<f32>,
                @location(${ShaderLocations.NORMAL}) normal : vec3<f32>,
              };

              struct VertexOutput {
                @builtin(position) position : vec4<f32>,
                @location(0) normal : vec3<f32>,
              };

              @vertex
              fn vertexMain(input : VertexInput) -> VertexOutput {
                var output : VertexOutput;

                output.position = camera.projection * camera.view * model * vec4(input.position, 1.0);
                output.normal = normalize((camera.view * model * vec4(input.normal, 0.0)).xyz);

                return output;
              }

              // Some hardcoded lighting
              const lightDir = vec3(0.25, 0.5, 1.0);
              const lightColor = vec3(1.0, 1.0, 1.0);
              const ambientColor = vec3(0.1, 0.1, 0.1);

              @fragment
              fn fragmentMain(input : VertexOutput) -> @location(0) vec4<f32> {
                // An extremely simple directional lighting model, just to give our model some shape.
                let N = normalize(input.normal);
                let L = normalize(lightDir);
                let NDotL = max(dot(N, L), 0.0);
                let surfaceColor = ambientColor + NDotL;

                return vec4(surfaceColor, 1.0);
              }
            `;

      this.shaderModule = this.device.createShaderModule({
        label: 'Simple glTF rendering shader module',
        code,
      });
    }

    return this.shaderModule;
  }

  setupMeshNode(gltf, node, primitiveInstances) {
    const nodeUniformBuffer = this.device.createBuffer({
      size: 16 * Float32Array.BYTES_PER_ELEMENT,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    });
    this.device.queue.writeBuffer(nodeUniformBuffer, 0, node.worldMatrix);

    const bindGroup = this.device.createBindGroup({
      label: `glTF Node BindGroup`,
      layout: this.nodeBindGroupLayout,
      entries: [{
        binding: 0, // Node uniforms
        resource: { buffer: nodeUniformBuffer },
      }],
    });

    // Loop through every primitive of the node's mesh and append this node's transform to
    // the primitives instance list.
    const mesh = gltf.meshes[node.mesh];
    for (const primitive of mesh.primitives) {
      let instances = primitiveInstances.get(primitive);
      if (!instances) {
        instances = [];
        primitiveInstances.set(primitive, instances);
      }
      instances.push(bindGroup);
    }
  }

  setupPrimitive(gltf, primitive, primitiveInstances) {
    const bufferLayout = new Map();
    const gpuBuffers = new Map();
    let drawCount = 0;

    for (const [attribName, accessorIndex] of Object.entries(primitive.attributes)) {
      const accessor = gltf.accessors[accessorIndex as number];
      const bufferView = gltf.bufferViews[accessor.bufferView];

      const shaderLocation = ShaderLocations[attribName];
      if (shaderLocation === undefined) { continue; }

      const offset = accessor.byteOffset;

      let buffer = bufferLayout.get(accessor.bufferView);
      let gpuBuffer;

      let separate = buffer && (Math.abs(offset - buffer.attributes[0].offset) >= buffer.arrayStride);
      if (!buffer || separate) {
        buffer = {
          arrayStride: bufferView.byteStride || TinyGltfWebGpu.packedArrayStrideForAccessor(accessor),
          attributes: [],
        };

        bufferLayout.set(separate ? attribName : accessor.bufferView, buffer);
        gpuBuffers.set(buffer, {
          buffer: gltf.gpuBuffers[accessor.bufferView],
          offset
        });
      } else {
        gpuBuffer = gpuBuffers.get(buffer);
        gpuBuffer.offset = Math.min(gpuBuffer.offset, offset);
      }

      buffer.attributes.push({
        shaderLocation,
        format: TinyGltfWebGpu.gpuFormatForAccessor(accessor),
        offset,
      });

      drawCount = accessor.count;
    }

    for (const buffer of bufferLayout.values()) {
      const gpuBuffer = gpuBuffers.get(buffer);
      for (const attribute of buffer.attributes) {
        attribute.offset -= gpuBuffer.offset;
      }
      // Sort the attributes by shader location.
      buffer.attributes = buffer.attributes.sort((a, b) => {
        return a.shaderLocation - b.shaderLocation;
      });
    }
    // Sort the buffers by their first attribute's shader location.
    const sortedBufferLayout = [...bufferLayout.values()].sort((a, b) => {
      return a.attributes[0].shaderLocation - b.attributes[0].shaderLocation;
    });

    // Ensure that the gpuBuffers are saved in the same order as the buffer layout.
    const sortedGpuBuffers = [];
    for (const buffer of sortedBufferLayout) {
      sortedGpuBuffers.push(gpuBuffers.get(buffer));
    }

    const gpuPrimitive = {
      buffers: sortedGpuBuffers,
      drawCount,
      // Start tracking every transform that this primitive should be rendered with.
      instances: primitiveInstances.get(primitive),
    };

    if ('indices' in primitive) {
      const accessor = gltf.accessors[primitive.indices];
      gpuPrimitive['indexBuffer'] = gltf.gpuBuffers[accessor.bufferView];
      gpuPrimitive['indexOffset'] = accessor.byteOffset;
      gpuPrimitive['indexType'] = TinyGltfWebGpu.gpuIndexFormatForComponentType(accessor.componentType);
      gpuPrimitive.drawCount = accessor.count;
    }

    // Make sure to pass the sorted buffer layout here.
    const pipelineArgs = this.getPipelineArgs(primitive, sortedBufferLayout);
    const pipeline = this.getPipelineForPrimitive(pipelineArgs);

    // Don't need to link the primitive and gpuPrimitive any more, but we do need
    // to add the gpuPrimitive to the pipeline's list of primitives.
    pipeline.primitives.push(gpuPrimitive);
  }

  getPipelineArgs(primitive, buffers) {
    return {
      topology: TinyGltfWebGpu.gpuPrimitiveTopologyForMode(primitive.mode),
      buffers,
    };
  }

  getPipelineForPrimitive(args) {
    const key = JSON.stringify(args);

    let pipeline = this.pipelineGpuData.get(key);
    if (pipeline) {
      return pipeline;
    }

    const module = this.getShaderModule();
    pipeline = this.device.createRenderPipeline({
      label: 'glTF renderer pipeline',
      layout: this.gltfPipelineLayout,
      vertex: {
        module,
        entryPoint: 'vertexMain',
        buffers: args.buffers,
      },
      primitive: {
        topology: args.topology,
        cullMode: 'back',
      },
      multisample: {
        count: this.app.sampleCount,
      },
      depthStencil: {
        format: this.app.depthFormat,
        depthWriteEnabled: true,
        depthCompare: 'less',
      },
      fragment: {
        module,
        entryPoint: 'fragmentMain',
        targets: [{
          format: this.app.colorFormat,
        }],
      },
    });

    const gpuPipeline = {
      pipeline,
      primitives: [] // Start tracking every primitive that uses this pipeline.
    };

    this.pipelineGpuData.set(key, gpuPipeline);

    return gpuPipeline;
  }

  render(renderPass) {
    renderPass.setBindGroup(0, this.app.frameBindGroup);

    for (const gpuPipeline of this.pipelineGpuData.values()) {
      renderPass.setPipeline(gpuPipeline.pipeline);

      for (const gpuPrimitive of gpuPipeline.primitives) {
        for (const [bufferIndex, gpuBuffer] of Object.entries(gpuPrimitive.buffers)) {
          renderPass.setVertexBuffer(bufferIndex, gpuBuffer['buffer'], gpuBuffer['offset']);
        }
        if (gpuPrimitive.indexBuffer) {
          renderPass.setIndexBuffer(gpuPrimitive.indexBuffer, gpuPrimitive.indexType, gpuPrimitive.indexOffset);
        }

        for (const bindGroup of gpuPrimitive.instances) {
          renderPass.setBindGroup(1, bindGroup);

          if (gpuPrimitive.indexBuffer) {
            renderPass.drawIndexed(gpuPrimitive.drawCount);
          } else {
            renderPass.draw(gpuPrimitive.drawCount);
          }
        }
      }
    }
  }
}