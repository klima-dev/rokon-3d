import { box, makeClickable } from '../../lib/builders.js';
import { ftin } from '../../lib/format.js';
import { G } from '../../core/groups.js';
import { M } from '../../core/materials.js';
import { F1, F1_FFL, F1_ROOF_Y } from '../../config/geometry.js';

/* Corner fin / signage pylon at the NW corner — a vertical ACP blade on a steel
   frame, the site's most visible point. Starts at the 1st floor (ground stays
   clear for the gateway) and rises 5' past the 1st floor roof so it reads over
   future neighbours. Faces the main road edge-on AND face-on. */
export function build() {
  const FIN_W = 1.2, FIN_D = 3.5, FIN_TOP = F1_ROOF_Y + 5;
  const FIN_BASE = F1_FFL;                 // 11'-0" — nothing below this
  const FIN_H = FIN_TOP - FIN_BASE;        // 15'-6" of blade
  const finX = F1.xW + FIN_W/2 - 0.1, finZ = F1.zNmain - FIN_D/2 + 0.1;
  const fin = box(FIN_W, FIN_H, FIN_D, finX, FIN_BASE, finZ, M.fin, G.f1);
  fin.userData = {
    color: 0x1f4e8c, name: 'Corner fin — signage pylon',
    dim: `${ftin(FIN_H)} tall × ${ftin(FIN_D)}`,
    area: `${Math.round(FIN_H*FIN_D)} sf face`,
    details: ['ACP on a steel frame at the NW corner, the site\'s most visible point',
              'Starts at the 1st floor — the ground below stays clear for the gateway',
              'Rises 5\'-0" above the 1st floor roof — reads over future neighbours',
              'Vertical signage on both faces: seen along AND across the main road'],
    baseOpacity: 1,
  };
  makeClickable(fin);
  // vertical sign strip on the road-facing (west) face of the fin
  box(0.15, FIN_H*0.7, FIN_D*0.62, finX + FIN_W/2 + 0.02, FIN_BASE + FIN_H*0.15, finZ, M.sign, G.f1);
}
