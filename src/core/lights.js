import * as THREE from 'three';
import { scene } from './scene.js';

scene.add(new THREE.HemisphereLight(0xffffff, 0x9a978d, 1.5));

const sun = new THREE.DirectionalLight(0xfff4e2, 1.7);
sun.position.set(-40, 70, -34);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
const d = 60;
Object.assign(sun.shadow.camera, { left:-d, right:d, top:d, bottom:-d, near:1, far:220 });
sun.shadow.bias = -0.0006;
scene.add(sun);

export { sun };
