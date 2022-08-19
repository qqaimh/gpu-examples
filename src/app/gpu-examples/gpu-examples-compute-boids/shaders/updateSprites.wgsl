struct Particle {
  pos : vec2<f32>,
  vel : vec2<f32>,
};

struct SimParams {
  deltaT : f32,
  rule1Distance : f32,
  rule2Distance : f32,
  rule3Distance : f32,
  rule1Scale : f32,
  rule2Scale : f32,
  rule3Scale : f32,
};

struct Particles {
  particles : array<Particle>,
};

@binding(0) @group(0) var<uniform> params : SimParams;
@binding(1) @group(0) var<storage, read> particlesA : Particles;
@binding(2) @group(0) var<storage, read_write> particlesB : Particles;

// https://github.com/austinEng/Project6-Vulkan-Flocking/blob/master/data/shaders/computeparticles/particle.comp
@compute @workgroup_size(64)
fn main(@builtin(global_invocation_id) GlobalInvocationID : vec3<u32>) {
  var index : u32 = GlobalInvocationID.x;

  var vPos = particlesA.particles[index].pos;
  var vVel = particlesA.particles[index].vel;
  var cMass = vec2<f32>(0.0, 0.0);
  var cVel = vec2<f32>(0.0, 0.0);
  var colVel = vec2<f32>(0.0, 0.0);
  var cMassCount : u32 = 0u;
  var cVelCount : u32 = 0u;
  var pos : vec2<f32>;
  var vel : vec2<f32>;

  // 遍历鸟群中的所有个体，与当前计算的鸟类个体按规则进行运动
  for (var i : u32 = 0u; i < arrayLength(&particlesA.particles); i = i + 1u) {
    if (i == index) {
      continue;
    }

    pos = particlesA.particles[i].pos.xy;
    vel = particlesA.particles[i].vel.xy;
    if (distance(pos, vPos) < params.rule1Distance) {
      // 将和当前鸟在一个鸟群的鸟的位置xy进行加和，存在cMass中
      cMass = cMass + pos;
      cMassCount = cMassCount + 1u;
    }
    if (distance(pos, vPos) < params.rule2Distance) {
      // 靠得太近就分开一些
      colVel = colVel - (pos - vPos);
    }
    if (distance(pos, vPos) < params.rule3Distance) {
      // 将和当前鸟在一个鸟群的鸟的速度矢量的xy进行加和，存在cVel中
      cVel = cVel + vel;
      cVelCount = cVelCount + 1u;
    }
  }

  if (cMassCount > 0u) {
    // 求出当前鸟所在鸟群的中心点，存在cMass中
    var temp = f32(cMassCount);
    cMass = (cMass / vec2<f32>(temp, temp)) - vPos;
  }
  if (cVelCount > 0u) {
    // 求出当前鸟所在鸟群的平均速度矢量，存在cVel中
    var temp = f32(cVelCount);
    cVel = cVel / vec2<f32>(temp, temp);
  }
  vVel = vVel + (cMass * params.rule1Scale) + (colVel * params.rule2Scale) + (cVel * params.rule3Scale);

  // 限制速度范围
  vVel = normalize(vVel) * clamp(length(vVel), 0.0, 0.1);
  // 更新位置信息
  vPos = vPos + (vVel * params.deltaT);
  // 越界处理
  if (vPos.x < -1.0) {
    vPos.x = 1.0;
  }
  if (vPos.x > 1.0) {
    vPos.x = -1.0;
  }
  if (vPos.y < -1.0) {
    vPos.y = 1.0;
  }
  if (vPos.y > 1.0) {
    vPos.y = -1.0;
  }
  // 将计算结果写回Buffer中
  particlesB.particles[index].pos = vPos;
  particlesB.particles[index].vel = vVel;
}
