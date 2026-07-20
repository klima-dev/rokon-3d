import * as THREE from 'three';
import { scene } from '../core/scene.js';
import { G } from '../core/groups.js';
import { M } from '../core/materials.js';
import { clickable } from '../core/registries.js';
import { H, WT } from '../config/dimensions.js';

// Core box primitive. y is the BOTTOM of the box (box offsets by h/2 itself).
export const box = (w,h,dp,x,y,z,mat,g) => {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w,h,dp), mat);
  m.position.set(x, y+h/2, z);
  m.castShadow = m.receiveShadow = true;
  (g||scene).add(m);
  return m;
};

// wall along a centreline from (x1,z1) to (x2,z2)
export const wall = (x1,z1,x2,z2,h=H,t=WT) => {
  const len = Math.hypot(x2-x1, z2-z1);
  const horiz = Math.abs(x2-x1) > Math.abs(z2-z1);
  return box(horiz?len:t, h, horiz?t:len, (x1+x2)/2, 0, (z1+z2)/2, M.wall, G.walls);
};

// beam at the u/s of the first floor slab
export const beam = (x1,z1,x2,z2) => {
  const len = Math.hypot(x2-x1, z2-z1), horiz = Math.abs(x2-x1) > Math.abs(z2-z1);
  box(horiz?len:0.83, 1.4, horiz?0.83:len, (x1+x2)/2, H-1.4, (z1+z2)/2, M.beam, G.cols);
};

// Selection highlighting mutates the mesh's material (opacity or emissive), so
// every clickable must OWN its material — otherwise clicking one roof/cantilever/
// glass panel repaints every sibling sharing that material. Clone on registration
// so no call site can forget. (Re-cloning an already-unique material is harmless.)
export const makeClickable = m => { m.material = m.material.clone(); clickable.push(m); };
