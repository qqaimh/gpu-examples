import { TinyGltfWebGpu } from './tiny-gltf'

import commonWGSL from '../shaders/common.wgsl';

import { wgsl } from '../../../../node_modules/wgsl-preprocessor/wgsl-preprocessor.js';

// We can map the attributes to any location index we want as long as we're consistent
// between the pipeline definitions and the shader source.
// Shader locations and source are unchanged from the previous sample.
const ShaderLocations = {
  POSITION: 0,
  NORMAL: 1,
  // Add texture coordinates to the list of attributes we care about.
  TEXCOORD_0: 2
};

function createSolidColorTexture(device, r, g, b, a) {
  const data = new Uint8Array([r * 255, g * 255, b * 255, a * 255]);
  const texture = device.createTexture({
    size: { width: 1, height: 1 },
    format: 'rgba8unorm',
    usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST
  });
  device.queue.writeTexture({ texture }, data, {}, { width: 1, height: 1 });
  return texture;
}

// This renderer class will handle the bits of the glTF loading/rendering that we're most
// interested in. Specifically: Creating the necessary pipelines and bind groups and
// performing the actuall bind and draw calls during the render loop.
export class GltfRenderer {
  static loadImageSlots = ['baseColorTexture'];

  pipelineGpuData = new Map();
  shaderModules = new Map();

  app;
  device: GPUDevice;
  instanceBindGroupLayout: GPUBindGroupLayout;
  materialBindGroupLayout: GPUBindGroupLayout;
  gltfPipelineLayout;
  opaqueWhiteTexture;
  instanceBindGroup;

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

    this.materialBindGroupLayout = this.device.createBindGroupLayout({
      label: `glTF Material BindGroupLayout`,
      entries: [{
        binding: 0, // Material uniforms
        visibility: GPUShaderStage.FRAGMENT,
        buffer: {},
      }, {
        binding: 1, // Texture sampler
        visibility: GPUShaderStage.FRAGMENT,
        sampler: {},
      }, {
        binding: 2, // BaseColor texture
        visibility: GPUShaderStage.FRAGMENT,
        texture: {},
      }], // Omitting additional material properties for simplicity
    });

    this.gltfPipelineLayout = this.device.createPipelineLayout({
      label: 'glTF Pipeline Layout',
      bindGroupLayouts: [
        this.app.frameBindGroupLayout,
        this.instanceBindGroupLayout,
        this.materialBindGroupLayout,
      ]
    });

    const primitiveInstances = {
      matrices: new Map(),
      total: 0,
      arrayBuffer: null,
      offset: 0,
    };

    for (const node of gltf.nodes) {
      if ('mesh' in node) {
        this.setupMeshNode(gltf, node, primitiveInstances);
      }
    }

    this.opaqueWhiteTexture = createSolidColorTexture(this.device, 1, 1, 1, 1);

    const materialGpuData = new Map();
    for (const material of gltf.materials) {
      this.setupMaterial(gltf, material, materialGpuData);
    }

    // Create a buffer large enough to contain all the instance matrices for the entire scene.
    const instanceBuffer = this.device.createBuffer({
      size: 16 * Float32Array.BYTES_PER_ELEMENT * primitiveInstances.total,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
      mappedAtCreation: true,
    });

    primitiveInstances.arrayBuffer = new Float32Array(instanceBuffer.getMappedRange());

    for (const mesh of gltf.meshes) {
      for (const primitive of mesh.primitives) {
        this.setupPrimitive(gltf, primitive, primitiveInstances, materialGpuData);
      }
    }

    instanceBuffer.unmap();

