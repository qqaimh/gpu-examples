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

  // Associates a glTF node or primitive with its WebGPU resources.
  nodeGpuData = new Map();
  primitiveGpuData = new Map();
  gltf;
  app;
  device: GPUDevice;
  nodeBindGroupLayout;
  gltfPipelineLayout;
  shaderModule;

  constructor(demoApp, gltf) {
    this.gltf = gltf;
    this.app = demoApp;
    this.device = demoApp.device;

    // We need a bind group layout for the transform uniforms of each node.
    this.nodeBindGroupLayout = this.device.createBindGroupLayout({
      label: `glTF Node BindGroupLayout`,
      entries: [{
        binding: 0, // Node uniforms
        visibility: GPUShaderStage.VERTEX,
        buffer: {},
      }],
    });

    // Everything we'll render with these pages can share a single pipeline layout.
    // A more advanced renderer supporting things like skinning or multiple material types
    // may need more.
    this.gltfPipelineLayout = this.device.createPipelineLayout({
      label: 'glTF Pipeline Layout',
      bindGroupLayouts: [
        this.app.frameBindGroupLayout,
        this.nodeBindGroupLayout,
      ]
    });

    // Find every node with a mesh and create a bind group containing the node's transform.
    for (const node of gltf.nodes) {
      if ('mesh' in node) {
        this.setupMeshNode(gltf, node);
      }
    }

    // Loop through each primitive of each mesh and create a compatible WebGPU pipeline.
    for (const mesh of gltf.meshes) {
      for (const primitive of mesh.primitives) {
        this.setupPrimitive(gltf, primitive);
      }
    }
  }

  getShaderModule() {
    // Cache the shader module, since all the pipelines use the same one.
    if (!this.shaderModule) {
      // The shader source used here is intentionally minimal. It just displays the geometry
      // as white with a very simplistic directional lighting based only on vertex normals
      // (just to show the shape of the mesh a bit better.)
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

  setupMeshNode(gltf, node) {
    // Create a uniform buffer for this node and populate it with the node's world transform.
    const nodeUniformBuffer: GPUBuffer = this.device.createBuffer({
      size: 16 * Float32Array.BYTES_PER_ELEMENT,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    });
    this.device.queue.writeBuffer(nodeUniformBuffer, 0, node.worldMatrix);

    // Create a bind group containing the uniform buffer for this node.
    const bindGroup = this.device.createBindGroup({
      label: `glTF Node BindGroup`,
      layout: this.nodeBindGroupLayout,
      entries: [{
        binding: 0, // Node uniforms
        resource: { buffer: nodeUniformBuffer },
      }],
    });

    this.nodeGpuData.set(node, { bindGroup });
  }

  setupPrimitive(gltf, primitive) {
    // Note that these are maps now!
    const bufferLayout = new Map();
    const gpuBuffers = new Map();
    let drawCount = 0;

    // Loop through every attribute in the primitive and build a description of the vertex
    // layout, which is needed to create the render pipeline.
    for (const [attribName, accessorIndex] of Object.entries(primitive.attributes)) {
      const accessor = gltf.accessors[accessorIndex as number];
      const bufferView = gltf.bufferViews[accessor.bufferView];

      // Get the shader location for this attribute. If it doesn't have one skip over the
      // attribute because we don't need it for rendering (yet).
      const shaderLocation = ShaderLocations[attribName];
      if (shaderLocation === undefined) { continue; }

      const offset = accessor.byteOffset;

      let buffer = bufferLayout.get(accessor.bufferView);
      let gpuBuffer;
      // If the delta between attributes falls outside the bufferView's stated arrayStride,
      // then the buffers should be considered separate.
      let separate = buffer && (Math.abs(offset - buffer.attributes[0].offset) >= buffer.arrayStride);
      // If we haven't seen this buffer before OR have decided that is should be separate
      // because its offset is too large, create a new buffer entry for the pipeline's vertex
      // layout.
      if (!buffer || separate) {
        buffer = {
          arrayStride: bufferView.byteStride || TinyGltfWebGpu.packedArrayStrideForAccessor(accessor),
          attributes: [],
        };
        // If the buffers are separate due to offset, don't use the bufferView index to track
        // them. Use the attribName instead, which is guaranteed to be unique.
        bufferLayout.set(separate ? attribName : accessor.bufferView, buffer);
        // We're going to start tracking the gpuBuffers by the buffer layout now rather than
        // the bufferView, since we might end up with multiple buffer layouts all
        // pointing at the same bufferView.
        gpuBuffers.set(buffer, {
          buffer: gltf.gpuBuffers[accessor.bufferView],
          offset
        });
      } else {
        gpuBuffer = gpuBuffers.get(buffer);
        // Track the minimum offset across all attributes that share a buffer.
        gpuBuffer.offset = Math.min(gpuBuffer.offset, offset);
      }

      // Add the attribute to the buffer layout
      buffer.attributes.push({
        shaderLocation,
        format: TinyGltfWebGpu.gpuFormatForAccessor(accessor),
        offset,
      });

      drawCount = accessor.count;
    }

    // For each buffer, normalize the attribute offsets by subtracting the buffer offset from the attribute offsets.
    for (const buffer of bufferLayout.values()) {
      const gpuBuffer = gpuBuffers.get(buffer);
      for (const attribute of buffer.attributes) {
        attribute.offset -= gpuBuffer.offset;
      }
    }

    const gpuPrimitive = {
      // Moved the pipeline creation to a helper function to help keep these code
      // snippets focused.
      pipeline: this.getPipelineForPrimitive(primitive, bufferLayout.values()),
      buffers: [...gpuBuffers.values()],
      drawCount
    };

    // If the primitive has index data, store the index buffer, offset, type, count as well.
    if ('indices' in primitive) {
      const accessor = gltf.accessors[primitive.indices];
      gpuPrimitive['indexBuffer'] = gltf.gpuBuffers[accessor.bufferView];
      gpuPrimitive['indexOffset'] = accessor.byteOffset;
      gpuPrimitive['indexType'] = TinyGltfWebGpu.gpuIndexFormatForComponentType(accessor.componentType);
      gpuPrimitive.drawCount = accessor.count;
    }

    this.primitiveGpuData.set(primitive, gpuPrimitive);
  }

  // Moved the pipeline creation out to a helper function for clarity. This will also help in
  // subsequent samples.
  getPipelineForPrimitive(primitive, bufferLayout) {
    // Create a render pipeline that is compatible with the vertex buffer layout for this
    // primitive. Doesn't yet take into account any material properties.
    const module = this.getShaderModule();
    return this.device.createRenderPipeline({
      label: 'glTF renderer pipeline',
      layout: this.gltfPipelineLayout,
      vertex: {
        module,
        entryPoint: 'vertexMain',
        buffers: bufferLayout,
      },
      primitive: {
        topology: TinyGltfWebGpu.gpuPrimitiveTopologyForMode(primitive.mode),
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
  }

  render(renderPass) {
    // Set a bind group with any necessary per-frame uniforms, such as the perspective and
    // view matrices. (This is managed in tiny-webgpu-demo.js)
    renderPass.setBindGroup(0, this.app.frameBindGroup);

    // Loop through all of the nodes that we created transform uniforms for in the
    // constructor and set those bind groups now.
    for (const [node, gpuNode] of this.nodeGpuData) {
      renderPass.setBindGroup(1, gpuNode.bindGroup);

      // Find the mesh for this node and loop through all of its primitives.
      const mesh = this.gltf.meshes[node.mesh];
      for (const primitive of mesh.primitives) {
        const gpuPrimitive = this.primitiveGpuData.get(primitive);

        // Set the pipeline for this primitive.
        renderPass.setPipeline(gpuPrimitive.pipeline);

        for (const [bufferIndex, gpuBuffer] of Object.entries(gpuPrimitive.buffers)) {
          // Only change to the render loop is that we start setting offsets for the
          // vertex buffers now.
          renderPass.setVertexBuffer(bufferIndex, gpuBuffer['buffer'], gpuBuffer['offset']);
        }

        if (gpuPrimitive.indexBuffer) {
           // If the primitive has indices, set the index buffer and draw indexed geometry.
          renderPass.setIndexBuffer(gpuPrimitive.indexBuffer, gpuPrimitive.indexType, gpuPrimitive.indexOffset);
          renderPass.drawIndexed(gpuPrimitive.drawCount);
        } else {
          // Otherwise draw non-indexed geometry.
          renderPass.draw(gpuPrimitive.drawCount);
        }
      }
    }
  }
}

