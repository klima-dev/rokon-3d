import { addLabel } from '../lib/labels.js';
import { G } from '../core/groups.js';
import { Z } from '../config/dimensions.js';
import { ROOMS } from '../config/rooms.js';

// One name tag per room (from config/rooms.js), plus the standalone "Back showroom
// entry" marker, which labels an opening rather than a room.
export function build() {
  ROOMS.forEach(r => addLabel(G.labels, r.label.text, r.label.x, r.label.y, r.label.z));
  addLabel(G.labels, 'Back showroom entry', 20, 9.6, Z.entry);
}
