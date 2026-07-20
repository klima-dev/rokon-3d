import { box, makeClickable } from '../../lib/builders.js';
import { ftin } from '../../lib/format.js';
import { G } from '../../core/groups.js';
import { M } from '../../core/materials.js';
import { H1 } from '../../config/dimensions.js';
import { F1, F1_FFL } from '../../config/geometry.js';

/* Slim sign band on the spandrel just under the roof on the west face, facing the
   main road — a clean home for the name, legible from the road. */
export function build() {
  const SP_W = 16, SP_H = 1.8;
  const signPanel = box(0.14, SP_H, SP_W, F1.xW + 0.12,
                        F1_FFL + H1 - SP_H - 0.2, (F1.zS + F1.zBrick)/2, M.sign, G.f1);
  signPanel.userData = {
    color: 0xf4f1ea, name: 'West wall sign fascia',
    dim: `${ftin(SP_W)} × ${ftin(SP_H)}`,
    area: `${Math.round(SP_W*SP_H)} sf`,
    details: ['Slim sign band under the roof on the west face, facing the main road',
              'Sized for ~1\'-6" letters — legible at 40 m',
              'Sits above the glass, on the top spandrel'],
    baseOpacity: 1,
  };
  makeClickable(signPanel);
}
