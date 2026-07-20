import { addLabel } from '../lib/labels.js';
import { G } from '../core/groups.js';
import { X, Z } from '../config/dimensions.js';

export function build() {
  [['Back showroom  40\'-4" × 20\'-4"', (X.w+X.e)/2, 6.5, Z.entry/2],
   ['Shop  10\' × 27\'-6"', X.shopE/2, 6.5, (Z.entry+Z.shopS)/2],
   ['Front showroom  19\'-10" × 15\'-4"', (X.shopE+X.stairW)/2, 6.5, (Z.entry+Z.shutter)/2],
   ['Stair  9\'-8" bay', (X.stairW+X.e)/2, 12, (Z.entry+Z.gateway)/2],
   ['Gateway  9\'-8" × 4\'-0"', (X.stairW+X.e)/2, 5.5, (Z.gateway+Z.shutter)/2],
   ['Verandha  6\' deep', (X.shopE+X.stairW)/2, 3.5, (Z.shutter+Z.verandha)/2],
   ['Bike park', (X.stairW+X.e)/2, 3.5, (Z.shutter+Z.verandha)/2],
   ['Back showroom entry', 20, 9.6, Z.entry],
  ].forEach(([t,x,y,z]) => addLabel(G.labels, t,x,y,z));
}
