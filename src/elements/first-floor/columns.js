import { box } from '../../lib/builders.js';
import { G } from '../../core/groups.js';
import { M } from '../../core/materials.js';
import { COL, H1 } from '../../config/dimensions.js';
import { colGrid, F1_FFL } from '../../config/geometry.js';

// Same grid as the ground floor, because columns must stack.
export function build() {
  colGrid.forEach(([x, z]) => box(COL, H1, COL, x, F1_FFL, z, M.col, G.f1));
}
