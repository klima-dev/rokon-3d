import * as THREE from 'three';
import { camera, renderer, orbit } from '../core/scene.js';
import { state } from './state.js';

/* Free-fly walkthrough — hand-rolled so it never depends on the Pointer Lock API,
   which sandboxed iframes block. Mouse position relative to canvas centre drives
   turn rate (soft-aim), keys move. */
const cv = renderer.domElement;
const ffHint = document.getElementById('ff');
const crosshair = document.getElementById('crosshair');

const flyEuler = new THREE.Euler(0, 0, 0, 'YXZ');
let aimX = 0, aimY = 0;   // -1..1 offset from canvas centre
const keys = {};
const fwd = new THREE.Vector3(), right = new THREE.Vector3(), UP = new THREE.Vector3(0,1,0);

export function exitFly() {
  if (!state.flying) return;
  state.flying = false;
  orbit.enabled = true;
  orbit.target.copy(camera.position).add(
    camera.getWorldDirection(new THREE.Vector3()).multiplyScalar(18));
  orbit.update();
  ffHint.style.display = 'none';
  crosshair.style.display = 'none';
  cv.style.cursor = 'grab';
}

export function enterFly() {
  state.flying = true;
  orbit.enabled = false;
  flyEuler.setFromQuaternion(camera.quaternion);
  ffHint.style.display = 'block';
  crosshair.style.display = 'block';
  cv.style.cursor = 'none';
  cv.focus();
}

export function aimFly(dt) {
  if (!state.flying) return;
  const dead = 0.06, turnRate = 2.0;
  const ax = Math.abs(aimX) > dead ? aimX : 0;
  const ay = Math.abs(aimY) > dead ? aimY : 0;
  flyEuler.y -= ax * ax * Math.sign(ax) * turnRate * dt;
  flyEuler.x -= ay * ay * Math.sign(ay) * turnRate * dt;
  flyEuler.x = Math.max(-Math.PI/2 + 0.02, Math.min(Math.PI/2 - 0.02, flyEuler.x));
  camera.quaternion.setFromEuler(flyEuler);
}

export function moveFly(dt) {
  if (!state.flying) return;
  const s = (keys.ShiftLeft || keys.ShiftRight ? 34 : 13) * dt;
  camera.getWorldDirection(fwd);
  right.crossVectors(fwd, UP).normalize();
  if (keys.KeyW || keys.ArrowUp)    camera.position.addScaledVector(fwd, s);
  if (keys.KeyS || keys.ArrowDown)  camera.position.addScaledVector(fwd, -s);
  if (keys.KeyD || keys.ArrowRight) camera.position.addScaledVector(right, s);
  if (keys.KeyA || keys.ArrowLeft)  camera.position.addScaledVector(right, -s);
  if (keys.KeyE) camera.position.y += s;
  if (keys.KeyQ) camera.position.y -= s;
}

export function init() {
  // soft-aim look: mouse offset from canvas centre drives turn rate
  cv.addEventListener('pointermove', e => {
    if (!state.flying) return;
    const r = cv.getBoundingClientRect();
    aimX = ((e.clientX - r.left) / r.width  - 0.5) * 2;
    aimY = ((e.clientY - r.top)  / r.height - 0.5) * 2;
  });
  cv.addEventListener('pointerleave', () => { aimX = 0; aimY = 0; });
  cv.addEventListener('contextmenu', e => { if (state.flying) e.preventDefault(); });

  addEventListener('keydown', e => {
    if (e.code === 'Escape') { exitFly(); return; }
    if (state.flying && ['KeyW','KeyA','KeyS','KeyD','KeyQ','KeyE',
                    'ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code)) e.preventDefault();
    keys[e.code] = true;
  });
  addEventListener('keyup', e => keys[e.code] = false);
  addEventListener('blur', () => { for (const k in keys) keys[k] = false; });
}
