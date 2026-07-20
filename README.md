# Rokon — Ground Floor 3D

An interactive Three.js model of the **Rokon** building (ground floor + first floor),
built from the `ROKON_GF-1.pdf` drawings. It runs in any modern browser with **no build
step** — native ES modules loaded via an import map, Three.js pulled from a CDN, and all
textures drawn procedurally in-code so it works offline once the CDN is cached.

Everything is modelled in **decimal feet** (1 scene unit = 1 ft). Overall footprint
40′-4″ × 47′-10″.

---

## Quick start

Because it uses ES-module imports from a CDN, open it over **http\://**, not `file://`
(browsers block module/CDN loads from the filesystem).

```bash
# from the repo root — any static server works
python -m http.server 8000
# then open http://localhost:8000/rokon_gf_3d_v68.html
```

Or use the VS Code "Live Server" extension, `npx serve`, etc. First load needs internet
(Three.js from jsDelivr); after that the browser cache covers it.

---

## Controls

**Orbit mode (default)**
| Action | Input |
| --- | --- |
| Orbit | Left-drag |
| Zoom | Scroll |
| Pan | Right-drag |
| Inspect a room / element | Click any surface → info card opens |

**View presets** (left panel → *View*): Main road · West–North · Isometric ·
Eye-level 5′5″ · Site + roads · Top/plan · Front (south) · Free-fly walkthrough.

**Eye-level view** — plants a 5′5″ observer at the lane/main-road junction. Drag to turn
your head (yaw + limited pitch); scroll to step forward/back at standing height.

**Free-fly walkthrough** — mouse position aims (soft-aim, no pointer lock so it works in
sandboxed iframes), `WASD`/arrows move, `Q`/`E` down/up, `Shift` sprints, `Esc` exits.

**Show toggles** (left panel → *Show*): walls, columns & beams, stair, roof + cantilever,
first floor, north road, shutters & gates, labels, dimensions, ground grid. Labels and
dimensions start off; a tag is visible only when *both* the master Labels switch and its
own feature group are on.

---

## Project structure

The scene is split into small ES modules — a shared **foundation** (config, core, lib)
that every building **element** imports, then one folder per element, plus the interaction
layer. `rokon_gf_3d_v68.html` holds only markup + the import map and loads `src/main.js`.

```
rokon-3d/
├── rokon_gf_3d_v68.html        markup, import map, panel/compass/room UI
├── css/
│   └── styles.css              all styling
└── src/
    ├── main.js                 orchestrator: build elements in order, wire UI, run loop
    ├── config/
    │   ├── dimensions.js        raw centrelines: X, Z, OUT, wall/column/height consts
    │   └── geometry.js          derived consts: roads, colGrid, F1 envelope, façade bands, eye-view
    ├── core/
    │   ├── scene.js             scene, camera, renderer, labelRenderer, orbit, resize
    │   ├── environment.js       PMREM RoomEnvironment (glass reflections)
    │   ├── lights.js            hemisphere + directional sun
    │   ├── materials.js         procedural textures + the M material dictionary
    │   ├── groups.js            G.* toggle groups
    │   └── registries.js        shared clickable[] + labelRegistry[] arrays
    ├── lib/
    │   ├── format.js            ftin() feet-and-inches formatter
    │   ├── builders.js          box(), wall(), beam(), makeClickable()
    │   └── labels.js            label(), addLabel(), dim()
    ├── elements/
    │   ├── ground/              ground plane, slab, reference grid
    │   ├── roads/               north lane + main road (T-junction)
    │   ├── roof/                ground-floor roof / 1st-floor slab
    │   ├── zones/               7 clickable floor-tint rooms
    │   ├── walls/               ground-floor walls
    │   ├── columns/             columns + beams
    │   ├── shutters/            shutters + gates
    │   ├── stair/               switchback stair
    │   ├── cantilevers/         1st-floor cantilever slabs
    │   └── first-floor/
    │       ├── index.js         builds the sub-parts in order
    │       ├── helpers.js       f1Seg(), brickFace(), acpGlass(), GLASS_INFO/BRICK_INFO
    │       ├── columns.js       stacked columns
    │       ├── facade-north.js  main-block glass, step brick, shop-wing brick+window
    │       ├── showcase.js      product display deck + L-corner glass showcase tower
    │       ├── wall-west.js     brick + clerestory band + mullions + showcase glass
    │       ├── walls-blind.js   blind east + south brick
    │       ├── band.js          dark accent band
    │       ├── floor.js         open floor plate + 1st-floor roof
    │       ├── fin.js           corner signage pylon
    │       └── sign.js          west wall sign fascia
    ├── annotations/
    │   ├── zone-labels.js       zone name tags
    │   └── dimensions.js        dimension lines
    └── interaction/
        ├── state.js             shared mutable camera-mode flags (flying, headLook)
        ├── panel.js             dropdown + Show toggles + label visibility
        ├── selection.js         raycast click → info card
        ├── views.js             view presets (setView)
        ├── fly.js               free-fly look + movement
        ├── eye-level.js         fixed-position head-look
        └── compass.js           compass dial update
```

