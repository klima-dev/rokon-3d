/* ========================= 1ST FLOOR =========================
   Columns + envelope + roof. NO PARTITIONS — one open plan.

   DIRECTIONS: the site's compass is flipped vs this file's internal axis names.
     site NORTH = +Z (Z.shopS side, street frontage) · site SOUTH = -Z (Z.n rear)
     site WEST  = +X (X.e side, stair + 5' cantilever) · site EAST = -X (X.w, shop flank)

   WALLS SIT ON THE CANTILEVER EDGE, so the 1st floor oversails the ground floor
   all round. The site-NORTH edge is STEPPED (L-shaped): the shop wing projects
   6'-2" further north than the main block.
   ============================================================ */
import * as columns from './columns.js';
import * as facadeNorth from './facade-north.js';
import * as showcase from './showcase.js';
import * as wallWest from './wall-west.js';
import * as wallsBlind from './walls-blind.js';
import * as band from './band.js';
import * as floor from './floor.js';
import * as fin from './fin.js';
import * as sign from './sign.js';

export function build() {
  columns.build();
  facadeNorth.build();
  showcase.build();
  wallWest.build();
  wallsBlind.build();
  band.build();
  floor.build();
  fin.build();
  sign.build();
}
