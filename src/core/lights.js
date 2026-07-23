import * as THREE from 'three';
import { scene } from './scene.js';
import { LOW_POWER } from './device.js';

scene.add(new THREE.HemisphereLight(0xffffff, 0x9a978d, 1.5));

const sun = new THREE.DirectionalLight(0xfff4e2, 1.7);
sun.position.set(-40, 70, -34);
// No shadow-casting on mobile (renderer.shadowMap is disabled there too), so we
// skip allocating the shadow camera + map entirely.
sun.castShadow = !LOW_POWER;
sun.shadow.mapSize.set(2048, 2048);
const d = 60;
Object.assign(sun.shadow.camera, { left:-d, right:d, top:d, bottom:-d, near:1, far:220 });
sun.shadow.bias = -0.0006;
scene.add(sun);

export { sun };
