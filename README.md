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

## License

No license specified. Add one if you intend to share or reuse.
