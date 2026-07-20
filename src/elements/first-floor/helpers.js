import { box, makeClickable } from '../../lib/builders.js';
import { ftin } from '../../lib/format.js';
import { G } from '../../core/groups.js';
import { M } from '../../core/materials.js';
import { H1 } from '../../config/dimensions.js';
import {
  F1_WT, F1_FFL, ACP_SILL, ACP_HEAD,
  SILL, GH, HEAD, WHITE_T, REVEAL,
} from '../../config/geometry.js';

// A vertical envelope segment along (x1,z1)->(x2,z2). Clickable segments get
// their OWN material instance (via mat.clone()) so highlighting one doesn't
// repaint every other segment sharing the material.
export function f1Seg(x1, z1, x2, z2, y, h, mat, info) {
  const len = Math.hypot(x2-x1, z2-z1);
  const horiz = Math.abs(x2-x1) > Math.abs(z2-z1);
  const m = box(horiz?len:F1_WT, h, horiz?F1_WT:len,
                (x1+x2)/2, y, (z1+z2)/2, info ? mat.clone() : mat, G.f1);
  if (info) {
    m.userData = {
      color: info.color, name: info.name,
      dim: `${ftin(len)} × ${ftin(H1)}`,
      area: `${Math.round(len*H1)} sf`,
      details: info.details,
      baseOpacity: info.baseOpacity,
    };
    makeClickable(m);
  }
  return m;
}

// ACP band / glazing / ACP band stack — kept for any face that wants it.
export function acpGlass(x1, z1, x2, z2, info) {
  f1Seg(x1, z1, x2, z2, F1_FFL, ACP_SILL, M.acp);
  f1Seg(x1, z1, x2, z2, F1_FFL + ACP_SILL, H1 - ACP_SILL - ACP_HEAD, M.glass, info);
  f1Seg(x1, z1, x2, z2, F1_FFL + H1 - ACP_HEAD, ACP_HEAD, M.acp);
}

export const GLASS_INFO = d => ({ color: 0x9ec6d4, baseOpacity: 0.30, ...d });
export const BRICK_INFO = d => ({ color: 0xf0ede6, baseOpacity: 1, ...d });

// Designed brick face with a framed, recessed ribbon window: brick field, recessed
// glass, white lintel + sill trim, projecting soldier course, and optional brick
// pilasters splitting the ribbon into bays.
export function brickFace(x1, z1, x2, z2, glassInfo, inset, bays) {
  const len = Math.hypot(x2-x1, z2-z1);
  const ux = (x2-x1)/len, uz = (z2-z1)/len;   // unit vector along the face
  const nx = uz, nz = -ux;                    // outward normal (approx)
  // 1. brick field, full height
  f1Seg(x1, z1, x2, z2, F1_FFL, H1, M.brickR, {
    color:0xbcd2e0, baseOpacity:1, ...glassInfo._brick });
  // window span
  const t = inset/len;
  const wx1 = x1 + (x2-x1)*t, wz1 = z1 + (z2-z1)*t;
  const wx2 = x2 - (x2-x1)*t, wz2 = z2 - (z2-z1)*t;
  const wlen = Math.hypot(wx2-wx1, wz2-wz1);
  // 2. recessed glass (sits back via REVEAL along the normal)
  f1Seg(wx1 - nx*REVEAL, wz1 - nz*REVEAL, wx2 - nx*REVEAL, wz2 - nz*REVEAL,
        SILL, GH, M.glass, glassInfo);
  // 3. white lintel above + white sill below the glass, proud of the brick
  f1Seg(wx1 + nx*0.05, wz1 + nz*0.05, wx2 + nx*0.05, wz2 + nz*0.05,
        HEAD, WHITE_T, M.mull);
  f1Seg(wx1 + nx*0.05, wz1 + nz*0.05, wx2 + nx*0.05, wz2 + nz*0.05,
        SILL - WHITE_T, WHITE_T, M.mull);
  // 4. projecting SOLDIER course (thin brick band) just above the lintel
  f1Seg(wx1, wz1, wx2, wz2, HEAD + WHITE_T, 0.5, M.brickD);
  // 5. brick PILASTERS splitting the ribbon into bays, projecting proud
  if (bays > 1) {
    for (let b = 1; b < bays; b++) {
      const bt = b/bays;
      const px = wx1 + (wx2-wx1)*bt, pz = wz1 + (wz2-wz1)*bt;
      box(1.0 + Math.abs(nx)*0, GH + 1.4, 1.0,
          px + nx*0.25, (SILL+HEAD)/2, pz + nz*0.25, M.brickR, G.f1);
    }
  }
}
