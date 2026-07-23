/* Rokon — Ground Floor 3D
   Orchestrator: pull in the shared foundation, build each element in order, wire
   the interaction, and run the render loop. Every element and concern lives in
   its own module — see the folder tree in the README. */
import * as THREE from 'three';
import { scene, camera, renderer, labelRenderer, orbit } from './core/scene.js';
import './core/environment.js';   // bakes the glass reflection env map (side effect)
import './core/lights.js';        // adds hemisphere + sun (side effect)
import { state } from './interaction/state.js';
import { CX, CZ } from './config/dimensions.js';

// --- elements (build order mirrors the original top-to-bottom sequence) ---
import * as ground from './elements/ground/index.js';
import * as roads from './elements/roads/index.js';
import * as roof from './elements/roof/index.js';
import * as zones from './elements/zones/index.js';
import * as walls from './elements/walls/index.js';
import * as columns from './elements/columns/index.js';
import * as shutters from './elements/shutters/index.js';
import * as stair from './elements/stair/index.js';
import * as cantilevers from './elements/cantilevers/index.js';
import * as firstFloor from './elements/first-floor/index.js';
import * as zoneLabels from './annotations/zone-labels.js';
import * as dimensions from './annotations/dimensions.js';

// --- interaction ---
import * as panel from './interaction/panel.js';
import * as selection from './interaction/selection.js';
import * as views from './interaction/views.js';
import * as fly from './interaction/fly.js';
import * as eyeLevel from './interaction/eye-level.js';
import * as compass from './interaction/compass.js';
import * as gui from './interaction/gui.js';
// import { loadModel } from './lib/loadModel.js';   // drop real .glb models in

/* ---------- build the world ---------- */
ground.build();
roads.build();
roof.build();
zones.build();
walls.build();
columns.build();
shutters.build();
stair.build();
cantilevers.build();
firstFloor.build();
zoneLabels.build();
dimensions.build();

/* ---------- wire the UI ---------- */
panel.init();
selection.init();
views.init();
fly.init();
eyeLevel.init();
gui.init();

// Drop a real 3D model into the scene (put .glb files under assets/models/):
// loadModel('assets/models/chair.glb', { position:[20, 0, 30], scale:1, rotationY:Math.PI });

views.setView([CX+115, 6, CZ+28], [CX+6, 13, CZ+6]);   // open on the Main road view

/* ---------- loop ---------- */
const clock = new THREE.Clock();
(function tick(){
  requestAnimationFrame(tick);
  const dt = Math.min(clock.getDelta(), 0.05);
  fly.aimFly(dt);
  fly.moveFly(dt);
  if (!state.flying && !state.headLook) orbit.update();
  compass.update();
  renderer.render(scene, camera);
  labelRenderer.render(scene, camera);
})();
