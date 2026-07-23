import GUI from 'lil-gui';
import { scene } from '../core/scene.js';
import { sun } from '../core/lights.js';
import { M } from '../core/materials.js';

/* Live-tweaking panel (vendored lil-gui). A small dev/inspection tool for
   nudging lighting, glass and fog at runtime — every control writes straight to
   the live Three.js object, so changes show immediately. Starts collapsed and
   sits bottom-right so it stays clear of the compass, info card and main panel. */
export function init() {
  const gui = new GUI({ title: 'Tweaks' });
  gui.domElement.style.cssText =
    'position:fixed;right:14px;bottom:14px;top:auto;z-index:20';

  const s = gui.addFolder('Sun');
  s.add(sun, 'intensity', 0, 4, 0.05);
  s.add(sun.position, 'x', -120, 120, 1).name('position x');
  s.add(sun.position, 'y', 10, 160, 1).name('height y');
  s.add(sun.position, 'z', -120, 120, 1).name('position z');

  gui.addFolder('Glass').add(M.glass, 'opacity', 0, 1, 0.01);

  const f = gui.addFolder('Fog');
  f.add(scene.fog, 'near', 0, 1000, 10);
  f.add(scene.fog, 'far', 200, 2000, 10);

  gui.close();   // collapsed by default — click the title to open
}
