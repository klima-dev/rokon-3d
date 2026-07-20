import { camera, orbit, renderer } from '../core/scene.js';
import { state } from './state.js';
import { exitFly, enterFly } from './fly.js';
import { syncHeadEuler } from './eye-level.js';
import { CX, CZ, Z } from '../config/dimensions.js';
import { F1_XW, EYE_Y, T_X, T_Z } from '../config/geometry.js';

const cv = renderer.domElement;

// Standard orbit preset: place the camera, aim the target, clear the special
// camera modes so orbit takes over.
export function setView(pos, tgt, fov = 45) {
  exitFly();
  state.eyeLock = false;   // any preset clears eye-lock unless it re-sets it
  state.headLook = false;  // and clears head-look
  cv.style.cursor = 'grab';
  if (camera.fov !== fov) { camera.fov = fov; camera.updateProjectionMatrix(); }
  camera.position.set(...pos);
  orbit.target.set(...tgt);
  orbit.enabled = true;
  orbit.update();
}

export function init() {
  // Main road view: ~35 m off the west side at eye level, angled slightly north.
  document.getElementById('v-road').onclick  = () => setView([CX+115, 6, CZ+28], [CX+6, 13, CZ+6]);
  document.getElementById('v-wn').onclick    = () => setView([CX+62, 30, CZ+66], [CX+2, 9, CZ+2]);
  document.getElementById('v-iso').onclick   = () => setView([CX-52, 48, CZ+62], [CX, 4, CZ]);
  // Site overview: pulled back and up to frame the building plus both roads.
  document.getElementById('v-site').onclick  = () => setView([CX+120, 150, CZ+150], [CX+70, 0, CZ+55]);

  // Eye-level: a 5'-5" person at the junction mouth (where the 10' lane opens onto
  // the 30' main road), looking down the lane toward the building. Fixed-position
  // 360° head-look — plant the feet, turn the head, never step (see eye-level.js).
  document.getElementById('v-eye').onclick    = () => {
    exitFly();
    orbit.enabled = false;
    state.eyeLock = false;
    camera.fov = 50; camera.updateProjectionMatrix();
    camera.position.set(T_X, EYE_Y, T_Z);
    camera.lookAt(F1_XW, EYE_Y, T_Z);
    state.headLook = true;
    syncHeadEuler();
    cv.style.cursor = 'grab';
  };
  document.getElementById('v-plan').onclick  = () => setView([CX, 96, CZ+0.01], [CX, 0, CZ]);
  document.getElementById('v-front').onclick = () => setView([CX, 14, CZ+78], [CX, 6, CZ]);
  document.getElementById('v-fly').onclick   = () => {
    camera.position.set(20, 5.5, Z.verandha + 9);
    camera.lookAt(20, 5.5, Z.entry);
    enterFly();
  };
}
