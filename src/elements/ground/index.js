import * as THREE from 'three';
import { box } from '../../lib/builders.js';
import { G } from '../../core/groups.js';
import { M } from '../../core/materials.js';
import { CX, CZ, SLAB, OUT, WT, Z } from '../../config/dimensions.js';

export function build() {
  /* ---------- ground plane ---------- */
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(1200,1200),
    new THREE.MeshStandardMaterial({ color:0xdcd9d0, roughness:1 }));
  ground.rotation.x = -Math.PI/2;
  ground.position.set(CX, -SLAB-0.08, CZ);
  ground.receiveShadow = true;
  G.base.add(ground);

  /* ---------- reference grid ---------- */
  const grid = new THREE.GridHelper(1200, 1200, 0xb9b6ad, 0xd2cfc6);
  grid.position.set(CX, -SLAB-0.04, CZ);
  G.grid.add(grid);

  /* ---------- ground slab: main block + shop tail ---------- */
  box(OUT.x1-OUT.x0, SLAB, Z.verandha-OUT.z0, CX, -SLAB, (OUT.z0+Z.verandha)/2, M.slab, G.base);
  box(10+WT, SLAB, Z.shopS-Z.verandha+WT/2, (OUT.x0+10.5)/2, -SLAB,
      (Z.verandha+Z.shopS+WT/2)/2, M.slab, G.base);
}
