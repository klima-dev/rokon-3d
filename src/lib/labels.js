import * as THREE from 'three';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { G } from '../core/groups.js';
import { labelRegistry } from '../core/registries.js';

export const label = (text, x,y,z, cls='tag') => {
  const el = document.createElement('div');
  el.className = cls; el.textContent = text;
  const o = new CSS2DObject(el);
  o.position.set(x,y,z);
  return o;
};

// Register a tag against its visual group so the master "Labels" toggle can hide
// ALL tags at once, while each still respects its own feature's visibility when
// Labels is on — see interaction/panel.refreshLabelVisibility().
export const addLabel = (group, text, x, y, z, cls) => {
  const o = label(text, x, y, z, cls);
  group.add(o);
  labelRegistry.push({ obj: o, group });
  return o;
};

/* ---------- dimension lines ---------- */
const dimMat = new THREE.LineBasicMaterial({ color:0x2f6a8f });
export const dim = (x1,z1,x2,z2,text,y=0.06,off=2.5) => {
  const horiz = Math.abs(x2-x1) > Math.abs(z2-z1);
  const ox = horiz ? 0 : -off, oz = horiz ? -off : 0;
  const a = new THREE.Vector3(x1+ox, y, z1+oz), b = new THREE.Vector3(x2+ox, y, z2+oz);
  G.dims.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([a,b]), dimMat));
  [[x1,z1,a],[x2,z2,b]].forEach(([px,pz,p]) => {
    G.dims.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(
      [new THREE.Vector3(px,y,pz), p]), dimMat));
  });
  addLabel(G.dims, text, (a.x+b.x)/2, y+0.4, (a.z+b.z)/2, 'tag dim');
};