    this.instanceBindGroup = this.device.createBindGroup({
      label: `glTF Instance BindGroup`,
      layout: this.instanceBindGroupLayout,
      entries: [{
        binding: 0, // Instance storage buffer
        resource: { buffer: instanceBuffer },
      }],
    });
  }

  getShaderModule(args) {
    const key = JSON.stringify(args);

    let shaderModule = this.shaderModules.get(key);
    if (!shaderModule) {
      const code = wgsl`
              struct Camera {
                projection : mat4x4<f32>,
                view : mat4x4<f32>,
                position : vec3<f32>,
                time : f32,
              };
              @group(0) @binding(0) var<uniform> camera : Camera;

              @group(1) @binding(0) var<storage> model : array<mat4x4<f32>>;

              struct Material {
                baseColorFactor : vec4<f32>,
                alphaCutoff: f32,
              };
              @group(2) @binding(0) var<uniform> material : Material;
              @group(2) @binding(1) var materialSampler : sampler;
              @group(2) @binding(2) var baseColorTexture : texture_2d<f32>;

              struct VertexInput {
                @builtin(instance_index) instance : u32,
                @location(${ShaderLocations.POSITION}) position : vec3<f32>,
                @location(${ShaderLocations.NORMAL}) normal : vec3<f32>,

                #if ${args.hasTexcoord}
                  @location(${ShaderLocations.TEXCOORD_0}) texcoord : vec2<f32>,
                #endif
              };

              struct VertexOutput {
                @builtin(position) position : vec4<f32>,
                @location(0) normal : vec3<f32>,
                @location(1) texcoord : vec2<f32>,
              };

              @vertex
              fn vertexMain(input : VertexInput) -> VertexOutput {
                var output : VertexOutput;

                let modelMatrix = model[input.instance];
                output.position = camera.projection * camera.view * modelMatrix * vec4(input.position, 1.0);
                output.normal = normalize((camera.view * modelMatrix * vec4(input.normal, 0.0)).xyz);

                #if ${args.hasTexcoord}
                  output.texcoord = input.texcoord;
                #else
                  output.texcoord = vec2(0.0);
                #endif

                return output;
              }

              // Some hardcoded lighting
              const lightDir = vec3(0.25, 0.5, 1.0);
              const lightColor = vec3(1.0, 1.0, 1.0);
              const ambientColor = vec3(0.1, 0.1, 0.1);

              @fragment
              fn fragmentMain(input : VertexOutput) -> @location(0) vec4<f32> {
                let baseColor = textureSample(baseColorTexture, materialSampler, input.texcoord) * material.baseColorFactor;

                #if ${args.useAlphaCutoff}
                  // If the alpha mode is MASK discard any fragments below the alpha cutoff.
                  if (baseColor.a < material.alphaCutoff) {
                    discard;
                  }
                #endif

                // An extremely simple directional lighting model, just to give our model some shape.
                let N = normalize(input.normal);
                let L = normalize(lightDir);
                let NDotL = max(dot(N, L), 0.0);
                let surfaceColor = (baseColor.rgb * ambientColor) + (baseColor.rgb * NDotL);

                return vec4(surfaceColor, baseColor.a);
              }
            `;

      shaderModule = this.device.createShaderModule({
        label: 'Simple glTF rendering shader module',
        code,
      });
      this.shaderModules.set(key, shaderModule);
    }

    return shaderModule;
  }

  setupMaterial(gltf, material, materialGpuData) {
    // Create a uniform buffer for this material and populate it with the material properties.
    const materialUniformBuffer = this.device.createBuffer({
      size: 5 * Float32Array.BYTES_PER_ELEMENT,
      usage: GPUBufferUsage.UNIFORM,
      mappedAtCreation: true,
    });
    const materialBufferArray = new Float32Array(materialUniformBuffer.getMappedRange());
    materialBufferArray.set(material.pbrMetallicRoughness?.baseColorFactor || [1, 1, 1, 1]);
    materialBufferArray[4] = material.alphaCutoff || 0.5;
    materialUniformBuffer.unmap();

    let baseColor = gltf.gpuTextures[material.pbrMetallicRoughness?.baseColorTexture?.index];
    if (!baseColor) {
      baseColor = {
        texture: this.opaqueWhiteTexture,
        sampler: gltf.gpuDefaultSampler,
      };
    }

    const bindGroup = this.device.createBindGroup({
      label: `glTF Material BindGroup`,
      layout: this.materialBindGroupLayout,
      entries: [{
        binding: 0, // Material uniforms
        resource: { buffer: materialUniformBuffer },
      }, {
        binding: 1, // Sampler
        resource: baseColor.sampler,
      }, {
        binding: 2, // BaseColor
        resource: baseColor.texture.createView(),
      }],
    });

    materialGpuData.set(material, {
      bindGroup,
    });
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
    primitiveInstances.total += mesh.primitives.length;
  }

  setupPrimitiveInstances(primitive, primitiveInstances) {
    const instances = primitiveInstances.matrices.get(primitive);

    const first = primitiveInstances.offset;
    const count = instances.length;

    for (let i = 0; i < count; ++i) {
      primitiveInstances.arrayBuffer.set(instances[i], (first + i) * 16);
    }

    primitiveInstances.offset += count;

    return { first, count };
  }

  setupPrimitive(gltf, primitive, primitiveInstances, materialGpuData) {
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
      instances: this.setupPrimitiveInstances(primitive, primitiveInstances),
    };

    if ('indices' in primitive) {
      const accessor = gltf.accessors[primitive.indices];
      gpuPrimitive['indexBuffer'] = gltf.gpuBuffers[accessor.bufferView];
      gpuPrimitive['indexOffset'] = accessor.byteOffset;
      gpuPrimitive['indexType'] = TinyGltfWebGpu.gpuIndexFormatForComponentType(accessor.componentType);
      gpuPrimitive.drawCount = accessor.count;
    }

    const material = gltf.materials[primitive.material];
    const gpuMaterial = materialGpuData.get(material);

    // Start passing the material when generating pipeline args.
    const pipelineArgs = this.getPipelineArgs(primitive, sortedBufferLayout, material);
    const pipeline = this.getPipelineForPrimitive(pipelineArgs);

    // Rather than just storing a list of primitives for each pipeline store a map of
    // materials which use the pipeline to the primitives that use the material.
    let materialPrimitives = pipeline.materialPrimitives.get(gpuMaterial);
    if (!materialPrimitives) {
      materialPrimitives = [];
      pipeline.materialPrimitives.set(gpuMaterial, materialPrimitives);
    }

    // Add the primitive to the list of primitives for this material.
    materialPrimitives.push(gpuPrimitive);
  }

  getPipelineArgs(primitive, buffers, material) {
    return {
      topology: TinyGltfWebGpu.gpuPrimitiveTopologyForMode(primitive.mode),
      buffers,
      doubleSided: material.doubleSided,
      alphaMode: material.alphaMode,
      // These values specifically will be passed to shader module creation.
      shaderArgs: {
        hasTexcoord: 'TEXCOORD_0' in primitive.attributes,
        useAlphaCutoff: material.alphaMode == 'MASK',
      },
    };
  }

  getPipelineForPrimitive(args) {
    const key = JSON.stringify(args);

    let pipeline = this.pipelineGpuData.get(key);
    if (pipeline) {
      return pipeline;
    }

    // Define the alpha blending behavior.
    let blend = undefined;
    if (args.alphaMode == 'BLEND') {
      blend = {
        color: {
          srcFactor: 'src-alpha',
          dstFactor: 'one-minus-src-alpha',
        },
        alpha: {
          // This just prevents the canvas from having alpha "holes" in it.
          srcFactor: 'one',
          dstFactor: 'one',
        }
      }
    }

    const module = this.getShaderModule(args.shaderArgs);
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
        // Make sure to apply the appropriate culling mode
        cullMode: args.doubleSided ? 'none' : 'back',
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
          // Apply the necessary blending
          blend,
        }],
      },
    });

    const gpuPipeline = {
      pipeline,
      // Cache a map of materials to the primitives that used them for each pipeline.
      materialPrimitives: new Map(),
    };

    this.pipelineGpuData.set(key, gpuPipeline);

    return gpuPipeline;
  }

  render(renderPass) {
    renderPass.setBindGroup(0, this.app.frameBindGroup);
    renderPass.setBindGroup(1, this.instanceBindGroup);

    for (const gpuPipeline of this.pipelineGpuData.values()) {
      renderPass.setPipeline(gpuPipeline.pipeline);

      // Loop through every material that uses this pipeline and get an array of primitives
      // that uses that material.
      for (const [material, primitives] of gpuPipeline.materialPrimitives.entries()) {
        // Set the material bind group.
        renderPass.setBindGroup(2, material.bindGroup);

        // Loop through the primitives that use the current material/pipeline combo and draw
        // them as usual.
        for (const gpuPrimitive of primitives) {
          for (const [bufferIndex, gpuBuffer] of Object.entries(gpuPrimitive.buffers)) {
            renderPass.setVertexBuffer(bufferIndex, gpuBuffer['buffer'], gpuBuffer['offset']);
          }
          if (gpuPrimitive.indexBuffer) {
            renderPass.setIndexBuffer(gpuPrimitive.indexBuffer, gpuPrimitive.indexType, gpuPrimitive.indexOffset);
          }

          if (gpuPrimitive.indexBuffer) {
            renderPass.drawIndexed(gpuPrimitive.drawCount, gpuPrimitive.instances.count, 0, 0, gpuPrimitive.instances.first);
          } else {
            renderPass.draw(gpuPrimitive.drawCount, gpuPrimitive.instances.count, 0, gpuPrimitive.instances.first);
          }
        }
      }
    }
  }
}