/* Ground-floor rooms — the single source of truth for the seven floor zones AND
   their name tags. elements/zones/index.js reads bounds/color/details to build the
   clickable floor tints; annotations/zone-labels.js reads label to place the tags.
   Edit a room in one place here.

   Order matters — it fixes the build order of the tints and labels.

   NOTE: `label.text` is kept explicit (not derived from name/bounds) because the
   tags use shortened names and hand-tuned heights ("Stair" vs the "Stair bay"
   zone; y ranges 3.5–12). The dimension LINES (annotations/dimensions.js) are
   building-edge measurements, not room data, so they intentionally live elsewhere. */
import { X, Z } from './dimensions.js';

export const ROOMS = [
  {
    name: 'Back showroom', color: 0x8b7fd4,
    bounds: [X.w, Z.n, X.e, Z.entry],
    details: [
      'Full 40\'-4" street frontage on the north wall',
      'Opens south into the front showroom only — the shop is walled off',
      'Largest display floor in the building',
    ],
    label: { text: 'Back showroom  40\'-4" × 20\'-4"', x: (X.w+X.e)/2, y: 6.5, z: Z.entry/2 },
  },
  {
    name: 'Shop', color: 0x3fae8c,
    bounds: [X.w, Z.entry, X.shopE, Z.shopS],
    details: [
      'East bay, runs the full 27\'-6" depth of the building',
      'Own 4\'-0" cantilever projecting south past the main footprint',
      'Closed room — solid wall to the back showroom',
      'Entered through its own 7\'-7" shutter on the south front',
    ],
    label: { text: 'Shop  10\' × 27\'-6"', x: X.shopE/2, y: 6.5, z: (Z.entry+Z.shopS)/2 },
  },
  {
    name: 'Front showroom', color: 0x8b7fd4,
    bounds: [X.shopE, Z.entry, X.stairW, Z.shutter],
    details: [
      'Central bay, between the shop and the stair',
      'South wall carries the showroom shutter at the entrance',
      'Beam over at the entry line and again at the shutter line',
    ],
    label: { text: 'Front showroom  19\'-10" × 15\'-4"', x: (X.shopE+X.stairW)/2, y: 6.5, z: (Z.entry+Z.shutter)/2 },
  },
  {
    name: 'Stair bay', color: 0xd9a03c,
    bounds: [X.stairW, Z.entry, X.e, Z.gateway],
    details: [
      'Single switchback: up the east side, half landing, back down the west',
      'Reached from the gateway at its south edge, not directly off the street',
      'Wraps an open 2\'-6" x 7\'-4" void — no guard rail modelled yet',
      '16 treads @ 11", 17 risers @ 7.41", arrives at 1st floor over the gateway',
    ],
    label: { text: 'Stair  9\'-8" bay', x: (X.stairW+X.e)/2, y: 12, z: (Z.entry+Z.gateway)/2 },
  },
  {
    name: 'Gateway', color: 0x3f7fbf,
    bounds: [X.stairW, Z.gateway, X.e, Z.shutter],
    details: [
      'Shared entry lobby — flat, at floor level, no treads',
      'Gate A (west, outer wall) is the street gate in',
      'Gate B (east) opens through into the front showroom',
      'Stair rises from its north edge; the 1st floor arrives back overhead',
    ],
    label: { text: 'Gateway  9\'-8" × 4\'-0"', x: (X.stairW+X.e)/2, y: 5.5, z: (Z.gateway+Z.shutter)/2 },
  },
  {
    name: 'Verandha', color: 0x9a978d,
    bounds: [X.shopE, Z.shutter, X.stairW, Z.verandha],
    details: [
      'Covered strip in front of the showroom shutter',
      '5\'-0" and 4\'-0" cantilevers project overhead from the first floor',
    ],
    label: { text: 'Verandha  6\' deep', x: (X.shopE+X.stairW)/2, y: 3.5, z: (Z.shutter+Z.verandha)/2 },
  },
  {
    name: 'Bike park', color: 0x9a978d,
    bounds: [X.stairW, Z.shutter, X.e, Z.verandha],
    details: [
      'West of the verandha, alongside the stair gates',
      'Low 3\'-0" kerb divides it from the verandha',
    ],
    label: { text: 'Bike park', x: (X.stairW+X.e)/2, y: 3.5, z: (Z.shutter+Z.verandha)/2 },
  },
];
