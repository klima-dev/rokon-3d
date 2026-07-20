import * as THREE from 'three';
import { camera } from '../core/scene.js';

/* Compass: bearing measured clockwise from north, with East = -X (since +X is the
   WEST side of the building). The tick ring rotates with the card; the letters are
   re-placed around the dial each frame so they stay upright.

   The N/E/S/W glyphs in the HTML are already remapped to true site north (the
   shop's street side), so only the DISPLAY was flipped — the math here is untouched. */
const compassTicks = document.getElementById('compass-ticks');
const cpText = {
  n: document.getElementById('cp-n'), e: document.getElementById('cp-e'),
  s: document.getElementById('cp-s'), w: document.getElementById('cp-w'),
};
const CP_C = 38, CP_R = 21;
const CARDINALS = [['n',0],['e',90],['s',180],['w',270]];
const camDir = new THREE.Vector3();

export function update() {
  camera.getWorldDirection(camDir);
  const bearing = Math.atan2(-camDir.x, -camDir.z); // 0 = N, +90deg = E
  const A = -bearing * 180 / Math.PI;               // card rotation, degrees
  compassTicks.setAttribute('transform', `rotate(${A.toFixed(2)} ${CP_C} ${CP_C})`);
  for (const [k, phi] of CARDINALS) {
    const t = (phi + A) * Math.PI / 180;
    cpText[k].setAttribute('x', (CP_C + CP_R * Math.sin(t)).toFixed(2));
    cpText[k].setAttribute('y', (CP_C - CP_R * Math.cos(t)).toFixed(2));
  }
}
