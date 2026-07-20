import { f1Seg, brickFace, GLASS_INFO } from './helpers.js';
import { M } from '../../core/materials.js';
import { H1 } from '../../config/dimensions.js';
import { F1, F1_FFL, SILL, GH } from '../../config/geometry.js';

/* ============ NORTH FACADE — DESIGNED BRICK + GLASS (v52) ============
   Main block: a plain recessed ribbon of glass in a brick field.
   Step: solid brick jog carrying the L-corner showcase (glass added in showcase.js).
   Shop wing: plain brick + a simple window.  */
export function build() {
  // --- main block: plain glass ribbon punched into a plain brick face ---
  (function mainBlockGlass(){
    const x1 = F1.xStep, z1 = F1.zNmain, x2 = F1.xW, z2 = F1.zNmain;
    const len = Math.hypot(x2-x1, z2-z1);
    const nx = (z2-z1)/len, nz = -(x2-x1)/len;
    const inset = 2.5;
    const t = inset/len;
    const wx1 = x1 + (x2-x1)*t, wz1 = z1 + (z2-z1)*t;
    const wx2 = x2 - (x2-x1)*t, wz2 = z2 - (z2-z1)*t;
    // plain brick fills the whole face...
    f1Seg(x1, z1, x2, z2, F1_FFL, H1, M.brickR, {
      color:0xbcd2e0, baseOpacity:1, name:'North brick — main block',
      details:['Plain brick face, filling above and below the glass',
               'No ornament — just gathuni (masonry) around the window'] });
    // ...with the glass ribbon punched into the middle
    f1Seg(wx1, wz1, wx2, wz2, SILL, GH, M.glass, GLASS_INFO({
      name:'North glass — main block',
      details:['Plain glazed ribbon window, brick above and below',
               'Same opening as before — sill to head'] }));
  })();

  // --- step: solid brick jog between main block and shop wing (L-corner) ---
  f1Seg(F1.xStep, F1.zNmain, F1.xStep, F1.zNshop, F1_FFL, H1, M.brickR, {
    color:0xbcd2e0, baseOpacity:1, name:'North brick — step',
    details:['Solid brick jog between main block and shop wing, 6\'-2" wide',
             'Carries a full-height glass showcase tower in the fold of the L'] });

  // --- shop wing: plain brick + a simple window ---
  brickFace(F1.xE, F1.zNshop, F1.xStep, F1.zNshop,
    { ...GLASS_INFO({ name:'North glass — shop wing',
        details:['Simple window in a plain brick face'] }),
      _brick:{ name:'North brick — shop wing',
        details:['Plain brick face — clean and modern, no ornament'] } },
    5.5, 1);
}
