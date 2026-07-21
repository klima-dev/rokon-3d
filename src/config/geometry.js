/* Derived geometry constants computed from the raw dimensions. Centralized here
   so roads, cantilevers, the first floor AND the camera views all read the same
   value — never recompute one of these formulas in a second file. */
import { X, Z, OUT, WT, CANTI_S, CANTI_SHOP, CANTI_W, H, H1, SLAB } from './dimensions.js';

/* --- north / main road ---------------------------------------------------- */
export const M2FT = 3.28084;
export const ROAD_W = 10, ROAD_L = 30 * M2FT, ROAD_GAP = 2;
export const roadZs = (Z.shopS + CANTI_SHOP) + ROAD_GAP;   // south edge of the road
export const roadZc = roadZs + ROAD_W/2;
export const F1_XW = X.e + CANTI_W;                          // west cantilever edge (= F1.xW)
export const FIN_X = F1_XW + 1.2/2 - 0.1;                    // corner fin centre (NW corner)
export const roadXs = OUT.x0;                                // EAST start (shop side)
export const roadXe = FIN_X + ROAD_L;                        // WEST end = 30 m past the fin
export const ROAD_SPAN = roadXe - roadXs;                    // full lane length
export const roadXc = (roadXs + roadXe) / 2;
export const MAIN_W = 30, MAIN_L = 300;
export const mainXi = roadXe;                 // inner (east) edge = where the lane ends
export const mainXc = mainXi + MAIN_W/2;      // runs further west (+X)
export const mainZc = roadZc;                 // T centred on the small lane

/* --- column grid (shared by ground floor + 1st floor, they must stack) ----- */
export const MID_L = 13.111;
export const COL_X = [X.w, MID_L, X.stairW, X.e];
export const colGrid = [
  ...COL_X.map(x => [x, Z.n]),       // north wall
  ...COL_X.map(x => [x, Z.entry]),   // entry line — same four axes
  [X.shopE,Z.shutter],[X.stairW,Z.shutter],[X.e,Z.shutter],
  // west wall (x=0), on the showroom shutter line — fills the 27'-6" gap
  // between the entry line and the shop's front corner, which had nothing
  // between them.
  [X.w,Z.shutter],
  [X.stairW,Z.verandha],[X.e,Z.verandha],
  [X.w,Z.shopS],[X.shopE,Z.shopS],
];

/* --- first floor envelope ------------------------------------------------- */
export const F1_FFL = H + SLAB;          // 11'-0" — 1st floor finished floor
export const F1_WT  = 0.5;               // envelope thickness

export const F1 = {
  xE: OUT.x0,                          // site EAST  edge
  xW: X.e + CANTI_W,                   // site WEST  edge
  zS: OUT.z0,                          // site SOUTH edge
  zNmain: Z.verandha + CANTI_S,        // site NORTH, main block
  zNshop: Z.shopS + CANTI_SHOP,        // site NORTH, shop wing (6'-2" further out)
  xStep:  X.shopE + WT/2 + CANTI_SHOP, // the jog between the two north lines
  zBrick: Z.shutter,                   // brick stops where the stair bay ends
};

// north-facade framed ribbon window bands
export const FR = 1.4;
export const HEAD = F1_FFL + H1 - FR - 0.6;   // window head
export const SILL = F1_FFL + 2.2;             // window sill (raised, gives a base)
export const GH   = HEAD - SILL;              // glass height
export const WHITE_T = 0.35;                  // white lintel/sill trim thickness
export const REVEAL = 0.35;                   // how deep the glass sits back

export const F1_ROOF_Y = F1_FFL + H1;         // 21'-6" — 1st floor roof / 2nd floor slab

/* --- eye-level view (person at the lane / main-road junction mouth) -------- */
export const EYE_Y = 5.417;                   // 5'-5" exact
export const T_X = FIN_X + ROAD_L;            // junction mouth, on the lane centre
export const T_Z = roadZc;
