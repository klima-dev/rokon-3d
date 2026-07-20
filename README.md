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

```
rokon-3d/
├── rokon_gf_3d_v68.html   markup, import map, panel/compass/room UI
├── css/
│   └── styles.css         all styling
└── src/
    └── main.js            the whole Three.js scene (~1400 lines)
```

`src/main.js` is organized top-to-bottom as:

1. **Dimensions** — `X` / `Z` centreline coordinates (the single source of truth, from the PDF).
2. **Scene / renderer / lights** — shadows, ACES tone mapping, procedural `RoomEnvironment`.
3. **Textures & materials** — canvas-drawn brick/concrete/plaster; the `M` material dictionary.
4. **Geometry** — ground & slabs, zone tints, walls, columns + beams, shutters/gates, the
   switchback stair, cantilevers, then the full first-floor envelope and façade.
5. **Interaction** — panel toggles, raycast click → info card, camera view presets, free-fly
   and eye-level camera modes.
6. **Loop** — animates the camera, updates the SVG compass, renders the WebGL + CSS2D layers.

---

## Coordinate & compass conventions (read before editing)

The file's internal axes are **rotated relative to real site north** — worth knowing before
you touch geometry:

- `+X` = **west** (so `X.e` is the west face, where the 5′ cantilever sits); `X.w` = east.
- `+Z` = **south** (`Z.n` = back-showroom rear, `Z.shopS` = street frontage); `Y` = up.
- **Real site north is the shop/street side** (`Z.shopS`). Rather than rename hundreds of
  lines, only the on-screen **compass display** is remapped to the true site. So the compass
  reads correctly, but code comments and info-card text still use the raw axis names
  ("north wall" = `Z.n`, "west wall" = `X.e`). Treat those as internal labels, not directions.

Anything at first-floor level goes into the `G.f1` group (or a new group stacked at
`y = H + SLAB`) so the ground floor stays independently toggleable.

---

## Tech

- **Three.js 0.160.0** (ES module + addons: `OrbitControls`, `CSS2DRenderer`, `RoomEnvironment`),
  via jsDelivr and an inline import map.
- No bundler, no dependencies to install, no framework.

---

## Contributing / editing the scene

All geometry lives in `src/main.js`. A few conventions keep edits from breaking things:

### Groups (`G.*`)
Every mesh is added to a named group so the panel can toggle it: `walls`, `cols`, `stair`,
`shutter`, `labels`, `dims`, `grid`, `zones`, `base`, `roof`, `f1`, `road`. Add a mesh with
the `box(w, h, dp, x, y, z, mat, group)` helper (or `wall(x1,z1,x2,z2)`), passing the right
group — never `scene` directly, or your mesh can't be toggled. `y` is the **bottom** of the
box; `box` offsets by `h/2` internally.

### Materials (`M.*`)
Materials are shared across many meshes for performance. **Do not mutate a shared material
for a one-off effect** — you'll change every mesh using it. If a mesh needs its own look,
`mat.clone()` it first.

### Adding a clickable element
Selection highlighting mutates the mesh's material, so a clickable **must own its material**.
Use the `makeClickable(mesh)` helper — it clones the material and registers the mesh with the
raycaster. Set `mesh.userData` before registering:

```js
const m = box(w, SLAB, dp, x, H, z, M.roof, G.roof);
m.userData = {
  color: 0xc8552f,        // swatch shown in the info card
  name: 'My element',
  dim:  `${ftin(w)} × ${ftin(dp)}`,
  area: `${Math.round(w * dp)} sf`,
  details: ['line one', 'line two'],   // bulleted list in the card
  baseOpacity: 0.42,      // <1 highlights by going more solid; 1 glows via emissive
};
makeClickable(m);
```

`baseOpacity` matters: translucent elements (`< 1`) highlight by increasing opacity; opaque
ones (`= 1`) can't, so they highlight with an emissive glow instead (see `paintSelection`).

### Adding a label or dimension
Use `addLabel(group, text, x, y, z, cls)` (not raw `CSS2DObject`) so the tag is registered
and obeys the master **Labels** toggle. For dimension lines use `dim(x1,z1,x2,z2,text)`.
Never set a tag's `element.style.display` by hand — `CSS2DRenderer` overwrites it from
`object.visible` every frame; toggle `object.visible` instead.

### Adding a view preset
1. Add a `<button class="btn" id="v-name">Label</button>` in the *View* group in the HTML.
2. Wire it in `main.js`: `document.getElementById('v-name').onclick = () => setView([x,y,z], [tx,ty,tz], fov);`
   `setView` clears fly/eye-lock modes for you. `CX` / `CZ` are the building centre.

### Editing dimensions
`X` and `Z` (near the top of `main.js`) are the single source of truth. Change a centreline
there and the walls, columns, beams, tints and cantilevers that reference it all move
together — don't hardcode coordinates elsewhere. Remember the rotated axes (see
*Coordinate & compass conventions* above).

---

## License

No license specified. Add one if you intend to share or reuse.
