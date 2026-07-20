import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { scene } from './scene.js';
import { renderer } from './scene.js';

// Environment map: gives the glass something to reflect and refract, so it
// reads as real glass (mirror-like sheen + soft see-through) instead of flat
// tinted plastic. RoomEnvironment is procedural — no external file needed.
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
pmrem.dispose();   // env map is baked; free the generator's render target
