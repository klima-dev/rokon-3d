import { box, makeClickable } from '../../lib/builders.js';
import { G } from '../../core/groups.js';
import { M } from '../../core/materials.js';
import { ftin } from '../../lib/format.js';
import { SLAB } from '../../config/dimensions.js';
import {
  ROAD_W, ROAD_SPAN, roadXc, roadZc, roadXs, roadXe,
  MAIN_W, MAIN_L, mainXc, mainZc,
} from '../../config/geometry.js';

const DASH = 4, GAPd = 3;

export function build() {
  /* ---------- NORTH ROAD (v36) ----------
     A 10'-0" wide, 30 m (98'-5") long strip on the site's NORTH side, running
     EAST->WEST, 2'-0" clear NORTH of the shop cantilever's north edge. Purely
     context — shows how the frontage meets the lane. */
  const roadDeck = box(ROAD_SPAN, 0.12, ROAD_W, roadXc, -SLAB + 0.02, roadZc, M.road, G.road);
  roadDeck.receiveShadow = true;
  roadDeck.userData = {
    color: 0x4a4844, name: 'North road (10′ lane)',
    dim: `${ftin(ROAD_SPAN)} × ${ftin(ROAD_W)}`,
    area: `${Math.round(ROAD_SPAN*ROAD_W)} sf`,
    details: ['10′-0″ wide service lane on the north frontage',
              '30 m (98′-5″) long, running east to west',
              'Sits 2′-0″ clear of the shop cantilever edge'],
    baseOpacity: 1,
  };
  makeClickable(roadDeck);
  // dashed centre line
  for (let x = roadXs + 2; x < roadXe - 2; x += DASH + GAPd) {
    const len = Math.min(DASH, roadXe - 2 - x);
    box(len, 0.02, 0.5, x + len/2, -SLAB + 0.16, roadZc, M.roadln, G.road);
  }

  /* ---------- MAIN ROAD (N-S, v41) ----------
     A 30'-0" wide, 300'-0" long main road running NORTH-SOUTH, meeting the 10'
     north lane in a T-junction at its inner (east) edge. Approximate — width may
     change later. Centred north-south on the small lane so the T sits mid-length. */
  const mainDeck = box(MAIN_W, 0.12, MAIN_L, mainXc, -SLAB + 0.02, mainZc, M.road, G.road);
  mainDeck.receiveShadow = true;
  mainDeck.userData = {
    color: 0x4a4844, name: 'Main road (N-S, 30′)',
    dim: `${ftin(MAIN_L)} × ${ftin(MAIN_W)}`,
    area: `${Math.round(MAIN_L*MAIN_W)} sf`,
    details: ['30′-0″ wide main road, running north to south',
              '300′-0″ long (approximate — width may change later)',
              'Meets the 10′ north lane in a T-junction at its inner edge'],
    baseOpacity: 1,
  };
  makeClickable(mainDeck);
  // dashed centre line, running N-S
  for (let z = mainZc - MAIN_L/2 + 2; z < mainZc + MAIN_L/2 - 2; z += DASH + GAPd) {
    const len = Math.min(DASH, mainZc + MAIN_L/2 - 2 - z);
    box(0.5, 0.02, len, mainXc, -SLAB + 0.16, z + len/2, M.roadln, G.road);
  }
}
