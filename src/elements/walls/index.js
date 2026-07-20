import { wall } from '../../lib/builders.js';
import { X, Z, H } from '../../config/dimensions.js';

export function build() {
  // north (back showroom rear) — solid, full 40'-4"
  wall(X.w, Z.n, X.e, Z.n);
  // west wall, north stretch, with backup shutter opening z 14 -> 20.333
  wall(X.e, Z.n, X.e, 14);
  // west wall alongside the stair bay — stops at the gateway, where Gate A opens
  wall(X.e, Z.entry, X.e, Z.gateway);
  // east wall: back showroom + shop, full run
  wall(X.w, Z.n, X.w, Z.shopS);
  // shop west wall
  wall(X.shopE, Z.entry, X.shopE, Z.shopS);
  // shop north wall — SOLID divider between the shop and the back showroom.
  // The 'back showroom entry' opening is only the central bay (x 10 -> 29.833);
  // the shop is a closed room off its own south entrance, so this 10' stretch
  // is a full wall, not part of that opening.
  wall(X.w, Z.entry, X.shopE, Z.entry);
  // shop south wall — piers either side of the shop's own street shutter
  wall(X.w, Z.shopS, X.w+1.2, Z.shopS);
  wall(X.shopE-1.2, Z.shopS, X.shopE, Z.shopS);
  // stair bay east wall — stops at the gateway, where Gate B opens through into
  // the front showroom. This is the link that makes the gateway a shared lobby:
  // street -> gate -> gateway -> front showroom AND stair.
  wall(X.stairW, Z.entry, X.stairW, Z.gateway);
  // no spine wall here — this bay stays open between the two flights,
  // forming the central void the stair wraps around (see stair block)
  // verandha / bike park divider
  wall(X.stairW, Z.shutter, X.stairW, Z.verandha, H*0.0 + 3.0, 0.5); // low kerb
  // front showroom south wall piers either side of the shutter
  wall(X.shopE, Z.shutter, X.shopE+1.2, Z.shutter);
  wall(X.stairW-1.2, Z.shutter, X.stairW, Z.shutter);
}
