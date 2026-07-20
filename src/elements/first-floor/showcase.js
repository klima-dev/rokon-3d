import { box, makeClickable } from '../../lib/builders.js';
import { ftin } from '../../lib/format.js';
import { G } from '../../core/groups.js';
import { M } from '../../core/materials.js';
import { H1 } from '../../config/dimensions.js';
import { F1, F1_FFL, SILL } from '../../config/geometry.js';

/* Lit product displays on the north face:
   - a display deck just inside the main-block ribbon glass (goods face the street)
   - a full-height glass showcase tower in the fold of the L (seen from both roads) */
export function build() {
  // --- PRODUCT DISPLAY behind the main-block ribbon glass ---
  const dispX1 = F1.xStep + 3, dispX2 = F1.xW - 3;
  const dispDeck = box(dispX2 - dispX1, 0.4, 2.2, (dispX1+dispX2)/2, SILL - 0.2,
                       F1.zNmain - 1.4, M.disp, G.f1);
  for (let i = 0; i < 5; i++) {
    const px = dispX1 + (dispX2 - dispX1) * (i + 0.5) / 5;
    const hh = 1.2 + (i % 3) * 0.5;
    box(1.0, hh, 1.0, px, SILL, F1.zNmain - 1.4, M.prod, G.f1);
  }
  dispDeck.userData = { color:0x2a2d33, baseOpacity:1, name:'Product display window',
    dim:`${ftin(dispX2-dispX1)} wide`, area:'behind the north glass',
    details:['Raised display platform just inside the 1st-floor ribbon window',
             'Goods face the street like a showroom, lit from within',
             'The brick facade design above is unchanged'] };
  makeClickable(dispDeck);

  // --- glass showcase tower, centred in the step ---
  const STEP_Z0 = F1.zNmain, STEP_Z1 = F1.zNshop, STEP_MID = (STEP_Z0+STEP_Z1)/2;
  const SHOW_Z = STEP_MID, SHOW_W = (STEP_Z1 - STEP_Z0) - 1.2;
  const SHOW_BOT = F1_FFL + 0.8, SHOW_TOP = F1_FFL + H1 - 0.8, SHOW_H = SHOW_TOP - SHOW_BOT;
  // glass front of the showcase (proud of the brick face)
  const showGlass = box(0.25, SHOW_H, SHOW_W, F1.xStep + 0.35, SHOW_BOT, SHOW_Z, M.glass, G.f1);
  showGlass.userData = { color:0xbfe0ec, baseOpacity:0.62, name:'Step showcase — glass',
    dim:`${ftin(SHOW_H)} × ${ftin(SHOW_W)}`, area:'L-corner display tower',
    details:['Full-height glass showcase in the fold of the L',
             'Seen from both roads — a lit glass column of goods',
             'Multi-shelf display behind, LED-lit at night'] };
  makeClickable(showGlass);
  // shelves inside + a product on each
  const SHELVES = 4;
  for (let sI = 0; sI < SHELVES; sI++) {
    const y = SHOW_BOT + 0.6 + sI * (SHOW_H - 0.8) / SHELVES;
    box(0.5, 0.1, SHOW_W - 0.3, F1.xStep + 0.3, y, SHOW_Z, M.disp, G.f1);        // shelf
    box(0.5, 0.8, 0.9, F1.xStep + 0.3, y + 0.1, SHOW_Z, M.prod, G.f1);            // product on it
  }
}
