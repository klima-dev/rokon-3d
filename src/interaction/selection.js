import * as THREE from 'three';
import { camera, renderer } from '../core/scene.js';
import { clickable } from '../core/registries.js';
import { state } from './state.js';

const roomEl      = document.getElementById('room');
const roomSw      = document.getElementById('room-sw');
const roomName    = document.getElementById('room-name');
const roomDim     = document.getElementById('room-dim');
const roomArea    = document.getElementById('room-area');
const roomDetails = document.getElementById('room-details');
const raycaster = new THREE.Raycaster();
const pointerNDC = new THREE.Vector2();
let selected = null;

function paintSelection(mesh, on) {
  const b = mesh.userData.baseOpacity;
  // Translucent things (zone tints, roof, glass) highlight best by going more
  // solid. Opaque things (brick, ACP) can't — bumping opacity would make them
  // MORE see-through — so those glow via emissive instead.
  if (b < 1) mesh.material.opacity = on ? Math.min(b + 0.32, 0.9) : b;
  else mesh.material.emissive.setHex(on ? 0x4a2418 : 0x000000);
}
function showRoom(mesh) {
  if (selected) paintSelection(selected, false);
  selected = mesh;
  paintSelection(selected, true);
  const d = mesh.userData;
  roomSw.style.background = '#' + d.color.toString(16).padStart(6, '0');
  roomName.textContent = d.name;
  roomDim.textContent = d.dim;
  roomArea.textContent = d.area;
  roomDetails.innerHTML = '';
  d.details.forEach(t => {
    const li = document.createElement('li');
    li.textContent = t;
    roomDetails.appendChild(li);
  });
  roomEl.classList.add('show');
}
function hideRoom() {
  if (selected) paintSelection(selected, false);
  selected = null;
  roomEl.classList.remove('show');
}

export function init() {
  document.getElementById('room-close').addEventListener('click', hideRoom);

  // distinguish a click from an orbit drag by movement distance
  const roomCv = renderer.domElement;
  let downX = 0, downY = 0;
  roomCv.addEventListener('pointerdown', e => { downX = e.clientX; downY = e.clientY; });
  roomCv.addEventListener('pointerup', e => {
    if (state.flying) return;
    if (Math.hypot(e.clientX - downX, e.clientY - downY) > 4) return; // was a drag
    const r = roomCv.getBoundingClientRect();
    pointerNDC.x = ((e.clientX - r.left) / r.width) * 2 - 1;
    pointerNDC.y = -((e.clientY - r.top) / r.height) * 2 + 1;
    raycaster.setFromCamera(pointerNDC, camera);
    const hits = raycaster.intersectObjects(clickable, false);
    if (hits.length) showRoom(hits[0].object);
    else hideRoom();
  });
}
