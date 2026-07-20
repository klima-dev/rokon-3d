import { box, beam } from '../../lib/builders.js';
import { G } from '../../core/groups.js';
import { M } from '../../core/materials.js';
import { X, Z, H, COL } from '../../config/dimensions.js';
import { colGrid, MID_L } from '../../config/geometry.js';

export function build() {
  /* ---------- columns ----------
     Both rows sit on ONE grid: 0 / 13.111 / X.stairW / X.e. The right axis is the
     staircase line — the stair bay's east wall runs straight up through the back
     showroom to the north wall, so that column is dead in line with it. */
  colGrid.forEach(([x,z]) => box(COL, H, COL, x, 0, z, M.col, G.cols));

  /* ---------- beams (u/s of first floor slab) ---------- */
  beam(X.w,Z.n,X.e,Z.n);
  beam(X.w,Z.entry,X.e,Z.entry);          // back showroom entry beam
  beam(X.shopE,Z.shutter,X.e,Z.shutter);  // shutter / gate line beam
  beam(X.shopE,Z.verandha,X.e,Z.verandha);
  beam(X.w,Z.shopS,X.shopE,Z.shopS);
  beam(X.w,Z.n,X.w,Z.shopS);
  beam(X.e,Z.n,X.e,Z.verandha);
  beam(X.shopE,Z.entry,X.shopE,Z.shopS);
  beam(X.stairW,Z.entry,X.stairW,Z.verandha);
  // both intermediate axes carried through the back showroom, north wall ->
  // entry line. The X.stairW one is the staircase line running dead straight
  // from the stair bay wall all the way to the north wall.
  beam(MID_L, Z.n, MID_L, Z.entry);
  beam(X.stairW, Z.n, X.stairW, Z.entry);
}
