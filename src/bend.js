// World-bend shader patch. Every built-in material (including the internal shadow depth
// material) is patched via Material.prototype.onBeforeCompile so that the road, sidewalks,
// buildings, vehicles, people and props are displaced sideways by the same smooth function
// of their distance ahead of the player. Gameplay logic never sees the bend.
//
// It also provides optional world-scale ("wuv") texture coordinates: walls, sidewalks and
// shutters keep a constant brick/tile size however a box is scaled, and don't swim.
import { BEND_N, BEND_STEP } from './road-path.js';

export const GLSL_COMMON = `
uniform float uBend[${BEND_N}];
uniform float uWuv;
float bendX(float z){
  float a = abs(4.0 - z);
  float f = min(a / ${BEND_STEP}.0, ${BEND_N - 2}.999);
  int i = int(floor(f));
  float t = f - float(i);
  float p0 = uBend[max(i - 1, 0)];
  float p1 = uBend[i];
  float p2 = uBend[min(i + 1, ${BEND_N - 1})];
  float p3 = uBend[min(i + 2, ${BEND_N - 1})];
  return 0.5 * ((2.0 * p1) + (-p0 + p2) * t + (2.0 * p0 - 5.0 * p1 + 4.0 * p2 - p3) * t * t + (-p0 + 3.0 * p1 - 3.0 * p2 + p3) * t * t * t);
}
`;
export const GLSL_BEGIN = `
{
  vec3 _wp = (modelMatrix * vec4(transformed, 1.0)).xyz;
  float _bx = bendX(_wp.z);
  transformed += inverse(mat3(modelMatrix)) * vec3(_bx, 0.0, 0.0);
}
`;
export const GLSL_WUV = `
#ifdef USE_MAP
{
  vec3 _sc = vec3(length(modelMatrix[0].xyz), length(modelMatrix[1].xyz), length(modelMatrix[2].xyz));
  vec3 _lp = position * _sc;
  vec2 _uv = abs(normal.x) > 0.5 ? _lp.zy : (abs(normal.z) > 0.5 ? _lp.xy : _lp.xz);
  vMapUv = _uv * uWuv;
}
#endif
`;

export function installBend(THREE, { enabled = true } = {}) {
  const U = { value: new Float32Array(BEND_N) };
  const state = { on: enabled, U, failed: false };
  const MP = THREE.Material.prototype;
  MP.customProgramCacheKey = function () {
    const ud = this.userData || {};
    return 'bend2' + (state.on ? '' : 'off') + (ud.wuv ? 'W' : '') + (ud.nobend ? 'N' : '');
  };
  MP.onBeforeCompile = function (shader) {
    if (!state.on || !shader || typeof shader.vertexShader !== 'string') return;
    const ud = this.userData || {};
    let v = shader.vertexShader;
    if (!v.includes('#include <begin_vertex>') || !v.includes('#include <common>')) return;
    shader.uniforms.uBend = U;
    shader.uniforms.uWuv = { value: ud.wuv || 1 };
    v = v.replace('#include <common>', '#include <common>\n' + GLSL_COMMON);
    if (!ud.nobend) v = v.replace('#include <begin_vertex>', '#include <begin_vertex>\n' + GLSL_BEGIN);
    if (ud.wuv && v.includes('#include <uv_vertex>')) v = v.replace('#include <uv_vertex>', '#include <uv_vertex>\n' + GLSL_WUV);
    shader.vertexShader = v;
  };
  // Safety net: if a driver rejects the patched shader, switch the bend off and recompile.
  state.disable = (scene, renderer, sun) => {
    if (!state.on) return;
    state.on = false; state.failed = true;
    try { if (renderer) renderer.shadowMap.enabled = false; if (sun) sun.castShadow = false; } catch (e) {}
    try { scene.traverse(o => { const m = o.material; if (m) (Array.isArray(m) ? m : [m]).forEach(x => { x.needsUpdate = true; }); }); } catch (e) {}
  };
  return state;
}
