# CLAUDE.md

Guidance for AI assistants working in this repository. Read this before editing
the scene — it front-loads the conventions that are easy to break. For the full
human-facing tour (controls, folder tree, plan geometry), see `README.md`.

## Project overview

`rokon-3d` is an interactive Three.js model of the **Rokon** building (ground
floor + first floor), built from architectural drawings (`ROKON_GF-1.pdf`).
Everything is modelled in **decimal feet** — 1 scene unit = 1 ft; overall
footprint 40′-4″ × 47′-10″.

**No build step. No npm. No dependencies. No framework. No external requests.**
Native ES modules are loaded through an inline import map in `index.html`;
Three.js 0.160.0 (plus `OrbitControls`, `CSS2DRenderer`, `RoomEnvironment`
addons) is vendored in `vendor/`; all textures are drawn procedurally in-code.
It runs fully offline.

## Running it

Because it uses ES-module imports, serve it over **`http://`**, not `file://`
(browsers block module loads from the filesystem):

```bash
# from the repo root — any static server works
python -m http.server 8000
# open http://localhost:8000/  (serves index.html automatically)
```

There is **no test suite, linter, or build/CI tooling** — verification is
visual. After a change, load the page in a browser and confirm the scene renders,
the relevant Show toggles work, and clicking your element opens its info card.

## Architecture & layering

Small ES modules in a strict dependency direction:

**foundation** (`src/config`, `src/core`, `src/lib`) → **`src/elements/*`** →
**`src/annotations`** → **`src/interaction`**, all wired by **`src/main.js`**.

`src/main.js` is the orchestrator: it imports every module, calls each element's
`build()` in a fixed order, then each interaction module's `init()`, sets the
opening view, and runs the render loop. Adding a module means importing and
calling it here.

```
src/
├── main.js            orchestrator: build() elements in order, init() interaction, render loop
├── config/            single source of truth for all numbers
│   ├── dimensions.js  raw centrelines (X, Z, OUT) + wall/column/height consts
│   ├── geometry.js    derived consts (roads, column grid, F1 envelope, façade bands)
│   └── rooms.js       the 7 ground-floor rooms — feeds BOTH zone tints and labels
├── core/              scene, camera, renderer, environment, lights, materials (M), groups (G), registries
├── lib/               builders (box/wall/beam/makeClickable), labels (label/addLabel/dim), format (ftin)
├── elements/<name>/   one folder per building element; each exports build()
├── annotations/       zone-labels.js, dimensions.js — each exports build()
└── interaction/       panel, selection, views, fly, eye-level, compass, state; each exports init()
```

The full file-by-file breakdown is in `README.md` — don't duplicate it, reference it.

## Coordinate & compass conventions (read before touching geometry)

The file's internal axes are **rotated relative to real site north**:

- `+X` = **west** → `X.e` (39.333) is the **west face** (where the 5′ cantilever
  sits); `X.w` (0) is the east side.
- `+Z` = **south** → `Z.n` is the back-showroom rear; `Z.shopS` is the street
  frontage. `Y` = up.
- **Real site north is the shop/street side** (`Z.shopS`). Only the on-screen
  **compass display** is remapped to true north. Code comments and info-card
  text still use raw axis names ("north wall" = `Z.n`, "west wall" = `X.e`) —
  treat those as internal labels, not real-world directions.

Anything at first-floor level goes into the `G.f1` group (or a new group stacked
at `y = F1_FFL`) so the ground floor stays independently toggleable.

## Conventions AI must follow

These are the non-obvious rules. Violating them silently breaks the scene.

- **Never hardcode a coordinate in an element file.** All numbers live in
  `config/dimensions.js` (raw) and `config/geometry.js` (derived). Change a value
  there and everything referencing it moves together.
- **Add meshes to a `G.*` group, never straight to the scene** (`core/groups.js`).
  The `box()`/`wall()`/`beam()` helpers take a group argument; the panel toggles
  visibility per group, so a mesh added to the scene directly can't be hidden.
- **Clickables must own their material — use `makeClickable()`** from
  `lib/builders.js`. Selection highlighting mutates the mesh's `opacity` (or
  `emissive`), so a shared material would repaint every sibling. `makeClickable()`
  clones the material and registers the mesh with the raycaster.
- **Don't mutate a shared material for a one-off effect** — `mat.clone()` first.
  The shared materials live in the `M` dictionary (`core/materials.js`).
- **Never set a label's `element.style.display` by hand.** `CSS2DRenderer`
  overwrites `display` from `object.visible` every frame. Use `addLabel()` /
  `dim()` (`lib/labels.js`) so tags register with the master **Labels** toggle;
  set `object.visible` if you must control a tag directly.
- **HTML checkbox `checked` attributes are the single source of truth for
  Show/Labels/Dims defaults.** `interaction/panel.js` reads them at startup — set
  a default by editing the markup in `index.html`, not in JS.
- **Selection only hits fully-visible meshes.** `selection.js` filters `clickable`
  through `isVisible` (checks the whole ancestor chain), so a mesh hidden by its
  group toggle won't be selected. Keep clickables inside their feature group.
- **Shared camera-mode flags live in the mutable `state` object**
  (`interaction/state.js`): `state.flying`, `state.headLook`. Read/write via
  `state.*` — an exported `let` would be read-only to importers.
- **Rooms are edited in one place.** `config/rooms.js` drives both the clickable
  floor tints (`elements/zones`) and the name tags (`annotations/zone-labels`).
  Order matters — it fixes build order.

## Common tasks

**Add a clickable element** — build a mesh into a group, set `userData`, register:

```js
import { box, makeClickable } from '../../lib/builders.js';
import { ftin } from '../../lib/format.js';
const m = box(w, SLAB, dp, x, y, z, M.roof, G.roof);
m.userData = {
  color: 0xc8552f, name: 'My element',
  dim: `${ftin(w)} × ${ftin(dp)}`, area: `${Math.round(w * dp)} sf`,
  details: ['line one', 'line two'],
  baseOpacity: 0.42,   // <1 highlights by going more solid; 1 glows via emissive
};
makeClickable(m);
```

**Add a label / dimension** — `addLabel(group, text, x, y, z, cls)` and
`dim(x1, z1, x2, z2, text)` from `lib/labels.js`.

**Add a view preset** — add `<button class="btn" id="v-name">Label</button>` to
the *View* group in `index.html`, then wire it in `interaction/views.js`:
`document.getElementById('v-name').onclick = () => setView([x,y,z], [tx,ty,tz], fov);`

**Add a room** — edit `config/rooms.js` only (bounds, colour, details, label).
Both the tint and the tag update from it.

**Add a whole new element** — create `src/elements/<name>/index.js` exporting
`build()`, then import it in `src/main.js` and call `<name>.build()` in the build
sequence (mind the order — later builds draw over earlier ones).

## Tech / updating Three.js

Three.js **0.160.0** is vendored in `vendor/` and wired through the inline import
map in `index.html` (`three` → `vendor/three.module.js`, `three/addons/` →
`vendor/addons/`). To bump the version, replace the four files in `vendor/` from
`https://cdn.jsdelivr.net/npm/three@<version>/` (`build/three.module.js` plus the
three `examples/jsm/…` addons) — no import changes needed.

## Git workflow

- Develop on the designated feature branch (currently
  `claude/claude-md-docs-jkdlsb`); create it from the latest `main` if needed.
- Commit with clear messages and push with `git push -u origin <branch>`.
- **Never push to `main`.** Open a PR only when explicitly asked.
