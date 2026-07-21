/* ==========================================================================
   DIMENSIONS  —  all values in decimal feet, taken from ROKON_GF-1.pdf
   --------------------------------------------------------------------------
   X increases to the WEST (width) · Z increases to the SOUTH (depth) · Y = up
   so X.w (0) is the EAST side of the building and X.e (39.333) is the WEST side —
   the 5' cantilever sits on X.e, i.e. the WEST face.
   X centrelines : 0 · 10 · 29.833 · 39.333
     0 -> 10        = 10'-0"   shop bay
     10 -> 29.833   = 19'-10"  central bay (front + back showroom)
     29.833 -> 39.333 = 9'-6"  stair bay  (plan says 9'-8"; 2" absorbed here
                                so the 40'-4" overall closes exactly)
   Z centrelines : 0 · 20.333 · 35.667 · 41.667 · 47.833
     0 -> 20.333    = 20'-4"   back showroom depth
     20.333 -> 35.667 = 15'-4" front showroom / stair run
     35.667 -> 41.667 = 6'-0"  verandha + bike park
     20.333 -> 47.833 = 27'-6" shop depth (east wall)
   Cantilevers (dashed on plan, upper floor only): 5' west · 4' south · 4' shop
   ========================================================================== */

export const WT   = 0.833;      // 10" wall
export const COL  = 1.0;        // 12" x 12" column
export const H    = 10.5;       // ground floor height, floor to u/s of 1st slab
export const H1   = 10.5;       // 1st floor height, floor to u/s of 2nd slab
export const SLAB = 0.5;        // slab thickness
export const CANTI_W = 5, CANTI_S = 4, CANTI_SHOP = 4;   // CANTI_W: west-side cantilever, at X.e
export const STAIR_ENTRY = 4;   // depth of the flat gateway landing inside Gates A & B

export const X = { w:0, shopE:10, stairW:29.833, e:39.333 };
export const Z = { n:0, entry:20.333, shutter:35.667, verandha:41.667, shopS:47.833 };
Z.gateway = Z.shutter - STAIR_ENTRY;   // 31.667 — where the treads begin

export const OUT = { x0:X.w-WT/2, x1:X.e+WT/2, z0:Z.n-WT/2, z1:Z.shopS+WT/2 };
export const CX = (OUT.x0+OUT.x1)/2, CZ = (OUT.z0+OUT.z1)/2;
