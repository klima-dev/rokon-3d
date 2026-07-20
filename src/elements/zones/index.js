import * as THREE from 'three';
import { makeClickable } from '../../lib/builders.js';
import { G } from '../../core/groups.js';
import { zoneMat } from '../../core/materials.js';
import { ftin } from '../../lib/format.js';
import { X, Z } from '../../config/dimensions.js';

// A flat, translucent floor tint naming a room. Clickable — its userData drives
// the info card.
const tint = (c, x1,z1,x2,z2, info) => {
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
  tint(0x8b7fd4, X.w, Z.n, X.e, Z.entry, {
    name: 'Back showroom',
    details: [
      'Full 40\'-4" street frontage on the north wall',
      'Opens south into the front showroom only — the shop is walled off',
      'Largest display floor in the building',
    ],
  });
  tint(0x3fae8c, X.w, Z.entry, X.shopE, Z.shopS, {
    name: 'Shop',
    details: [
      'East bay, runs the full 27\'-6" depth of the building',
      'Own 4\'-0" cantilever projecting south past the main footprint',
      'Closed room — solid wall to the back showroom',
      'Entered through its own 7\'-7" shutter on the south front',
    ],
  });
  tint(0x8b7fd4, X.shopE, Z.entry, X.stairW, Z.shutter, {
    name: 'Front showroom',
    details: [
      'Central bay, between the shop and the stair',
      'South wall carries the showroom shutter at the entrance',
      'Beam over at the entry line and again at the shutter line',
    ],
  });
  tint(0xd9a03c, X.stairW, Z.entry, X.e, Z.gateway, {
    name: 'Stair bay',
    details: [
      'Single switchback: up the east side, half landing, back down the west',
      'Reached from the gateway at its south edge, not directly off the street',
      'Wraps an open 2\'-6" x 7\'-4" void — no guard rail modelled yet',
      '16 treads @ 11", 17 risers @ 7.41", arrives at 1st floor over the gateway',
    ],
  });
  tint(0x3f7fbf, X.stairW, Z.gateway, X.e, Z.shutter, {
    name: 'Gateway',
    details: [
      'Shared entry lobby — flat, at floor level, no treads',
      'Gate A (west, outer wall) is the street gate in',
      'Gate B (east) opens through into the front showroom',
      'Stair rises from its north edge; the 1st floor arrives back overhead',
    ],
  });
  tint(0x9a978d, X.shopE, Z.shutter, X.stairW, Z.verandha, {
    name: 'Verandha',
    details: [
      'Covered strip in front of the showroom shutter',
      '5\'-0" and 4\'-0" cantilevers project overhead from the first floor',
    ],
  });
  tint(0x9a978d, X.stairW, Z.shutter, X.e, Z.verandha, {
    name: 'Bike park',
    details: [
      'West of the verandha, alongside the stair gates',
      'Low 3\'-0" kerb divides it from the verandha',
    ],
  });
}
