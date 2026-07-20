import { box } from '../../lib/builders.js';
import { G } from '../../core/groups.js';
import { M } from '../../core/materials.js';
import { F1, F1_FFL } from '../../config/geometry.js';

/* Slim dark horizontal band at the 1st-floor line wrapping the two street faces
   (north + west) — a single clean line that reads as modern. Just a painted band. */
const BAND_H = 0.7, BAND_Y = F1_FFL - BAND_H;
function modBand(x1, z1, x2, z2) {
  const len = Math.hypot(x2-x1, z2-z1), horiz = Math.abs(x2-x1) > Math.abs(z2-z1);
  box(horiz?len:0.55, BAND_H, horiz?0.55:len, (x1+x2)/2, BAND_Y, (z1+z2)/2, M.brickD, G.f1);
}

export function build() {
  modBand(F1.xStep, F1.zNmain, F1.xW, F1.zNmain);   // north main
  modBand(F1.xE, F1.zNshop, F1.xStep, F1.zNshop);   // north shop wing
  modBand(F1.xStep, F1.zNmain, F1.xStep, F1.zNshop);// step
  modBand(F1.xW, F1.zS, F1.xW, F1.zNmain);          // west
}
