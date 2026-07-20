import { box, makeClickable } from '../../lib/builders.js';
import { addLabel } from '../../lib/labels.js';
import { G } from '../../core/groups.js';
import { M } from '../../core/materials.js';
import { ftin } from '../../lib/format.js';
import { X, Z, OUT, WT, H, SLAB, CANTI_W, CANTI_S, CANTI_SHOP } from '../../config/dimensions.js';

// A first-floor slab projection. Added into G.roof so it toggles with the roof
// plate as one thing.
const canti = (w,dp,x,z,text,info) => {
  const m = box(w, SLAB, dp, x, H, z, M.roof, G.roof);
  m.castShadow = false;
  if (text) addLabel(G.roof, text, x, H+1.2, z, 'tag dim');
  if (info) {
    m.userData = {
      color: 0xc8552f, name: info.name,
      dim: `${ftin(w)} × ${ftin(dp)}`,
      area: `${Math.round(w*dp)} sf`,
      details: info.details,
      baseOpacity: 0.42,
    };
    makeClickable(m);
  }
  return m;
};

export function build() {
  canti(CANTI_W, Z.verandha-Z.n, X.e+CANTI_W/2, (Z.n+Z.verandha)/2, "5'-0\" cantilever", {
    name: 'West cantilever',
    details: [
      'First floor projection over the back showroom and stair frontage',
      'Projects 5\'-0" past the west wall face',
    ],
  });
  canti(CANTI_W, CANTI_S, X.e+CANTI_W/2, Z.verandha+CANTI_S/2, '', {
    name: 'SW corner infill',
    details: [
      'Joins the west cantilever to the south cantilever at the corner',
      'Sits directly above the bike park',
    ],
  });
  canti(X.e-X.shopE+WT, CANTI_S, (X.shopE+X.e)/2, Z.verandha+CANTI_S/2, "4'-0\" cantilever", {
    name: 'South cantilever',
    details: [
      'Runs the width of the front showroom, stair and bike park below',
      'Projects 4\'-0" past the south wall face',
    ],
  });
  canti(10+WT, CANTI_SHOP, (OUT.x0+10.5)/2, Z.shopS+CANTI_SHOP/2, "4'-0\" cantilever", {
    name: 'Shop south cantilever',
    details: [
      'First floor projection over the shop\'s own south wall',
      'Shop tail extends 6\'-2" further south than the main block',
    ],
  });
  // west face of the shop tail: fills the notch between the main south cantilever
  // and the shop south cantilever. 4' out from the shop west wall face, 6'-2" deep.
  canti(CANTI_SHOP, Z.shopS-Z.verandha,
        X.shopE + WT/2 + CANTI_SHOP/2,
        (Z.verandha + CANTI_S + Z.shopS + CANTI_SHOP)/2, '', {
    name: 'Shop west cantilever',
    details: [
      'Closes the corner between the south and shop south cantilevers',
      'Wraps the shop tail\'s west face',
    ],
  });
}
