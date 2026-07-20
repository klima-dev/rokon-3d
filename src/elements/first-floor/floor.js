import * as THREE from 'three';
import { box, makeClickable } from '../../lib/builders.js';
import { ftin } from '../../lib/format.js';
import { G } from '../../core/groups.js';
import { M } from '../../core/materials.js';
import { SLAB } from '../../config/dimensions.js';
import { F1, F1_FFL, F1_ROOF_Y } from '../../config/geometry.js';

// L-shaped open floor plate tint (names the space), plus the 1st floor roof slab.
const f1Tint = (x1, z1, x2, z2) => {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(x2-x1, z2-z1),
    new THREE.MeshStandardMaterial({ color:0x6fa8c4, roughness:1, transparent:true, opacity:0.22 }));
  m.rotation.x = -Math.PI/2;
  m.position.set((x1+x2)/2, F1_FFL + 0.04, (z1+z2)/2);
  G.f1.add(m);
  return m;
};

export function build() {
  const f1Floor = f1Tint(F1.xE, F1.zS, F1.xW, F1.zNmain);
  f1Tint(F1.xE, F1.zNmain, F1.xStep, F1.zNshop);
  f1Floor.userData = {
    color: 0x6fa8c4, name: 'First floor — open plan',
    dim: `${ftin(F1.xW-F1.xE)} × ${ftin(F1.zNmain-F1.zS)} + wing`,
    area: `${Math.round((F1.xW-F1.xE)*(F1.zNmain-F1.zS) + (F1.xStep-F1.xE)*(F1.zNshop-F1.zNmain))} sf`,
    details: ['No partitions — one clear span throughout',
              'Envelope sits on the cantilever edge, oversailing the ground floor',
              'L-shaped: the shop wing steps 6\'-2" further north'],
    baseOpacity: 0.22,
  };
  makeClickable(f1Floor);

  // --- 1st floor roof = the 2nd floor slab ---
  const f1RoofMain = box(F1.xW-F1.xE, SLAB, F1.zNmain-F1.zS, (F1.xE+F1.xW)/2,
                         F1_ROOF_Y, (F1.zS+F1.zNmain)/2, M.roof.clone(), G.f1);
  const f1RoofShop = box(F1.xStep-F1.xE, SLAB, F1.zNshop-F1.zNmain, (F1.xE+F1.xStep)/2,
                         F1_ROOF_Y, (F1.zNmain+F1.zNshop)/2, M.roof.clone(), G.f1);
  [f1RoofMain, f1RoofShop].forEach(m => { m.castShadow = false; });
  f1RoofMain.userData = {
    color: 0xc8552f, name: '1st floor roof',
    dim: `${ftin(F1.xW-F1.xE)} × ${ftin(F1.zNmain-F1.zS)}`,
    area: `${Math.round((F1.xW-F1.xE)*(F1.zNmain-F1.zS))} sf`,
    details: ['Caps the 1st floor at 21\'-6"',
              'Follows the same L-shaped outline as the envelope'],
    baseOpacity: 0.42,
  };
  makeClickable(f1RoofMain);
}
