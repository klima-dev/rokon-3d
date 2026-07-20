import { f1Seg, GLASS_INFO } from './helpers.js';
import { box } from '../../lib/builders.js';
import { ftin } from '../../lib/format.js';
import { G } from '../../core/groups.js';
import { M } from '../../core/materials.js';
import { Z, H1 } from '../../config/dimensions.js';
import { F1, F1_FFL } from '../../config/geometry.js';

/* site WEST: 8'-6" brick below, a 2'-0" glazed clerestory band along the top
   (daylight in, rain out), then full-height showcase glass where the brick stops
   at the stair bay's north end. 4"x5" concrete mullion beams divide the band. */
const CLERE   = 2;                   // 2'-0" daylight band at the top
const BRICK_H = H1 - CLERE;          // 8'-6" of brick below it
const MULL_SPACING = 5;              // 5'-0" between mullion beams

export function build() {
  const WEST_RUN = Z.shutter - Z.n;    // west run (south -> stair bay)
  const N_MULL = Math.max(1, Math.round(WEST_RUN / MULL_SPACING) - 1);

  // 8'-6" brick, floor up
  f1Seg(F1.xW, F1.zS, F1.xW, F1.zBrick, F1_FFL, BRICK_H, M.brick, {
    color: 0xf0ede6, baseOpacity: 1,
    name: 'West wall — brick',
    details: ['5" single-brick, 8\'-6" high — stops 2\'-0" below the slab',
              'Runs from the south end to where the stair bay ends',
              'Sits on the edge of the 5\'-0" west cantilever'] });

  // 2'-0" clerestory glass band along the top
  f1Seg(F1.xW, F1.zS, F1.xW, F1.zBrick, F1_FFL + BRICK_H, CLERE, M.glass, GLASS_INFO({
    name: 'West clerestory — daylight band',
    details: ['2\'-0" glazed band along the top of the brick, 36\'-1" long',
              'Daylight in, rain out — soft indirect light all day',
              'Panes ~5\'-0" x 2\'-0" between 4"x5" concrete mullion beams'] }));

  // 4"x5" concrete mullion beams across the 2' band, 5'-0" centres
  const MB_D = 4/12, MB_W = 5/12;
  for (let i = 1; i <= N_MULL; i++) {
    const z = F1.zS + (F1.zBrick - F1.zS) * i / (N_MULL + 1);
    box(MB_D, CLERE, MB_W, F1.xW, F1_FFL + BRICK_H, z, M.cbeam, G.f1);
  }
  // full-height display / showcase glass where the brick stops
  f1Seg(F1.xW, F1.zBrick, F1.xW, F1.zNmain, F1_FFL, H1, M.glass, GLASS_INFO({
    name: 'Display / Showcase glass',
    dim: `${ftin(F1.zNmain - F1.zBrick)} × ${ftin(H1)}`,
    area: `${Math.round((F1.zNmain - F1.zBrick) * H1)} sf`,
    details: ['Full-height glazed panel on the west face — 10\'-0" × 10\'-6"',
              'A display / showcase window facing the main road',
              'Picks up where the brick stops, at the stair bay\'s north end'] }));
}
