import * as THREE from 'three';
import { scene } from './scene.js';

/* One THREE.Group per toggleable feature. Every mesh is added to one of these
   (never straight to the scene) so the panel checkboxes can show/hide it. */
export const G = {};
['walls','cols','stair','shutter','labels','dims','grid','zones','base','roof','f1','road','models']
  .forEach(k => { G[k] = new THREE.Group(); scene.add(G[k]); });
