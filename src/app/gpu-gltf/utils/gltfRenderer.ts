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
  instanceBindGroupLayout;
  gltfPipelineLayout;
  instanceBindGroup;
  shaderModule;

  constructor(demoApp, gltf) {
    this.app = demoApp;
    this.device = demoApp.device;

    this.instanceBindGroupLayout = this.device.createBindGroupLayout({
      label: `glTF Instance BindGroupLayout`,
      entries: [{
        binding: 0, // Node uniforms
        visibility: GPUShaderStage.VERTEX,
        buffer: { type: 'read-only-storage' },
      }],
    });

    this.gltfPipelineLayout = this.device.createPipelineLayout({
      label: 'glTF Pipeline Layout',
      bindGroupLayouts: [
        this.app.frameBindGroupLayout,
        this.instanceBindGroupLayout,
      ]
    });

    const primitiveInstances = {
      matrices: new Map(), // The instance matrices for each primitive.
      total: 0, // The total number of instance matrices.
      arrayBuffer: null, // The array buffer that the matrices will be placed in.
      offset: 0, // The offset (in matrices) of the last matrix written into arrayBuffer.
    };

    for (const node of gltf.nodes) {
      if ('mesh' in node) {
        this.setupMeshNode(gltf, node, primitiveInstances);
      }
    }

    // Create a buffer large enough to contain all the instance matrices for the entire scene.
    const instanceBuffer = this.device.createBuffer({
      size: 16 * Float32Array.BYTES_PER_ELEMENT * primitiveInstances.total,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
      mappedAtCreation: true,
    });

    // Map the instance matrices buffer so we can write all the matrices into it.
    primitiveInstances.arrayBuffer = new Float32Array(instanceBuffer.getMappedRange());

    for (const mesh of gltf.meshes) {
      for (const primitive of mesh.primitives) {
        this.setupPrimitive(gltf, primitive, primitiveInstances);
      }
    }

    // Unmap the buffer when we're finished writing all the instance matrices.
    instanceBuffer.unmap();

    // Create a bind group for the instance buffer.
    this.instanceBindGroup = this.device.createBindGroup({
      label: `glTF Instance BindGroup`,
      layout: this.instanceBindGroupLayout,
      entries: [{
        binding: 0, // Instance storage buffer
        resource: { buffer: instanceBuffer },
      }],
    });
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

        @group(1) @binding(0) var<storage> model : array<mat4x4<f32>>;

        struct VertexInput {
          @builtin(instance_index) instance : u32,
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

          let modelMatrix = model[input.instance];
          output.position = camera.projection * camera.view * modelMatrix * vec4(input.position, 1.0);
          output.normal = normalize((camera.view * modelMatrix * vec4(input.normal, 0.0)).xyz);

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
    const mesh = gltf.meshes[node.mesh];
    for (const primitive of mesh.primitives) {
      let instances = primitiveInstances.matrices.get(primitive);
      if (!instances) {
        instances = [];
        primitiveInstances.matrices.set(primitive, instances);
      }
      instances.push(node.worldMatrix);
    }
    // Make sure to add the number of matrices used for this mesh to the total.
    primitiveInstances.total += mesh.primitives.length;
  }

  setupPrimitiveInstances(primitive, primitiveInstances) {
    // Get the list of instance transform matricies for this primitive.
    const instances = primitiveInstances.matrices.get(primitive);

    const first = primitiveInstances.offset;
    const count = instances.length;

    // Place the matrices in the instances buffer at the given offset.
    for (let i = 0; i < count; ++i) {
      primitiveInstances.arrayBuffer.set(instances[i], (first + i) * 16);
    }

    // Update the offset for the next primitive.
    primitiveInstances.offset += count;

    // Return the index of the first instance and the count.
    return { first, count };
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

    // Sort the attributes and buffers
    for (const buffer of bufferLayout.values()) {
      const gpuBuffer = gpuBuffers.get(buffer);
      for (const attribute of buffer.attributes) {
        attribute.offset -= gpuBuffer.offset;
      }
      buffer.attributes = buffer.attributes.sort((a, b) => {
        return a.shaderLocation - b.shaderLocation;
      });
    }
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
      instances: this.setupPrimitiveInstances(primitive, primitiveInstances),
    };

    if ('indices' in primitive) {
      const accessor = gltf.accessors[primitive.indices];
      gpuPrimitive['indexBuffer'] = gltf.gpuBuffers[accessor.bufferView];
      gpuPrimitive['indexOffset'] = accessor.byteOffset;
      gpuPrimitive['indexType'] = TinyGltfWebGpu.gpuIndexFormatForComponentType(accessor.componentType);
      gpuPrimitive.drawCount = accessor.count;
    }

    const pipelineArgs = this.getPipelineArgs(primitive, sortedBufferLayout);
    const pipeline = this.getPipelineForPrimitive(pipelineArgs);
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

    // Set the bind group containing all of the instance transforms.
    renderPass.setBindGroup(1, this.instanceBindGroup);

    for (const gpuPipeline of this.pipelineGpuData.values()) {
      renderPass.setPipeline(gpuPipeline.pipeline);

      for (const gpuPrimitive of gpuPipeline.primitives) {
        for (const [bufferIndex, gpuBuffer] of Object.entries(gpuPrimitive.buffers)) {
          renderPass.setVertexBuffer(bufferIndex, gpuBuffer['buffer'], gpuBuffer['offset']);
        }
        if (gpuPrimitive.indexBuffer) {
          renderPass.setIndexBuffer(gpuPrimitive.indexBuffer, gpuPrimitive.indexType, gpuPrimitive.indexOffset);
        }

        // Every time we draw, pass an offset (in instances) into the instance buffer as the
        // "firstInstance" argument. This will change the initial instance_index passed to the
        // shader and ensure we pull the right transform matrices from the buffer.
        if (gpuPrimitive.indexBuffer) {
          renderPass.drawIndexed(gpuPrimitive.drawCount, gpuPrimitive.instances.count, 0, 0, gpuPrimitive.instances.first);
        } else {
          renderPass.draw(gpuPrimitive.drawCount, gpuPrimitive.instances.count, 0, gpuPrimitive.instances.first);
        }
      }
    }
  }
}