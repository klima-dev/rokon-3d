import { box } from '../../lib/builders.js';
import { G } from '../../core/groups.js';
import { M } from '../../core/materials.js';
import { X, Z, H } from '../../config/dimensions.js';

/* ---------- stair: single switchback wrapping a central void ----------
   Per the hand sketch: ONE continuous stair, not two parallel flights.

     gateway --> up the EAST side (north-bound)
              --> half landing across the whole NORTH end
              --> up the WEST side (south-bound)
              --> arrives at 1st floor above the gateway, exits south

   flight width 3'-6" each side · central void 2'-6" x 7'-4" · 8 treads @ 11"
   per flight · half landing 9'-6" x 4'-0" · 17 risers @ 7.41" -> exactly 10'-6".
   The void stays open and unguarded along the flights' inner edges — a real
   build wants a guard rail there, not modelled yet. */
const TREAD    = 11/12;
const FLIGHT_W = 3.5;                     // width of each side flight
const PER      = 8;                       // treads per flight
const RISER    = H / (PER*2 + 1);         // 17 risers -> lands exactly on the 1st floor

export function build() {
  const zLandS = Z.gateway - PER*TREAD;   // 24.333 — landing's south edge

  // Flight 1 — EAST side, climbing north out of the gateway
  const xF1 = X.stairW + FLIGHT_W/2;
  for (let i = 0; i < PER; i++) {
    box(FLIGHT_W, RISER, TREAD, xF1, i*RISER, Z.gateway - TREAD/2 - i*TREAD, M.stair, G.stair);
  }
  // Half landing — full bay width across the north end, turns you 180 degrees
  box(X.e - X.stairW, RISER, zLandS - Z.entry, (X.stairW + X.e)/2,
      PER*RISER, (Z.entry + zLandS)/2, M.stair, G.stair);

  // Flight 2 — WEST side, climbing back south to the 1st floor
  const xF2 = X.e - FLIGHT_W/2;
  for (let i = 0; i < PER; i++) {
    box(FLIGHT_W, RISER, TREAD, xF2, (PER + 1 + i)*RISER,
        zLandS + TREAD/2 + i*TREAD, M.stair, G.stair);
  }
}
