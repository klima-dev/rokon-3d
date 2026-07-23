import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { G } from '../core/groups.js';

/* Load a real .glb / .gltf model into the scene.

   GLTFLoader is a vendored Three.js addon (vendor/addons/loaders/). It loads
   async, so this returns a Promise resolving to the model's root Object3D.

   Keep the scene offline: put model files under assets/models/ and pass a
   relative URL (e.g. 'assets/models/chair.glb') so they're served same-origin —
   never a remote http(s) URL, which would break the no-external-requests rule.

   Meshes land in the toggleable G.models group (like every other element), and
   coordinates are in feet (1 unit = 1 ft), so `scale` converts the model's own
   units to feet. */
const loader = new GLTFLoader();

export function loadModel(url, { position = [0, 0, 0], scale = 1, rotationY = 0,
                                 group = G.models } = {}) {
  return new Promise((resolve, reject) => {
    loader.load(url, gltf => {
      const root = gltf.scene;
      root.position.set(position[0], position[1], position[2]);
      root.scale.setScalar(scale);
      root.rotation.y = rotationY;
      root.traverse(o => { if (o.isMesh) o.castShadow = o.receiveShadow = true; });
      group.add(root);
      resolve(root);
    }, undefined, reject);
  });
}
