import { f1Seg, BRICK_INFO } from './helpers.js';
import { M } from '../../core/materials.js';
import { H1 } from '../../config/dimensions.js';
import { F1, F1_FFL } from '../../config/geometry.js';

/* site EAST + site SOUTH: solid brick, full height, no openings. East looks down
   the shop's long flank and south is the rear, so neither earns glazing. */
export function build() {
  f1Seg(F1.xE, F1.zS, F1.xE, F1.zNshop, F1_FFL, H1, M.brick, BRICK_INFO({
    name: 'East wall — brick',
    details: ['Solid brick, full height, no openings',
              'Longest face at 52\'-3" — runs the whole depth',
              'Covers both the main block and the shop wing'] }));
  f1Seg(F1.xE, F1.zS, F1.xW, F1.zS, F1_FFL, H1, M.brick, BRICK_INFO({
    name: 'South wall — brick',
    details: ['Solid brick, full height, no openings',
              'Rear face, 44\'-9" long',
              'Sits over the back showroom below'] }));
}
