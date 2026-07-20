import { box, makeClickable } from '../../lib/builders.js';
import { G } from '../../core/groups.js';
import { M } from '../../core/materials.js';
import { ftin } from '../../lib/format.js';
import { X, Z, OUT, WT, H, SLAB } from '../../config/dimensions.js';

// ROOF — the ground floor's ceiling = the 1st floor slab. Same footprint as the
// ground slab, lifted to H. The cantilever projections are added into G.roof too
// (see elements/cantilevers) so one toggle shows/hides the entire 1st floor plate.
//
// Edges are trimmed back to the wall CENTRELINE (X.e / Z.shopS) wherever a
// cantilever carries on from there, so the two never overlap. Coplanar translucent
// slabs would otherwise double up into a dark seam and z-fight.
export function build() {
  const roofMain = box(X.e-OUT.x0, SLAB, Z.verandha-OUT.z0, (OUT.x0+X.e)/2, H,
                       (OUT.z0+Z.verandha)/2, M.roof, G.roof);
  const roofShop = box(10+WT, SLAB, Z.shopS-Z.verandha, (OUT.x0+10.5)/2, H,
                       (Z.verandha+Z.shopS)/2, M.roof, G.roof);
  [roofMain, roofShop].forEach(m => { m.castShadow = false; });
  roofMain.userData = {
    color: 0xc8552f, name: 'Roof / 1st floor slab',
    dim: `${ftin(X.e-OUT.x0)} × ${ftin(Z.verandha-OUT.z0)}`,
    area: `${Math.round((X.e-OUT.x0)*(Z.verandha-OUT.z0))} sf`,
    details: [
      'Ceiling of the ground floor, floor of the 1st',
      'Cantilever projections are part of this same plate',
      'Sits at 10\'-6" above the ground floor slab',
    ],
    baseOpacity: 0.42,
  };
  makeClickable(roofMain);
}
