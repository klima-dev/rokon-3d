/* One place that decides whether to run the cheaper "low-power" render path.
   Touch devices (phones/tablets) report a coarse pointer; their GPUs choke on
   the things desktop handles fine — the transmission (refraction) glass, big
   soft shadow maps, high pixel ratios, and logarithmicDepthBuffer — which shows
   up as stutter, heat, or a dropped WebGL context (black screen).

   When LOW_POWER is true, core/scene.js, core/lights.js and core/materials.js
   each dial their own cost down. Desktop is completely unaffected. */
export const LOW_POWER =
  typeof matchMedia !== 'undefined' && matchMedia('(pointer: coarse)').matches;
