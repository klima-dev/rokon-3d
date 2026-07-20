import * as THREE from 'three';
import { camera, renderer } from '../core/scene.js';
import { state } from './state.js';
import { EYE_Y } from '../config/geometry.js';

/* Fixed-position 360° head-look for the eye-level view: the person plants their
   feet and turns their head. Position is pinned; dragging turns the gaze (yaw +
   a limited neck pitch); scroll steps forward/back but keeps the eye at 5'-5". */
const cv = renderer.domElement;
const headEuler = new THREE.Euler(0, 0, 0, 'YXZ');
let headDrag = false;

// views.js calls this after it sets the camera orientation for the eye view, so
// dragging continues smoothly from wherever the gaze was aimed.
export function syncHeadEuler() {
  headEuler.setFromQuaternion(camera.quaternion);
}

export function init() {
  cv.addEventListener('pointerdown', e => {
    if (!state.headLook || e.button !== 0) return;
    headDrag = true; cv.style.cursor = 'grabbing';
    cv.setPointerCapture(e.pointerId);
  });
  cv.addEventListener('pointerup', e => {
    if (!state.headLook) return;
    headDrag = false; cv.style.cursor = 'grab';
    if (cv.hasPointerCapture(e.pointerId)) cv.releasePointerCapture(e.pointerId);
  });
  cv.addEventListener('pointermove', e => {
    if (!state.headLook || !headDrag) return;
    headEuler.y -= e.movementX * 0.005;                 // full 360° yaw
    headEuler.x -= e.movementY * 0.005;
    // neck pitch limit: can't look straight up or straight down
    headEuler.x = Math.max(-Math.PI/3, Math.min(Math.PI/3, headEuler.x));
    camera.quaternion.setFromEuler(headEuler);
  });
  // scroll = step forward/back along the current heading, eye stays at 5'-5"
  cv.addEventListener('wheel', e => {
    if (!state.headLook) return;
    e.preventDefault();
    const step = Math.sign(e.deltaY) * -2.5;
    const dir = camera.getWorldDirection(new THREE.Vector3());
    camera.position.x += dir.x * step;
    camera.position.z += dir.z * step;
    camera.position.y = EYE_Y;                           // height locked (5'-5")
  }, { passive:false });
}
