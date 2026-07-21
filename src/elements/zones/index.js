import * as THREE from 'three';
import { makeClickable } from '../../lib/builders.js';
import { G } from '../../core/groups.js';
import { zoneMat } from '../../core/materials.js';
import { ftin } from '../../lib/format.js';
import { ROOMS } from '../../config/rooms.js';

// A flat, translucent floor tint naming a room. Clickable — its userData drives
// the info card. Room definitions (bounds, colour, details) live in config/rooms.js.
const tint = (c, x1, z1, x2, z2, info) => {
  const w = x2-x1, dp = z2-z1;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, dp), zoneMat(c));
  m.rotation.x = -Math.PI/2;
  m.position.set((x1+x2)/2, 0.03, (z1+z2)/2);
  m.userData = {
    color: c, name: info.name,
    dim: `${ftin(w)} × ${ftin(dp)}`,
    area: `${Math.round(w*dp)} sf`,
    details: info.details,
    baseOpacity: 0.5,
  };
  G.zones.add(m);
  makeClickable(m);
  return m;
};

export function build() {
  ROOMS.forEach(r => tint(r.color, ...r.bounds, r));
}