Build order lives in `src/main.js`: each element module exports a `build()` that adds its
meshes via the shared helpers; each interaction module exports an `init()`.

---

## Coordinate & compass conventions (read before editing)

The file's internal axes are **rotated relative to real site north** — worth knowing before
you touch geometry:

- `+X` = **west** (so `X.e` is the west face, where the 5′ cantilever sits); `X.w` = east.
- `+Z` = **south** (`Z.n` = back-showroom rear, `Z.shopS` = street frontage); `Y` = up.
- **Real site north is the shop/street side** (`Z.shopS`). Only the on-screen **compass
  display** is remapped to true site north; code comments and info-card text still use the
  raw axis names ("north wall" = `Z.n`, "west wall" = `X.e`). Treat those as internal labels.

Anything at first-floor level goes into the `G.f1` group (or a new group stacked at
`y = F1_FFL`) so the ground floor stays independently toggleable.

---

## Contributing / editing the scene

A few conventions keep edits from breaking things:

### Where things live
- **Constants** — `config/dimensions.js` (raw centrelines) and `config/geometry.js` (derived
  values). These are the single source of truth; change a value here and everything that
  references it moves together. Never hardcode a coordinate in an element file.
- **Materials** (`core/materials.js`) are shared across meshes. **Don't mutate a shared
  material for a one-off effect** — `mat.clone()` first.
- **Groups** (`core/groups.js`) — add meshes via `box()`/`wall()` into a `G.*` group (never
  straight to the scene) so the panel can toggle them.

### Adding a clickable element
Selection highlighting mutates the mesh's material, so a clickable **must own its material**.
Use `makeClickable(mesh)` from `lib/builders.js` — it clones the material and registers the
mesh with the raycaster. Set `mesh.userData` before registering:

```js
import { box, makeClickable } from '../../lib/builders.js';
const m = box(w, SLAB, dp, x, y, z, M.roof, G.roof);
m.userData = {
  color: 0xc8552f, name: 'My element',
  dim: `${ftin(w)} × ${ftin(dp)}`, area: `${Math.round(w*dp)} sf`,
  details: ['line one', 'line two'],
  baseOpacity: 0.42,   // <1 highlights by going more solid; 1 glows via emissive
};
makeClickable(m);
```

### Adding a label / dimension
Use `addLabel(group, text, x, y, z, cls)` and `dim(x1,z1,x2,z2,text)` from `lib/labels.js`
so tags register with the master **Labels** toggle. Never set a tag's `element.style.display`
by hand — `CSS2DRenderer` overwrites it from `object.visible` every frame.

### Adding a view preset
1. Add a `<button class="btn" id="v-name">Label</button>` in the *View* group in the HTML.
2. Wire it in `interaction/views.js`:
   `document.getElementById('v-name').onclick = () => setView([x,y,z],[tx,ty,tz], fov);`

### Adding a whole new element
Create `src/elements/<name>/index.js` exporting `build()`, then import it in `src/main.js`
and call `<name>.build()` in the build sequence.

---

## Tech

- **Three.js 0.160.0** (ES module + addons: `OrbitControls`, `CSS2DRenderer`, `RoomEnvironment`),
  via jsDelivr and an inline import map.
- No bundler, no dependencies to install, no framework.

---

## License

No license specified. Add one if you intend to share or reuse.
