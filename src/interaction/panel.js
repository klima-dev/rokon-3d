import { G } from '../core/groups.js';
import { labelRegistry } from '../core/registries.js';

// A tag is shown only if BOTH the master Labels switch is on AND its own feature
// group is visible. This sets obj.visible (the CSS2DObject's Object3D flag), NOT
// element.style.display — CSS2DRenderer recomputes display from object.visible on
// every render(), so a manual style.display='none' gets overwritten next frame.
let labelsOn = false;
function refreshLabelVisibility() {
  labelRegistry.forEach(({ obj, group }) => {
    obj.visible = labelsOn && group.visible;
  });
}

// bind() reads the checkbox's `checked` attribute and applies it immediately, so
// the HTML markup is the SINGLE source of truth for every default.
const bind = (id, g) => {
  const el = document.getElementById(id);
  const setVis = on => {
    g.visible = on;
    refreshLabelVisibility();
  };
  el.addEventListener('change', () => setVis(el.checked));
  setVis(el.checked);   // apply the markup default at startup
};

export function init() {
  document.getElementById('panel-toggle').addEventListener('click', () => {
    document.getElementById('panel').classList.toggle('open');
  });

  bind('t-walls', G.walls); bind('t-cols', G.cols); bind('t-stair', G.stair);
  bind('t-shutter', G.shutter); bind('t-roof', G.roof); bind('t-f1', G.f1); bind('t-road', G.road);
  bind('t-dims', G.dims); bind('t-grid', G.grid);

  const elLabels = document.getElementById('t-labels');
  elLabels.addEventListener('change', () => {
    labelsOn = elLabels.checked;
    refreshLabelVisibility();
  });
  // Labels + Dimensions both start OFF (read from the markup, single source of truth).
  labelsOn = elLabels.checked;
  refreshLabelVisibility();
}
