import { box } from '../../lib/builders.js';
import { addLabel } from '../../lib/labels.js';
import { G } from '../../core/groups.js';
import { M } from '../../core/materials.js';
import { X, Z } from '../../config/dimensions.js';

export function build() {
  // shop front shutter: the shop's own street entrance on its south face,
  // z = 47.833, 7'-7" clear between the piers. This is how the shop is entered.
  box(7.6, 9.5, 0.25, (X.w + X.shopE)/2, 0, Z.shopS, M.shutter, G.shutter);
  addLabel(G.labels, 'Shop shutter', (X.w + X.shopE)/2, 10.6, Z.shopS);
  // showroom shutter for entrance: z = 35.667, x 11.2 -> 28.633
  box(17.4, 9.5, 0.25, (11.2+28.633)/2, 0, Z.shutter, M.shutter, G.shutter);
  addLabel(G.labels, 'Showroom shutter', 20, 10.6, Z.shutter);
  // backup shutter: west wall, z 14 -> 20.333
  box(0.25, 9.5, 6.33, X.e, 0, 17.17, M.shutter, G.shutter);
  addLabel(G.labels, 'Backup shutter', X.e+0.6, 10.6, 17.17);
  // Gates A & B sit in the SIDE walls of the gateway, not across its south face.
  // Gate B (east, in the X.stairW wall) is the way through into the front
  // showroom; Gate A (west, in the X.e wall) is the outer street gate. Both are
  // 3'-6" leaves centred in the 4'-0" deep gateway.
  const zGate = (Z.gateway + Z.shutter)/2;
  box(0.2, 8.5, 3.5, X.stairW, 0, zGate, M.gate, G.shutter);   // Gate B — into front showroom
  box(0.2, 8.5, 3.5, X.e,      0, zGate, M.gate, G.shutter);   // Gate A — outer street gate
  addLabel(G.labels, 'Gate B', X.stairW - 0.6, 9.4, zGate);
  addLabel(G.labels, 'Gate A', X.e + 0.6, 9.4, zGate);
}
