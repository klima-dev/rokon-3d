import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

/* ==========================================================================
   DIMENSIONS  —  all values in decimal feet, taken from ROKON_GF-1.pdf
   --------------------------------------------------------------------------
   X increases to the WEST (width) · Z increases to the SOUTH (depth) · Y = up
   so X.w (0) is the EAST side of the building and X.e (39.333) is the WEST side —
   the 5' cantilever sits on X.e, i.e. the WEST face.
   X centrelines : 0 · 10 · 29.833 · 39.333
     0 -> 10        = 10'-0"   shop bay
     10 -> 29.833   = 19'-10"  central bay (front + back showroom)
     29.833 -> 39.333 = 9'-6"  stair bay  (plan says 9'-8"; 2" absorbed here
                                so the 40'-4" overall closes exactly)
   Z centrelines : 0 · 20.333 · 35.667 · 41.667 · 47.833
     0 -> 20.333    = 20'-4"   back showroom depth
     20.333 -> 35.667 = 15'-4" front showroom / stair run
     35.667 -> 41.667 = 6'-0"  verandha + bike park
     20.333 -> 47.833 = 27'-6" shop depth (east wall)
   Cantilevers (dashed on plan, upper floor only): 5' west · 4' south · 4' shop
   ========================================================================== */

const FT = 1;
const WT   = 0.833;      // 10" wall
const COL  = 1.0;        // 12" x 12" column
const H    = 10.5;       // ground floor height, floor to u/s of 1st slab
const H1   = 10.5;       // 1st floor height, floor to u/s of 2nd slab
const SLAB = 0.5;        // slab thickness
const CANTI_W = 5, CANTI_S = 4, CANTI_SHOP = 4;   // CANTI_W: west-side cantilever, at X.e
const STAIR_ENTRY = 4;   // depth of the flat gateway landing inside Gates A & B

const X = { w:0, shopE:10, stairW:29.833, e:39.333 };
const Z = { n:0, entry:20.333, shutter:35.667, verandha:41.667, shopS:47.833 };
Z.gateway = Z.shutter - STAIR_ENTRY;   // 31.667 — where the treads begin

const OUT = { x0:X.w-WT/2, x1:X.e+WT/2, z0:Z.n-WT/2, z1:Z.shopS+WT/2 };
const CX = (OUT.x0+OUT.x1)/2, CZ = (OUT.z0+OUT.z1)/2;

/* ---------- scene ---------- */
const app = document.getElementById('app');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xeceae4);
// Fog pushed way back (was 90->300): the north road alone is ~144' long, so a
// close fog wall greyed things out the moment you zoomed to frame it. Now it
// only softens the very far ground plane, never the building.
scene.fog = new THREE.Fog(0xeceae4, 600, 1400);

const camera = new THREE.PerspectiveCamera(45, innerWidth/innerHeight, 1.0, 1600);
const renderer = new THREE.WebGLRenderer({ antialias:true, logarithmicDepthBuffer:true,
  powerPreference:'high-performance', precision:'highp' });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
// warmer, higher-contrast output than the flat default
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
app.appendChild(renderer.domElement);

// Environment map: gives the glass something to reflect and refract, so it
// reads as real glass (mirror-like sheen + soft see-through) instead of flat
// tinted plastic. RoomEnvironment is procedural — no external file needed.
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
pmrem.dispose();   // env map is baked; free the generator's render target

const labelRenderer = new CSS2DRenderer();
labelRenderer.setSize(innerWidth, innerHeight);
labelRenderer.domElement.style.cssText = 'position:fixed;inset:0;pointer-events:none';
app.appendChild(labelRenderer.domElement);

const orbit = new OrbitControls(camera, renderer.domElement);
orbit.enableDamping = true;
orbit.dampingFactor = 0.07;
orbit.maxPolarAngle = Math.PI/2 - 0.02;
// Stop infinite zoom-out: past ~500' the model is a speck and it's easy to get
// lost. minDistance keeps you from clipping through the geometry up close.
orbit.minDistance = 6;
orbit.maxDistance = 500;
orbit.target.set(CX, 4, CZ);

// Free-fly: hand-rolled so it never depends on the Pointer Lock API,
// which sandboxed iframes block. Drag to look, keys to move.
const flyEuler = new THREE.Euler(0, 0, 0, 'YXZ');
let flying = false, dragging = false;

/* ---------- light ---------- */
scene.add(new THREE.HemisphereLight(0xffffff, 0x9a978d, 1.5));
const sun = new THREE.DirectionalLight(0xfff4e2, 1.7);
sun.position.set(-40, 70, -34);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
const d = 60;
Object.assign(sun.shadow.camera, { left:-d, right:d, top:d, bottom:-d, near:1, far:220 });
sun.shadow.bias = -0.0006;
scene.add(sun);

/* ---------- procedural textures (canvas-drawn, no external files) ---------- */
// Real photo textures would need external downloads; these are drawn in-code so
// they always work offline. Each returns a repeating THREE.CanvasTexture.
function makeCanvas(w, h, draw) {
  const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
  draw(cv.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(cv);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}
// brick: staggered courses with mortar lines + per-brick colour jitter
function brickTexture(base, mortar) {
  return makeCanvas(512, 512, (g, w, h) => {
    g.fillStyle = mortar; g.fillRect(0, 0, w, h);
    const rows = 8, bh = h / rows, bw = w / 4;
    for (let r = 0; r < rows; r++) {
      const off = (r % 2) * bw / 2;
      for (let c = -1; c < 5; c++) {
        const x = c * bw + off + 2, y = r * bh + 2;
        const j = 1 + (Math.random() - 0.5) * 0.14;
        const col = new THREE.Color(base).multiplyScalar(j);
        g.fillStyle = '#' + col.getHexString();
        g.fillRect(x, y, bw - 4, bh - 4);
      }
    }
  });
}
// fine speckle for concrete / plaster
function speckleTexture(base, amount) {
  return makeCanvas(256, 256, (g, w, h) => {
    const c = new THREE.Color(base);
    g.fillStyle = '#' + c.getHexString(); g.fillRect(0, 0, w, h);
    for (let i = 0; i < w*h*amount; i++) {
      const x = Math.random()*w, y = Math.random()*h;
      const j = 1 + (Math.random() - 0.5) * 0.25;
      g.fillStyle = 'rgba(' + [0,0,0].join(',') + ',' + (Math.random()*0.06) + ')';
      g.fillRect(x, y, 1.5, 1.5);
    }
  });
}
const TEX = {
  brickR : brickTexture(0xe9e7e0, '#dedcd4'),   // warm white brick, subtle mortar
  brickD : brickTexture(0x33404a, '#2b363f'),   // dark slate accent brick
  concrete: speckleTexture(0xcfcabf, 0.5),
  plasterN: speckleTexture(0xf4f2ec, 0.35),
};
TEX.brickR.repeat.set(4, 3);
TEX.brickD.repeat.set(2, 3);
TEX.concrete.repeat.set(3, 3);

/* ---------- materials ---------- */
const M = {
  wall   : new THREE.MeshStandardMaterial({ color:0xf4f2ec, roughness:0.9, map:TEX.plasterN }),
  col    : new THREE.MeshStandardMaterial({ color:0x1f4e8c, roughness:0.6 }),
  beam   : new THREE.MeshStandardMaterial({ color:0x2a5ea0, roughness:0.7 }),
  slab   : new THREE.MeshStandardMaterial({ color:0xdedbd2, roughness:0.96 }),
  stair  : new THREE.MeshStandardMaterial({ color:0xd9a03c, roughness:0.85 }),
  shutter: new THREE.MeshStandardMaterial({ color:0x2f6a8f, roughness:0.5, metalness:0.35 }),
  gate   : new THREE.MeshStandardMaterial({ color:0x2f6a8f, roughness:0.4, metalness:0.5,
             transparent:true, opacity:0.62 }),
  // ROOF = the whole 1st floor plate: main slab + every cantilever
  // projection, one material so it reads as a single pour. Coral, clearly
  // distinct from the grey ground slab and from every zone tint, and
  // translucent so the ground floor stays readable underneath.
  roof   : new THREE.MeshStandardMaterial({ color:0xc8552f, roughness:0.9,
             transparent:true, opacity:0.42, side:THREE.DoubleSide }),
  // 1st floor envelope
  acp    : new THREE.MeshStandardMaterial({ color:0x1f4e8c, roughness:0.3, metalness:0.55 }),
  glass  : new THREE.MeshPhysicalMaterial({ color:0xbfe0ec, roughness:0.06, metalness:0,
             transmission:0.82, thickness:0.4, ior:1.5, reflectivity:0.55,
             clearcoat:1.0, clearcoatRoughness:0.06,
             transparent:true, opacity:0.62, side:THREE.DoubleSide,
             envMapIntensity:1.2,
             polygonOffset:true, polygonOffsetFactor:-2, polygonOffsetUnits:-2 }),
  brick  : new THREE.MeshStandardMaterial({ color:0xf0ede6, roughness:0.92 }),
  // north-facade brick-frame scheme
  brickR : new THREE.MeshStandardMaterial({ color:0xffffff, roughness:0.9, map:TEX.brickR }),    // light blue front wall
  brickD : new THREE.MeshStandardMaterial({ color:0xffffff, roughness:0.92, map:TEX.brickD }),   // white accents (jali, pilaster, soldier)
  cbeam  : new THREE.MeshStandardMaterial({ color:0xffffff, roughness:0.85, map:TEX.concrete }),   // 4x5in concrete mullion beams
  mull   : new THREE.MeshStandardMaterial({ color:0xf4f2ec, roughness:0.3, metalness:0.4 }),
  fin    : new THREE.MeshStandardMaterial({ color:0x1f4e8c, roughness:0.32, metalness:0.5 }),
  sign   : new THREE.MeshStandardMaterial({ color:0xf4f1ea, roughness:0.5 }),
  disp   : new THREE.MeshStandardMaterial({ color:0x2a2d33, roughness:0.6 }),      // display platform
  prod   : new THREE.MeshStandardMaterial({ color:0x143d7a, roughness:0.5, metalness:0.2 }), // product blocks
  relief : new THREE.MeshStandardMaterial({ color:0xd6dde3, roughness:0.95 }),
  road   : new THREE.MeshStandardMaterial({ color:0x4a4844, roughness:0.95 }),
  roadln : new THREE.MeshStandardMaterial({ color:0xd8d2b8, roughness:0.9 }),
};
const zoneMat = c => new THREE.MeshStandardMaterial({ color:c, roughness:1, transparent:true, opacity:0.5 });

/* ---------- groups ---------- */
const G = {};
['walls','cols','stair','shutter','labels','dims','grid','zones','base','roof','f1','road']
  .forEach(k => { G[k] = new THREE.Group(); scene.add(G[k]); });

/* ---------- helpers ---------- */
const box = (w,h,dp,x,y,z,mat,g) => {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w,h,dp), mat);
  m.position.set(x, y+h/2, z);
  m.castShadow = m.receiveShadow = true;
  (g||scene).add(m);
  return m;
};
// wall along a centreline from (x1,z1) to (x2,z2)
const wall = (x1,z1,x2,z2,h=H,t=WT) => {
  const len = Math.hypot(x2-x1, z2-z1);
  const horiz = Math.abs(x2-x1) > Math.abs(z2-z1);
  return box(horiz?len:t, h, horiz?t:len, (x1+x2)/2, 0, (z1+z2)/2, M.wall, G.walls);
};
const ftin = v => {
  const whole = Math.floor(v + 1e-6);
  let inch = Math.round((v - whole) * 12);
  let w = whole;
  if (inch === 12) { inch = 0; w += 1; }
  return `${w}'-${inch}"`;
};
const label = (text, x,y,z, cls='tag') => {
  const el = document.createElement('div');
  el.className = cls; el.textContent = text;
  const o = new CSS2DObject(el);
  o.position.set(x,y,z);
  return o;
};
// Every text tag in the scene is registered here regardless of which mesh
// group it visually belongs to (walls, cantilevers, dims, shutters...). This
// lets the master "Labels" toggle hide ALL of them in one place, while each
// tag still respects its own feature's visibility when Labels is on — see
// refreshLabelVisibility() near the toggle wiring below.
const labelRegistry = [];
const addLabel = (group, text, x, y, z, cls) => {
  const o = label(text, x, y, z, cls);
  group.add(o);
  labelRegistry.push({ obj: o, group });
  return o;
};

/* ---------- click targets ----------
   Declared up here because the roof block below registers itself before the
   zone tints are built. Anything pushed in becomes selectable by the
   raycaster and needs userData: {color, name, dim, area, details, baseOpacity}. */
const clickable = [];
// Selection highlighting mutates the mesh's material (opacity or emissive), so
// every clickable must OWN its material — otherwise clicking one roof/cantilever/
// glass panel repaints every sibling sharing that material. Clone on registration
// so no call site can forget. (Re-cloning an already-unique material is harmless.)
const makeClickable = m => { m.material = m.material.clone(); clickable.push(m); };

/* ---------- ground + slab ---------- */
const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(1200,1200),
  new THREE.MeshStandardMaterial({ color:0xdcd9d0, roughness:1 }));
ground.rotation.x = -Math.PI/2;
ground.position.set(CX, -SLAB-0.08, CZ);
ground.receiveShadow = true;
G.base.add(ground);

/* ---------- NORTH ROAD (v36) ----------
   A 10'-0" wide, 30 m (98'-5") long strip on the site's NORTH side, running
   EAST->WEST (from the shop side, x = building's east edge, heading west past
   the far corner). It sits 2'-0" clear NORTH of the shop cantilever's north
   edge, so there's a gap between the building's overhang and the carriageway.
   Purely context — shows how the frontage meets the lane. */
const M2FT = 3.28084;
const ROAD_W = 10, ROAD_L = 30 * M2FT, ROAD_GAP = 2;
const roadZs = (Z.shopS + CANTI_SHOP) + ROAD_GAP;   // south edge of the road
const roadZc = roadZs + ROAD_W/2;
// Starts at the corner fin (the NW corner, west end) and runs WEST, away
// from the building — so the fin sits at the road's near end and the lane
// leads off past the far corner.
// F1.xW isn't declared yet (it's built in the 1st floor section below), but
// its value is just the west cantilever edge, which we can compute here.
// The road spans from the building's EAST end (shop side) all the way to
// 30 m WEST of the corner fin — one continuous lane. So its length isn't the
// bare 30 m; that 30 m is measured from the fin outward, and the frontage in
// front of the building is added on the east side.
const F1_XW = X.e + CANTI_W;                          // west cantilever edge (= F1.xW)
const FIN_X = F1_XW + 1.2/2 - 0.1;                    // corner fin centre (NW corner)
const roadXs = OUT.x0;                                // EAST start (shop side)
const roadXe = FIN_X + ROAD_L;                        // WEST end = 30 m past the fin
const ROAD_SPAN = roadXe - roadXs;                    // full lane length
const roadXc = (roadXs + roadXe) / 2;
const roadDeck = box(ROAD_SPAN, 0.12, ROAD_W, roadXc, -SLAB + 0.02, roadZc, M.road, G.road);
roadDeck.receiveShadow = true;
roadDeck.userData = {
  color: 0x4a4844, name: 'North road (10\u2032 lane)',
  dim: `${ftin(ROAD_SPAN)} \u00d7 ${ftin(ROAD_W)}`,
  area: `${Math.round(ROAD_SPAN*ROAD_W)} sf`,
  details: ['10\u2032-0\u2033 wide service lane on the north frontage',
            '30 m (98\u2032-5\u2033) long, running east to west',
            'Sits 2\u2032-0\u2033 clear of the shop cantilever edge'],
  baseOpacity: 1,
};
makeClickable(roadDeck);
// dashed centre line
const DASH = 4, GAPd = 3;
for (let x = roadXs + 2; x < roadXe - 2; x += DASH + GAPd) {
  const len = Math.min(DASH, roadXe - 2 - x);
  box(len, 0.02, 0.5, x + len/2, -SLAB + 0.16, roadZc, M.roadln, G.road);
}

/* ---------- MAIN ROAD (N-S, v41) ----------
   A 30'-0" wide, 300'-0" long main road running NORTH-SOUTH, meeting the 10'
   north lane in a T-junction: the small lane ends at this road's inner (east)
   edge and does not cross it. Approximate / not permanent — width may change
   later; 30' for now. Centred north-south on the small lane so the T sits
   mid-length. */
const MAIN_W = 30, MAIN_L = 300;
const mainXi = roadXe;                 // inner (east) edge = where the lane ends
const mainXc = mainXi + MAIN_W/2;      // runs further west (+X)
const mainZc = roadZc;                 // T centred on the small lane
const mainDeck = box(MAIN_W, 0.12, MAIN_L, mainXc, -SLAB + 0.02, mainZc, M.road, G.road);
mainDeck.receiveShadow = true;
mainDeck.userData = {
  color: 0x4a4844, name: 'Main road (N-S, 30\u2032)',
  dim: `${ftin(MAIN_L)} \u00d7 ${ftin(MAIN_W)}`,
  area: `${Math.round(MAIN_L*MAIN_W)} sf`,
  details: ['30\u2032-0\u2033 wide main road, running north to south',
            '300\u2032-0\u2033 long (approximate \u2014 width may change later)',
            'Meets the 10\u2032 north lane in a T-junction at its inner edge'],
  baseOpacity: 1,
};
makeClickable(mainDeck);
// dashed centre line, running N-S
for (let z = mainZc - MAIN_L/2 + 2; z < mainZc + MAIN_L/2 - 2; z += DASH + GAPd) {
  const len = Math.min(DASH, mainZc + MAIN_L/2 - 2 - z);
  box(0.5, 0.02, len, mainXc, -SLAB + 0.16, z + len/2, M.roadln, G.road);
}

const grid = new THREE.GridHelper(1200, 1200, 0xb9b6ad, 0xd2cfc6);
grid.position.set(CX, -SLAB-0.04, CZ);
G.grid.add(grid);

// ground slab: main block + shop tail
box(OUT.x1-OUT.x0, SLAB, Z.verandha-OUT.z0, CX, -SLAB, (OUT.z0+Z.verandha)/2, M.slab, G.base);
box(10+WT, SLAB, Z.shopS-Z.verandha+WT/2, (OUT.x0+10.5)/2, -SLAB,
    (Z.verandha+Z.shopS+WT/2)/2, M.slab, G.base);

// ROOF — the ground floor's ceiling = the 1st floor slab. Same footprint as
// the ground slab, lifted to H. The cantilever projections are added into
// this SAME group further down, so one toggle shows/hides the entire 1st
// floor plate as a single thing.
//
// FUTURE: 1st floor development builds up from here — this plate is its
// floor. Anything at 1st floor level should go into G.roof (or a new group
// stacked on it at y = H + SLAB) so the ground floor stays independently
// toggleable.
// Edges are trimmed back to the wall CENTRELINE (X.e / Z.shopS) wherever a
// cantilever carries on from there, so the two never overlap. Coplanar
// translucent slabs would otherwise double up into a dark seam and z-fight.
// The cantilever covers the outer half of the wall, the roof the inner half.
const roofMain = box(X.e-OUT.x0, SLAB, Z.verandha-OUT.z0, (OUT.x0+X.e)/2, H,
                     (OUT.z0+Z.verandha)/2, M.roof, G.roof);
const roofShop = box(10+WT, SLAB, Z.shopS-Z.verandha, (OUT.x0+10.5)/2, H,
                     (Z.verandha+Z.shopS)/2, M.roof, G.roof);
[roofMain, roofShop].forEach(m => { m.castShadow = false; });
roofMain.userData = {
  color: 0xc8552f, name: 'Roof / 1st floor slab',
  dim: `${ftin(X.e-OUT.x0)} \u00d7 ${ftin(Z.verandha-OUT.z0)}`,
  area: `${Math.round((X.e-OUT.x0)*(Z.verandha-OUT.z0))} sf`,
  details: [
    'Ceiling of the ground floor, floor of the 1st',
    'Cantilever projections are part of this same plate',
    'Sits at 10\'-6" above the ground floor slab',
  ],
  baseOpacity: 0.42,
};
makeClickable(roofMain);

/* ---------- zone floor tints (clickable) ---------- */
const tint = (c, x1,z1,x2,z2, info) => {
  const w = x2-x1, dp = z2-z1;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, dp), zoneMat(c));
  m.rotation.x = -Math.PI/2;
  m.position.set((x1+x2)/2, 0.03, (z1+z2)/2);
  m.userData = {
    color: c,
    name: info.name,
    dim: `${ftin(w)} \u00d7 ${ftin(dp)}`,
    area: `${Math.round(w*dp)} sf`,
    details: info.details,
    baseOpacity: 0.5,
  };
  G.zones.add(m);
  makeClickable(m);
  return m;
};
tint(0x8b7fd4, X.w, Z.n, X.e, Z.entry, {
  name: 'Back showroom',
  details: [
    'Full 40\'-4" street frontage on the north wall',
    'Opens south into the front showroom only — the shop is walled off',
    'Largest display floor in the building',
  ],
});
tint(0x3fae8c, X.w, Z.entry, X.shopE, Z.shopS, {
  name: 'Shop',
  details: [
    'East bay, runs the full 27\'-6" depth of the building',
    'Own 4\'-0" cantilever projecting south past the main footprint',
    'Closed room — solid wall to the back showroom',
    'Entered through its own 7\'-7" shutter on the south front',
  ],
});
tint(0x8b7fd4, X.shopE, Z.entry, X.stairW, Z.shutter, {
  name: 'Front showroom',
  details: [
    'Central bay, between the shop and the stair',
    'South wall carries the showroom shutter at the entrance',
    'Beam over at the entry line and again at the shutter line',
  ],
});
tint(0xd9a03c, X.stairW, Z.entry, X.e, Z.gateway, {
  name: 'Stair bay',
  details: [
    'Single switchback: up the east side, half landing, back down the west',
    'Reached from the gateway at its south edge, not directly off the street',
    'Wraps an open 2\'-6" x 7\'-4" void — no guard rail modelled yet',
    '16 treads @ 11", 17 risers @ 7.41", arrives at 1st floor over the gateway',
  ],
});
tint(0x3f7fbf, X.stairW, Z.gateway, X.e, Z.shutter, {
  name: 'Gateway',
  details: [
    'Shared entry lobby — flat, at floor level, no treads',
    'Gate A (west, outer wall) is the street gate in',
    'Gate B (east) opens through into the front showroom',
    'Stair rises from its north edge; the 1st floor arrives back overhead',
  ],
});
tint(0x9a978d, X.shopE, Z.shutter, X.stairW, Z.verandha, {
  name: 'Verandha',
  details: [
    'Covered strip in front of the showroom shutter',
    '5\'-0" and 4\'-0" cantilevers project overhead from the first floor',
  ],
});
tint(0x9a978d, X.stairW, Z.shutter, X.e, Z.verandha, {
  name: 'Bike park',
  details: [
    'West of the verandha, alongside the stair gates',
    'Low 3\'-0" kerb divides it from the verandha',
  ],
});

/* ---------- walls ---------- */
// north (back showroom rear) — solid, full 40'-4"
wall(X.w, Z.n, X.e, Z.n);
// west wall, north stretch, with backup shutter opening z 14 -> 20.333
wall(X.e, Z.n, X.e, 14);
// west wall alongside the stair bay — stops at the gateway, where Gate A opens
wall(X.e, Z.entry, X.e, Z.gateway);
// east wall: back showroom + shop, full run
wall(X.w, Z.n, X.w, Z.shopS);
// shop west wall
wall(X.shopE, Z.entry, X.shopE, Z.shopS);
// shop north wall — SOLID divider between the shop and the back showroom.
// The 'back showroom entry' opening is only the central bay (x 10 -> 29.833);
// the shop is a closed room off its own south entrance, so this 10' stretch
// is a full wall, not part of that opening.
wall(X.w, Z.entry, X.shopE, Z.entry);
// shop south wall — piers either side of the shop's own street shutter
wall(X.w, Z.shopS, X.w+1.2, Z.shopS);
wall(X.shopE-1.2, Z.shopS, X.shopE, Z.shopS);
// stair bay east wall — stops at the gateway, where Gate B opens through into
// the front showroom. This is the link that makes the gateway a shared lobby:
// street -> gate -> gateway -> front showroom AND stair.
wall(X.stairW, Z.entry, X.stairW, Z.gateway);
// no spine wall here — this bay stays open between the two flights,
// forming the central void the stair wraps around (see stair block below)
// verandha / bike park divider
wall(X.stairW, Z.shutter, X.stairW, Z.verandha, H*0.0 + 3.0, 0.5); // low kerb
// front showroom south wall piers either side of the shutter
wall(X.shopE, Z.shutter, X.shopE+1.2, Z.shutter);
wall(X.stairW-1.2, Z.shutter, X.stairW, Z.shutter);

/* ---------- columns ----------
   Both rows now sit on ONE grid: 0 / 13.111 / X.stairW / X.e. The right axis
   is the staircase line — the stair bay's east wall runs straight up through
   the back showroom to the north wall, so that column is dead in line with it.
   The shop's east wall still lands at x=10; it meets the entry line as a wall
   junction rather than at a column. */
const MID_L = 13.111;
const COL_X = [X.w, MID_L, X.stairW, X.e];
const colGrid = [
  ...COL_X.map(x => [x, Z.n]),       // north wall
  ...COL_X.map(x => [x, Z.entry]),   // entry line — same four axes
  [X.shopE,Z.shutter],[X.stairW,Z.shutter],[X.e,Z.shutter],
  // west wall (x=0), on the showroom shutter line — fills the 27'-6" gap
  // between the entry line and the shop's front corner, which had nothing
  // between them.
  [X.w,Z.shutter],
  [X.stairW,Z.verandha],[X.e,Z.verandha],
  [X.w,Z.shopS],[X.shopE,Z.shopS],
];
colGrid.forEach(([x,z]) => box(COL, H, COL, x, 0, z, M.col, G.cols));

/* ---------- beams (u/s of first floor slab) ---------- */
const beam = (x1,z1,x2,z2) => {
  const len = Math.hypot(x2-x1, z2-z1), horiz = Math.abs(x2-x1) > Math.abs(z2-z1);
  box(horiz?len:0.83, 1.4, horiz?0.83:len, (x1+x2)/2, H-1.4, (z1+z2)/2, M.beam, G.cols);
};
beam(X.w,Z.n,X.e,Z.n);
beam(X.w,Z.entry,X.e,Z.entry);          // back showroom entry beam
beam(X.shopE,Z.shutter,X.e,Z.shutter);  // shutter / gate line beam
beam(X.shopE,Z.verandha,X.e,Z.verandha);
beam(X.w,Z.shopS,X.shopE,Z.shopS);
beam(X.w,Z.n,X.w,Z.shopS);
beam(X.e,Z.n,X.e,Z.verandha);
beam(X.shopE,Z.entry,X.shopE,Z.shopS);
beam(X.stairW,Z.entry,X.stairW,Z.verandha);
// both intermediate axes carried through the back showroom, north wall ->
// entry line. The X.stairW one is the staircase line running dead straight
// from the stair bay wall all the way to the north wall.
beam(MID_L, Z.n, MID_L, Z.entry);
beam(X.stairW, Z.n, X.stairW, Z.entry);

/* ---------- shutters & gates ---------- */
// shop front shutter: the shop's own street entrance on its south face,
// z = 47.833, 7'-7" clear between the piers. This is how the shop is entered —
// it has no opening to the back showroom.
box(7.6, 9.5, 0.25, (X.w + X.shopE)/2, 0, Z.shopS, M.shutter, G.shutter);
addLabel(G.labels, 'Shop shutter', (X.w + X.shopE)/2, 10.6, Z.shopS);
// showroom shutter for entrance: z = 35.667, x 11.2 -> 28.633
box(17.4, 9.5, 0.25, (11.2+28.633)/2, 0, Z.shutter, M.shutter, G.shutter);
addLabel(G.labels, 'Showroom shutter', 20, 10.6, Z.shutter);
// backup shutter: west wall, z 14 -> 20.333
box(0.25, 9.5, 6.33, X.e, 0, 17.17, M.shutter, G.shutter);
addLabel(G.labels, 'Backup shutter', X.e+0.6, 10.6, 17.17);
// Gates A & B sit in the SIDE walls of the gateway, not across its south face.
// Gate B (east, in the X.stairW wall) is the way through into the front
// showroom; Gate A (west, in the X.e wall) is the outer street gate. Both are
// 3'-6" leaves centred in the 4'-0" deep gateway.
const zGate = (Z.gateway + Z.shutter)/2;
box(0.2, 8.5, 3.5, X.stairW, 0, zGate, M.gate, G.shutter);   // Gate B — into front showroom
box(0.2, 8.5, 3.5, X.e,      0, zGate, M.gate, G.shutter);   // Gate A — outer street gate
addLabel(G.labels, 'Gate B', X.stairW - 0.6, 9.4, zGate);
addLabel(G.labels, 'Gate A', X.e + 0.6, 9.4, zGate);

/* ---------- stair: single switchback wrapping a central void ----------
   Per the hand sketch: ONE continuous stair, not two parallel flights.

     gateway --> up the EAST side (north-bound)
              --> half landing across the whole NORTH end
              --> up the WEST side (south-bound)
              --> arrives at 1st floor above the gateway, exits south

   Geometry (bay 9'-6" wide x 11'-4" deep, north of the gateway):
     flight width  3'-6" each side
     central void  2'-6" wide x 7'-4" deep, open from floor to landing
     each flight   8 treads @ 11" = 7'-4" run
     half landing  9'-6" x 4'-0", at 4'-11" above floor
     17 risers @ 7.41"  ->  exactly 10'-6"     2R+T = 25.8

   The switchback buys back all the run the 4' gateway cost, so the riser
   returns to a comfortable 7.41" (it was 9.7" when both flights ran straight
   and parallel). The void stays open and unguarded along the flights' inner
   edges — a real build wants a guard rail there, not modelled yet. */
const TREAD    = 11/12;
const FLIGHT_W = 3.5;                     // width of each side flight
const PER      = 8;                       // treads per flight
const RISER    = H / (PER*2 + 1);         // 17 risers -> lands exactly on the 1st floor
const zLandS   = Z.gateway - PER*TREAD;   // 24.333 — landing's south edge

// Flight 1 — EAST side, climbing north out of the gateway
const xF1 = X.stairW + FLIGHT_W/2;
for (let i = 0; i < PER; i++) {
  box(FLIGHT_W, RISER, TREAD, xF1, i*RISER, Z.gateway - TREAD/2 - i*TREAD, M.stair, G.stair);
}
// Half landing — full bay width across the north end, turns you 180 degrees
box(X.e - X.stairW, RISER, zLandS - Z.entry, (X.stairW + X.e)/2,
    PER*RISER, (Z.entry + zLandS)/2, M.stair, G.stair);

// Flight 2 — WEST side, climbing back south to the 1st floor
const xF2 = X.e - FLIGHT_W/2;
for (let i = 0; i < PER; i++) {
  box(FLIGHT_W, RISER, TREAD, xF2, (PER + 1 + i)*RISER,
      zLandS + TREAD/2 + i*TREAD, M.stair, G.stair);
}

/* ---------- cantilever slabs (first floor projection, clickable) ---------- */
const canti = (w,dp,x,z,text,info) => {
  const m = box(w, SLAB, dp, x, H, z, M.roof, G.roof);
  m.castShadow = false;
  if (text) addLabel(G.roof, text, x, H+1.2, z, 'tag dim');
  if (info) {
    m.userData = {
      color: 0xc8552f,
      name: info.name,
      dim: `${ftin(w)} \u00d7 ${ftin(dp)}`,
      area: `${Math.round(w*dp)} sf`,
      details: info.details,
      baseOpacity: 0.42,
    };
    makeClickable(m);
  }
  return m;
};
canti(CANTI_W, Z.verandha-Z.n, X.e+CANTI_W/2, (Z.n+Z.verandha)/2, "5'-0\" cantilever", {
  name: 'West cantilever',
  details: [
    'First floor projection over the back showroom and stair frontage',
    'Projects 5\'-0" past the west wall face',
  ],
});
canti(CANTI_W, CANTI_S, X.e+CANTI_W/2, Z.verandha+CANTI_S/2, '', {
  name: 'SW corner infill',
  details: [
    'Joins the west cantilever to the south cantilever at the corner',
    'Sits directly above the bike park',
  ],
});
canti(X.e-X.shopE+WT, CANTI_S, (X.shopE+X.e)/2, Z.verandha+CANTI_S/2, "4'-0\" cantilever", {
  name: 'South cantilever',
  details: [
    'Runs the width of the front showroom, stair and bike park below',
    'Projects 4\'-0" past the south wall face',
  ],
});
canti(10+WT, CANTI_SHOP, (OUT.x0+10.5)/2, Z.shopS+CANTI_SHOP/2, "4'-0\" cantilever", {
  name: 'Shop south cantilever',
  details: [
    'First floor projection over the shop\'s own south wall',
    'Shop tail extends 6\'-2" further south than the main block',
  ],
});
// west face of the shop tail: fills the notch between the main south cantilever
// (south edge at Z.verandha+CANTI_S) and the shop south cantilever (south edge
// at Z.shopS+CANTI_SHOP). 4' out from the shop west wall face, 6'-2" deep.
canti(CANTI_SHOP, Z.shopS-Z.verandha,
      X.shopE + WT/2 + CANTI_SHOP/2,
      (Z.verandha + CANTI_S + Z.shopS + CANTI_SHOP)/2, '', {
  name: 'Shop west cantilever',
  details: [
    'Closes the corner between the south and shop south cantilevers',
    'Wraps the shop tail\'s west face',
  ],
});

/* ========================= 1ST FLOOR =========================
   Columns + envelope + roof. NO PARTITIONS — one open plan.

   DIRECTIONS: the site's compass is flipped vs this file's internal axis
   names. Below, the SITE direction is what's named; the axis is in brackets.
     site NORTH = +Z (my Z.shopS side, the street frontage)
     site SOUTH = -Z (my Z.n side, back showroom rear)
     site WEST  = +X (my X.e side, stair + 5' cantilever)
     site EAST  = -X (my X.w side, shop's outer wall)

   WALLS SIT ON THE CANTILEVER EDGE, not the column line — so the 1st floor
   envelope is bigger than the ground floor's and oversails it all round.

   The site-NORTH edge is STEPPED (L-shaped): the shop wing projects 6'-2"
   further north than the main block, so that face turns the corner rather
   than running straight.

   ENVELOPE:
     site NORTH (all 3 runs) : ACP + glass
     site WEST, south end -> end of stair bay : BRICK
     site WEST, remainder                     : glass
     site EAST + site SOUTH                   : glass
   ============================================================ */
const F1_FFL = H + SLAB;          // 11'-0" — 1st floor finished floor
const F1_WT  = 0.5;               // envelope thickness
const ACP_SILL = 2.5, ACP_HEAD = 1.5;   // ACP bands below/above the glazing

const F1 = {
  xE: OUT.x0,                          // site EAST  edge
  xW: X.e + CANTI_W,                   // site WEST  edge
  zS: OUT.z0,                          // site SOUTH edge
  zNmain: Z.verandha + CANTI_S,        // site NORTH, main block
  zNshop: Z.shopS + CANTI_SHOP,        // site NORTH, shop wing (6'-2" further out)
  xStep:  X.shopE + WT/2 + CANTI_SHOP, // the jog between the two north lines
  zBrick: Z.shutter,                   // brick stops where the stair bay ends
};

// --- columns: same grid as the ground floor, because columns must stack ---
colGrid.forEach(([x, z]) => box(COL, H1, COL, x, F1_FFL, z, M.col, G.f1));

// --- envelope helpers ---
function f1Seg(x1, z1, x2, z2, y, h, mat, info) {
  const len = Math.hypot(x2-x1, z2-z1);
  const horiz = Math.abs(x2-x1) > Math.abs(z2-z1);
  // clickable segments get their OWN material instance, or highlighting one
  // would repaint every other segment sharing it
  const m = box(horiz?len:F1_WT, h, horiz?F1_WT:len,
                (x1+x2)/2, y, (z1+z2)/2, info ? mat.clone() : mat, G.f1);
  if (info) {
    m.userData = {
      color: info.color, name: info.name,
      dim: `${ftin(len)} \u00d7 ${ftin(H1)}`,
      area: `${Math.round(len*H1)} sf`,
      details: info.details,
      baseOpacity: info.baseOpacity,
    };
    makeClickable(m);
  }
  return m;
}
// keep acpGlass for any other face that wants it
function acpGlass(x1, z1, x2, z2, info) {
  f1Seg(x1, z1, x2, z2, F1_FFL, ACP_SILL, M.acp);
  f1Seg(x1, z1, x2, z2, F1_FFL + ACP_SILL, H1 - ACP_SILL - ACP_HEAD, M.glass, info);
  f1Seg(x1, z1, x2, z2, F1_FFL + H1 - ACP_HEAD, ACP_HEAD, M.acp);
}
const GLASS_INFO = d => ({ color: 0x9ec6d4, baseOpacity: 0.30, ...d });

// ============ NORTH FACADE — DESIGNED BRICK + GLASS (v52) ============
// A proper composition, not just a hole in a wall. Ingredients, all cheap
// because they are laying patterns and standard sections, not new materials:
//   - exposed red-brick field, floor to roof
//   - the ribbon window sits in a RECESSED reveal, with a projecting brick
//     SOLDIER course as a header band above and a sill band below (shadow lines)
//   - slim WHITE lintel + sill trim frames the glass for crisp contrast
//   - a vertical JALI (perforated-brick) strip at the corner as a screen
//   - projecting brick PILASTERS split the long ribbon into bays, giving
//     rhythm and hiding the window mullions
const FR = 1.4;
const HEAD = F1_FFL + H1 - FR - 0.6;         // window head
const SILL = F1_FFL + 2.2;                   // window sill (raised, gives a base)
const GH   = HEAD - SILL;                    // glass height
const WHITE_T = 0.35;                        // white lintel/sill trim thickness
const REVEAL = 0.35;                         // how deep the glass sits back

// designed brick face with a framed, recessed ribbon window
function brickFace(x1, z1, x2, z2, glassInfo, inset, bays) {
  const len = Math.hypot(x2-x1, z2-z1);
  const ux = (x2-x1)/len, uz = (z2-z1)/len;   // unit vector along the face
  const nx = uz, nz = -ux;                    // outward normal (approx)
  // 1. brick field, full height
  f1Seg(x1, z1, x2, z2, F1_FFL, H1, M.brickR, {
    color:0xbcd2e0, baseOpacity:1, ...glassInfo._brick });
  // window span
  const t = inset/len;
  const wx1 = x1 + (x2-x1)*t, wz1 = z1 + (z2-z1)*t;
  const wx2 = x2 - (x2-x1)*t, wz2 = z2 - (z2-z1)*t;
  const wlen = Math.hypot(wx2-wx1, wz2-wz1);
  // 2. recessed glass (sits back via REVEAL along the normal)
  f1Seg(wx1 - nx*REVEAL, wz1 - nz*REVEAL, wx2 - nx*REVEAL, wz2 - nz*REVEAL,
        SILL, GH, M.glass, glassInfo);
  // 3. white lintel above + white sill below the glass, proud of the brick
  f1Seg(wx1 + nx*0.05, wz1 + nz*0.05, wx2 + nx*0.05, wz2 + nz*0.05,
        HEAD, WHITE_T, M.mull);
  f1Seg(wx1 + nx*0.05, wz1 + nz*0.05, wx2 + nx*0.05, wz2 + nz*0.05,
        SILL - WHITE_T, WHITE_T, M.mull);
  // 4. projecting SOLDIER course (thin brick band) just above the lintel
  f1Seg(wx1, wz1, wx2, wz2, HEAD + WHITE_T, 0.5, M.brickD);
  // 5. brick PILASTERS splitting the ribbon into bays, projecting proud
  if (bays > 1) {
    for (let b = 1; b < bays; b++) {
      const bt = b/bays;
      const px = wx1 + (wx2-wx1)*bt, pz = wz1 + (wz2-wz1)*bt;
      box(1.0 + Math.abs(nx)*0, GH + 1.4, 1.0,
          px + nx*0.25, (SILL+HEAD)/2, pz + nz*0.25, M.brickR, G.f1);
    }
  }
}

// --- main block: PLAIN GLASS only (no brick frame, pilasters or jali) ---
// The glass occupies exactly the same opening as before (same width inset,
// same sill and head), but the brick field, white trim, soldier course and
// pilasters are gone — just a clean recessed ribbon of glass.
(function mainBlockGlass(){
  const x1 = F1.xStep, z1 = F1.zNmain, x2 = F1.xW, z2 = F1.zNmain;
  const len = Math.hypot(x2-x1, z2-z1);
  const nx = (z2-z1)/len, nz = -(x2-x1)/len;
  const inset = 2.5;
  const t = inset/len;
  const wx1 = x1 + (x2-x1)*t, wz1 = z1 + (z2-z1)*t;
  const wx2 = x2 - (x2-x1)*t, wz2 = z2 - (z2-z1)*t;
  // plain brick fills the whole face...
  f1Seg(x1, z1, x2, z2, F1_FFL, H1, M.brickR, {
    color:0xbcd2e0, baseOpacity:1, name:'North brick — main block',
    details:['Plain brick face, filling above and below the glass',
             'No ornament — just gathuni (masonry) around the window'] });
  // ...with the glass ribbon punched into the middle
  f1Seg(wx1, wz1, wx2, wz2, SILL, GH, M.glass, GLASS_INFO({
    name:'North glass — main block',
    details:['Plain glazed ribbon window, brick above and below',
             'Same opening as before — sill to head'] }));
})();

// --- PRODUCT DISPLAY behind the main-block ribbon glass ---
// The brick design above stays exactly as is; this just adds a lit display
// deck just inside the glass, so goods face the street like a showroom.
const dispX1 = F1.xStep + 3, dispX2 = F1.xW - 3;
const dispDeck = box(dispX2 - dispX1, 0.4, 2.2, (dispX1+dispX2)/2, SILL - 0.2,
                     F1.zNmain - 1.4, M.disp, G.f1);
for (let i = 0; i < 5; i++) {
  const px = dispX1 + (dispX2 - dispX1) * (i + 0.5) / 5;
  const hh = 1.2 + (i % 3) * 0.5;
  box(1.0, hh, 1.0, px, SILL, F1.zNmain - 1.4, M.prod, G.f1);
}
dispDeck.userData = { color:0x2a2d33, baseOpacity:1, name:'Product display window',
  dim:`${ftin(dispX2-dispX1)} wide`, area:'behind the north glass',
  details:['Raised display platform just inside the 1st-floor ribbon window',
           'Goods face the street like a showroom, lit from within',
           'The brick facade design above is unchanged'] };
makeClickable(dispDeck);

// --- step: solid brick face with a full-height JALI slot (the L-corner feature) ---
// No window here — instead a vertical perforated-brick slot runs the height of
// the step, in the fold of the L where both roads see the corner. Costs only a
// laying pattern, and ties the step into the brick language of the whole north
// face. Behind it: light and air to the stair/corridor, with privacy.
f1Seg(F1.xStep, F1.zNmain, F1.xStep, F1.zNshop, F1_FFL, H1, M.brickR, {
  color:0xbcd2e0, baseOpacity:1, name:'North brick — step',
  details:['Solid brick jog between main block and shop wing, 6\'-2" wide',
           'Carries a full-height glass showcase tower in the fold of the L'] });

// The 6'-2" step carries a full-height GLASS SHOWCASE TOWER in the fold of the
// L, facing the corner so both roads see it — a lit glass column of goods.
const STEP_Z0 = F1.zNmain, STEP_Z1 = F1.zNshop, STEP_MID = (STEP_Z0+STEP_Z1)/2;

// --- glass showcase tower, centred in the step (jali removed) ---
const SHOW_Z = STEP_MID, SHOW_W = (STEP_Z1 - STEP_Z0) - 1.2;
const SHOW_BOT = F1_FFL + 0.8, SHOW_TOP = F1_FFL + H1 - 0.8, SHOW_H = SHOW_TOP - SHOW_BOT;
// glass front of the showcase (proud of the brick face)
const showGlass = box(0.25, SHOW_H, SHOW_W, F1.xStep + 0.35, SHOW_BOT, SHOW_Z, M.glass, G.f1);
showGlass.userData = { color:0xbfe0ec, baseOpacity:0.62, name:'Step showcase — glass',
  dim:`${ftin(SHOW_H)} \u00d7 ${ftin(SHOW_W)}`, area:'L-corner display tower',
  details:['Full-height glass showcase in the fold of the L',
           'Seen from both roads — a lit glass column of goods',
           'Multi-shelf display behind, LED-lit at night'] };
makeClickable(showGlass);
// shelves inside + a product on each
const SHELVES = 4;
for (let sI = 0; sI < SHELVES; sI++) {
  const y = SHOW_BOT + 0.6 + sI * (SHOW_H - 0.8) / SHELVES;
  box(0.5, 0.1, SHOW_W - 0.3, F1.xStep + 0.3, y, SHOW_Z, M.disp, G.f1);        // shelf
  box(0.5, 0.8, 0.9, F1.xStep + 0.3, y + 0.1, SHOW_Z, M.prod, G.f1);            // product on it
}

// --- shop wing: plain brick + a simple window (jali removed for a cleaner,
//     more modern face — fewer elements, less labour, lower cost) ---
brickFace(F1.xE, F1.zNshop, F1.xStep, F1.zNshop,
  { ...GLASS_INFO({ name:'North glass — shop wing',
      details:['Simple window in a plain brick face'] }),
    _brick:{ name:'North brick — shop wing',
      details:['Plain brick face — clean and modern, no ornament'] } },
  5.5, 1);

// --- site WEST: brick to the end of the stair bay, then glass ---
// The brick stops 2'-0" short of the slab, leaving a continuous DAYLIGHT BAND
// along the top of the whole 36'-1" run. Glazed, so light comes in but rain
// stays out.
//
// Mullions: slim aluminium, 2" wide, at 6'-0" centres (5 intermediate). Chosen
// over brick piers or ACP fins because the band exists for LIGHT — a brick
// pier 2' tall would block the very thing the band is for, and cost more. 2"
// aluminium blocks almost nothing, and 6'-0" x 2'-0" is a stock pane size, so
// there's no wasteful cutting and any local glazier can fit it.
// West wall: 8'-6" brick below, a 2'-0" glazed clerestory band along the top.
// (Flipped back from the near-full-height glass version.) The 4"x5" concrete
// mullion beams divide the 2' band at 5'-0" centres.
const CLERE   = 2;                   // 2'-0" daylight band at the top
const BRICK_H = H1 - CLERE;          // 8'-6" of brick below it
const MULL_SPACING = 5;              // 5'-0" between mullion beams
const WEST_RUN = Z.shutter - Z.n;    // west run (south -> stair bay)
const N_MULL = Math.max(1, Math.round(WEST_RUN / MULL_SPACING) - 1);

// 8'-6" brick, floor up
f1Seg(F1.xW, F1.zS, F1.xW, F1.zBrick, F1_FFL, BRICK_H, M.brick, {
  color: 0xf0ede6, baseOpacity: 1,
  name: 'West wall — brick',
  details: ['5" single-brick, 8\'-6" high — stops 2\'-0" below the slab',
            'Runs from the south end to where the stair bay ends',
            'Sits on the edge of the 5\'-0" west cantilever'] });

// 2'-0" clerestory glass band along the top
f1Seg(F1.xW, F1.zS, F1.xW, F1.zBrick, F1_FFL + BRICK_H, CLERE, M.glass, GLASS_INFO({
  name: 'West clerestory — daylight band',
  details: ['2\'-0" glazed band along the top of the brick, 36\'-1" long',
            'Daylight in, rain out — soft indirect light all day',
            'Panes ~5\'-0" x 2\'-0" between 4"x5" concrete mullion beams'] }));

// 4"x5" concrete mullion beams across the 2' band, 5'-0" centres
const MB_D = 4/12, MB_W = 5/12;
for (let i = 1; i <= N_MULL; i++) {
  const z = F1.zS + (F1.zBrick - F1.zS) * i / (N_MULL + 1);
  box(MB_D, CLERE, MB_W, F1.xW, F1_FFL + BRICK_H, z, M.cbeam, G.f1);
}
f1Seg(F1.xW, F1.zBrick, F1.xW, F1.zNmain, F1_FFL, H1, M.glass, GLASS_INFO({
  name: 'Display / Showcase glass',
  dim: `${ftin(F1.zNmain - F1.zBrick)} \u00d7 ${ftin(H1)}`,
  area: `${Math.round((F1.zNmain - F1.zBrick) * H1)} sf`,
  details: ['Full-height glazed panel on the west face — 10\'-0" \u00d7 10\'-6"',
            'A display / showcase window facing the main road',
            'Picks up where the brick stops, at the stair bay\'s north end'] }));

// --- site EAST + site SOUTH: solid brick, full height, no openings ---
// These two faces are blind: east looks down the shop's long flank and south
// is the rear, so neither earns glazing the way the street front does.
const BRICK_INFO = d => ({ color: 0xf0ede6, baseOpacity: 1, ...d });
f1Seg(F1.xE, F1.zS, F1.xE, F1.zNshop, F1_FFL, H1, M.brick, BRICK_INFO({
  name: 'East wall — brick',
  details: ['Solid brick, full height, no openings',
            'Longest face at 52\'-3" — runs the whole depth',
            'Covers both the main block and the shop wing'] }));
f1Seg(F1.xE, F1.zS, F1.xW, F1.zS, F1_FFL, H1, M.brick, BRICK_INFO({
  name: 'South wall — brick',
  details: ['Solid brick, full height, no openings',
            'Rear face, 44\'-9" long',
            'Sits over the back showroom below'] }));

// --- slim dark horizontal band at the 1st-floor line (modern accent) ---
// A single clean horizontal line wrapping the two street faces (north + west)
// ties the composition together and reads as modern. Just a painted band —
// near-zero cost, big visual effect.
const BAND_H = 0.7, BAND_Y = F1_FFL - BAND_H;
function modBand(x1, z1, x2, z2) {
  const len = Math.hypot(x2-x1, z2-z1), horiz = Math.abs(x2-x1) > Math.abs(z2-z1);
  box(horiz?len:0.55, BAND_H, horiz?0.55:len, (x1+x2)/2, BAND_Y, (z1+z2)/2, M.brickD, G.f1);
}
modBand(F1.xStep, F1.zNmain, F1.xW, F1.zNmain);   // north main
modBand(F1.xE, F1.zNshop, F1.xStep, F1.zNshop);   // north shop wing
modBand(F1.xStep, F1.zNmain, F1.xStep, F1.zNshop);// step
modBand(F1.xW, F1.zS, F1.xW, F1.zNmain);          // west

// --- open floor plate (clickable, names the space) ---
const f1Tint = (x1, z1, x2, z2) => {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(x2-x1, z2-z1),
    new THREE.MeshStandardMaterial({ color:0x6fa8c4, roughness:1, transparent:true, opacity:0.22 }));
  m.rotation.x = -Math.PI/2;
  m.position.set((x1+x2)/2, F1_FFL + 0.04, (z1+z2)/2);
  G.f1.add(m);
  return m;
};
const f1Floor = f1Tint(F1.xE, F1.zS, F1.xW, F1.zNmain);
f1Tint(F1.xE, F1.zNmain, F1.xStep, F1.zNshop);
f1Floor.userData = {
  color: 0x6fa8c4, name: 'First floor — open plan',
  dim: `${ftin(F1.xW-F1.xE)} \u00d7 ${ftin(F1.zNmain-F1.zS)} + wing`,
  area: `${Math.round((F1.xW-F1.xE)*(F1.zNmain-F1.zS) + (F1.xStep-F1.xE)*(F1.zNshop-F1.zNmain))} sf`,
  details: ['No partitions — one clear span throughout',
            'Envelope sits on the cantilever edge, oversailing the ground floor',
            'L-shaped: the shop wing steps 6\'-2" further north'],
  baseOpacity: 0.22,
};
makeClickable(f1Floor);

// --- 1st floor roof = the 2nd floor slab ---
const F1_ROOF_Y = F1_FFL + H1;    // 21'-6"
const f1RoofMain = box(F1.xW-F1.xE, SLAB, F1.zNmain-F1.zS, (F1.xE+F1.xW)/2,
                       F1_ROOF_Y, (F1.zS+F1.zNmain)/2, M.roof.clone(), G.f1);
const f1RoofShop = box(F1.xStep-F1.xE, SLAB, F1.zNshop-F1.zNmain, (F1.xE+F1.xStep)/2,
                       F1_ROOF_Y, (F1.zNmain+F1.zNshop)/2, M.roof.clone(), G.f1);
[f1RoofMain, f1RoofShop].forEach(m => { m.castShadow = false; });
f1RoofMain.userData = {
  color: 0xc8552f, name: '1st floor roof',
  dim: `${ftin(F1.xW-F1.xE)} \u00d7 ${ftin(F1.zNmain-F1.zS)}`,
  area: `${Math.round((F1.xW-F1.xE)*(F1.zNmain-F1.zS))} sf`,
  details: ['Caps the 1st floor at 21\'-6"',
            'Follows the same L-shaped outline as the envelope'],
  baseOpacity: 0.42,
};
makeClickable(f1RoofMain);

/* ========================= STREET PRESENCE (v34) =========================
   The main road runs 30-40 m off the site's WEST side (+X), so the brick
   wall — not the glazed north front — is what the road actually sees, and
   always at an angle across the NW corner. Neighbouring plots may one day
   build up beside the brick wall, so the corner fin is deliberately the
   tallest, most forward element: it stays visible even if the wall itself
   gets screened. Three moves, cheapest-first thinking throughout. */

// --- 1. corner fin / pylon at the NW corner ---
// Vertical ACP blade on a steel frame, rising 5' past the 1st floor roof.
// Faces the main road edge-on AND face-on because it stands proud of the
// corner in both directions. This is signboard money doing landmark work.
// The fin STARTS AT THE 1ST FLOOR, not the ground: below it the corner
// stays completely clear for people walking to the gateway and Gate A. It
// cantilevers off the 1st floor slab edge and its own roof-level bracing —
// acceptable for an ACP-on-steel blade this light, unlike a masonry pylon
// which would have needed its own footing.
const FIN_W = 1.2, FIN_D = 3.5, FIN_TOP = F1_ROOF_Y + 5;
const FIN_BASE = F1_FFL;                 // 11'-0" — nothing below this
const FIN_H = FIN_TOP - FIN_BASE;        // 15'-6" of blade
const finX = F1.xW + FIN_W/2 - 0.1, finZ = F1.zNmain - FIN_D/2 + 0.1;
const fin = box(FIN_W, FIN_H, FIN_D, finX, FIN_BASE, finZ, M.fin, G.f1);
fin.userData = {
  color: 0x1f4e8c, name: 'Corner fin — signage pylon',
  dim: `${ftin(FIN_H)} tall \u00d7 ${ftin(FIN_D)}`,
  area: `${Math.round(FIN_H*FIN_D)} sf face`,
  details: ['ACP on a steel frame at the NW corner, the site\'s most visible point',
            'Starts at the 1st floor — the ground below stays clear for the gateway',
            'Rises 5\'-0" above the 1st floor roof — reads over future neighbours',
            'Vertical signage on both faces: seen along AND across the main road'],
  baseOpacity: 1,
};
makeClickable(fin);
// vertical sign strip on the road-facing (west) face of the fin
box(0.15, FIN_H*0.7, FIN_D*0.62, finX + FIN_W/2 + 0.02, FIN_BASE + FIN_H*0.15, finZ, M.sign, G.f1);

// --- 2. signage fascia at the TOP of the west glass, facing the main road ---
// The west face is now mostly glass on a low brick base, so there's no big
// brick field for a sign. Instead a slim sign band sits on the spandrel just
// under the roof — a clean home for the name, legible from the main road.
const SP_W = 16, SP_H = 1.8;
const signPanel = box(0.14, SP_H, SP_W, F1.xW + 0.12,
                      F1_FFL + H1 - SP_H - 0.2, (F1.zS + F1.zBrick)/2, M.sign, G.f1);
signPanel.userData = {
  color: 0xf4f1ea, name: 'West wall sign fascia',
  dim: `${ftin(SP_W)} \u00d7 ${ftin(SP_H)}`,
  area: `${Math.round(SP_W*SP_H)} sf`,
  details: ['Slim sign band under the roof on the west face, facing the main road',
            'Sized for ~1\'-6" letters — legible at 40 m',
            'Sits above the glass, on the top spandrel'],
  baseOpacity: 1,
};
makeClickable(signPanel);

/* ---------- zone labels ---------- */
[['Back showroom  40\'-4" × 20\'-4"', (X.w+X.e)/2, 6.5, Z.entry/2],
 ['Shop  10\' × 27\'-6"', X.shopE/2, 6.5, (Z.entry+Z.shopS)/2],
 ['Front showroom  19\'-10" × 15\'-4"', (X.shopE+X.stairW)/2, 6.5, (Z.entry+Z.shutter)/2],
 ['Stair  9\'-8" bay', (X.stairW+X.e)/2, 12, (Z.entry+Z.gateway)/2],
 ['Gateway  9\'-8" × 4\'-0"', (X.stairW+X.e)/2, 5.5, (Z.gateway+Z.shutter)/2],
 ['Verandha  6\' deep', (X.shopE+X.stairW)/2, 3.5, (Z.shutter+Z.verandha)/2],
 ['Bike park', (X.stairW+X.e)/2, 3.5, (Z.shutter+Z.verandha)/2],
 ['Back showroom entry', 20, 9.6, Z.entry],
].forEach(([t,x,y,z]) => addLabel(G.labels, t,x,y,z));

/* ---------- dimension lines ---------- */
const dimMat = new THREE.LineBasicMaterial({ color:0x2f6a8f });
const dim = (x1,z1,x2,z2,text,y=0.06,off=2.5) => {
  const horiz = Math.abs(x2-x1) > Math.abs(z2-z1);
  const ox = horiz ? 0 : -off, oz = horiz ? -off : 0;
  const a = new THREE.Vector3(x1+ox, y, z1+oz), b = new THREE.Vector3(x2+ox, y, z2+oz);
  G.dims.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([a,b]), dimMat));
  [[x1,z1,a],[x2,z2,b]].forEach(([px,pz,p]) => {
    G.dims.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(
      [new THREE.Vector3(px,y,pz), p]), dimMat));
  });
  addLabel(G.dims, text, (a.x+b.x)/2, y+0.4, (a.z+b.z)/2, 'tag dim');
};
dim(X.w, Z.n, X.e, Z.n, '40\'-4"');
dim(X.w, Z.n, X.w, Z.entry, '20\'-4"');
dim(X.w, Z.entry, X.w, Z.shopS, '27\'-6"', 0.06, 5.5);
dim(X.w, Z.entry, X.shopE, Z.entry, '10\'-0"', 0.06, -3);
dim(X.shopE, Z.entry, X.stairW, Z.entry, '19\'-10"', 0.06, -3);
dim(X.stairW, Z.n, X.e, Z.n, '9\'-8"', 0.06, 5.5);
dim(X.shopE, Z.entry, X.shopE, Z.shutter, '15\'-4"', 0.06, -1.5);
dim(X.e, Z.shutter, X.e, Z.verandha, '6\'-0"', 0.06, -3);

/* ---------- panel dropdown ---------- */
document.getElementById('panel-toggle').addEventListener('click', () => {
  document.getElementById('panel').classList.toggle('open');
});

/* ---------- toggles ---------- */
let labelsOn = false;   // overwritten from the checkbox at startup, see below
// A tag is shown only if BOTH the master Labels switch is on AND its own
// feature group is visible — e.g. a cantilever's dimension tag stays hidden
// while "Cantilever slabs" is off, even if Labels is on, and every tag
// (cantilever, dims, shutter/gate, zone names) disappears together the
// instant Labels is switched off, regardless of which group it lives in.
//
// IMPORTANT: this sets obj.visible (the CSS2DObject's own Object3D flag), not
// obj.element.style.display directly. CSS2DRenderer recomputes
// element.style.display from object.visible on every single render() call,
// so a manual style.display='none' gets silently overwritten on the very
// next animation frame — that was the earlier bug where zone name tags
// (Shop, Verandha, ...) never actually stayed hidden.
function refreshLabelVisibility() {
  labelRegistry.forEach(({ obj, group }) => {
    obj.visible = labelsOn && group.visible;
  });
}
// bind() reads the checkbox's `checked` attribute and applies it immediately,
// so the HTML markup is the SINGLE source of truth for every default. Don't
// set G.<group>.visible by hand anywhere — add/remove `checked` in the markup
// instead, or the switch and the scene drift apart.
const bind = (id, g) => {
  const el = document.getElementById(id);
  const setVis = on => {
    g.visible = on;
    refreshLabelVisibility();
  };
  el.addEventListener('change', () => setVis(el.checked));
  setVis(el.checked);   // apply the markup default at startup
};
bind('t-walls', G.walls); bind('t-cols', G.cols); bind('t-stair', G.stair);
bind('t-shutter', G.shutter); bind('t-roof', G.roof); bind('t-f1', G.f1); bind('t-road', G.road);
bind('t-dims', G.dims); bind('t-grid', G.grid);

const elLabels = document.getElementById('t-labels');
elLabels.addEventListener('change', () => {
  labelsOn = elLabels.checked;
  refreshLabelVisibility();
});
// Labels and Dimensions both start OFF: the model opens clean, and the user
// turns annotation on only if they want it. Read the state from the markup
// rather than assuming, for the same single-source-of-truth reason as bind().
labelsOn = elLabels.checked;
refreshLabelVisibility();

/* ---------- room / section selection ---------- */
const roomEl      = document.getElementById('room');
const roomSw      = document.getElementById('room-sw');
const roomName    = document.getElementById('room-name');
const roomDim     = document.getElementById('room-dim');
const roomArea    = document.getElementById('room-area');
const roomDetails = document.getElementById('room-details');
const raycaster = new THREE.Raycaster();
const pointerNDC = new THREE.Vector2();
let selected = null;

function paintSelection(mesh, on) {
  const b = mesh.userData.baseOpacity;
  // Translucent things (zone tints, roof, glass) read best highlighted by
  // going more solid. Opaque things (brick, ACP) can't — bumping opacity on
  // an already-opaque mesh would make it MORE see-through. Those glow instead.
  if (b < 1) mesh.material.opacity = on ? Math.min(b + 0.32, 0.9) : b;
  else mesh.material.emissive.setHex(on ? 0x4a2418 : 0x000000);
}
function showRoom(mesh) {
  if (selected) paintSelection(selected, false);
  selected = mesh;
  paintSelection(selected, true);
  const d = mesh.userData;
  roomSw.style.background = '#' + d.color.toString(16).padStart(6, '0');
  roomName.textContent = d.name;
  roomDim.textContent = d.dim;
  roomArea.textContent = d.area;
  roomDetails.innerHTML = '';
  d.details.forEach(t => {
    const li = document.createElement('li');
    li.textContent = t;
    roomDetails.appendChild(li);
  });
  roomEl.classList.add('show');
}
function hideRoom() {
  if (selected) paintSelection(selected, false);
  selected = null;
  roomEl.classList.remove('show');
}
document.getElementById('room-close').addEventListener('click', hideRoom);

// distinguish a click from an orbit drag by movement distance
const roomCv = renderer.domElement;
let downX = 0, downY = 0;
roomCv.addEventListener('pointerdown', e => { downX = e.clientX; downY = e.clientY; });
roomCv.addEventListener('pointerup', e => {
  if (flying) return;
  if (Math.hypot(e.clientX - downX, e.clientY - downY) > 4) return; // was a drag
  const r = roomCv.getBoundingClientRect();
  pointerNDC.x = ((e.clientX - r.left) / r.width) * 2 - 1;
  pointerNDC.y = -((e.clientY - r.top) / r.height) * 2 + 1;
  raycaster.setFromCamera(pointerNDC, camera);
  const hits = raycaster.intersectObjects(clickable, false);
  if (hits.length) showRoom(hits[0].object);
  else hideRoom();
});

/* ---------- views ---------- */
const ffHint = document.getElementById('ff');
const crosshair = document.getElementById('crosshair');
const cv = renderer.domElement;

function exitFly() {
  if (!flying) return;
  flying = false; dragging = false;
  orbit.enabled = true;
  orbit.target.copy(camera.position).add(
    camera.getWorldDirection(new THREE.Vector3()).multiplyScalar(18));
  orbit.update();
  ffHint.style.display = 'none';
  crosshair.style.display = 'none';
  cv.style.cursor = 'grab';
}
function enterFly() {
  flying = true;
  orbit.enabled = false;
  flyEuler.setFromQuaternion(camera.quaternion);
  ffHint.style.display = 'block';
  crosshair.style.display = 'block';
  cv.style.cursor = 'none';
  cv.focus();
}
function setView(pos, tgt, fov = 45) {
  exitFly();
  eyeLock = false;   // any preset clears eye-lock unless it re-sets it
  headLook = false;  // and clears head-look
  cv.style.cursor = 'grab';
  if (camera.fov !== fov) { camera.fov = fov; camera.updateProjectionMatrix(); }
  camera.position.set(...pos);
  orbit.target.set(...tgt);
  orbit.enabled = true;
  orbit.update();
}
// When eyeLock is on, the camera behaves like a standing person: you can turn
// and step (orbit/pan/zoom) but your eyes stay at 5'-5" and the view can't
// tip up past level or sink below knee height — no floating or ground-diving.
let eyeLock = false, eyeY = 5.417;
// Head-look: fixed-position 360° for the eye-level view. Position is pinned;
// dragging turns the gaze (yaw + a limited pitch, like a neck). Scroll walks
// forward/back along the current heading but keeps the eye at standing height.
let headLook = false;
const headEuler = new THREE.Euler(0, 0, 0, 'YXZ');
let headDrag = false;
// West–North: sits off the site's WEST (+X) and NORTH (+Z) corner, low
// enough to read the brick/glass split on the west face and the L-shaped
// step on the north face at the same time.
// Main road view: ~35 m (115 ft) off the west side at eye level, angled
// slightly north — what a passer-by on the main road actually sees: the
// brick wall with its relief + sign, clerestory line, and the corner fin.
document.getElementById('v-road').onclick  = () => setView([CX+115, 6, CZ+28], [CX+6, 13, CZ+6]);
document.getElementById('v-wn').onclick    = () => setView([CX+62, 30, CZ+66], [CX+2, 9, CZ+2]);
document.getElementById('v-iso').onclick   = () => setView([CX-52, 48, CZ+62], [CX, 4, CZ]);
// Site overview: pulled back and up to frame the building plus both roads
// and the T-junction in one shot.
document.getElementById('v-site').onclick  = () => setView([CX+120, 150, CZ+150], [CX+70, 0, CZ+55]);

// Eye-level: a 5'-5" person standing AT THE JUNCTION MOUTH (where the 10'
// lane opens onto the 30' main road), looking straight down the lane toward
// the building. This is the true "walking up to it" view.
//
// Realism details:
//  - Eye height 5.417' (5'-5"), exact.
//  - 50 deg VERTICAL fov. three.js fov is vertical, so on a wide screen this
//    gives ~75 deg horizontal — close to a person's comfortable field. (60
//    was too wide and made the building look tiny/far, like a fisheye.)
//  - Gaze dead level: target at the same eye height, so verticals stay
//    vertical instead of converging like a tilted phone photo.
//  - Aimed at the near (fin) corner, the first thing a real eye locks onto.
const EYE_Y = 5.417;
const T_X = FIN_X + ROAD_L;          // junction mouth, on the lane centre
const T_Z = roadZc;
document.getElementById('v-eye').onclick    = () => {
  // Fixed-position 360° look: the person plants their feet and turns their
  // head. We do NOT use orbit here (orbit walks the camera around the target,
  // which moved the person). Instead we lock the position and drive the gaze
  // with the same euler-drag system as free-fly — but with movement keys off,
  // so you can only look, never step. Same person, same spot, same 5'-5" eye.
  exitFly();
  orbit.enabled = false;
  eyeLock = false;                       // orbit-based lock no longer used
  camera.fov = 50; camera.updateProjectionMatrix();
  camera.position.set(T_X, EYE_Y, T_Z);
  camera.lookAt(F1_XW, EYE_Y, T_Z);
  headLook = true;
  headEuler.setFromQuaternion(camera.quaternion);
  cv.style.cursor = 'grab';
};
document.getElementById('v-plan').onclick  = () => setView([CX, 96, CZ+0.01], [CX, 0, CZ]);
document.getElementById('v-front').onclick = () => setView([CX, 14, CZ+78], [CX, 6, CZ]);
document.getElementById('v-fly').onclick   = () => {
  camera.position.set(20, 5.5, Z.verandha + 9);
  camera.lookAt(20, 5.5, Z.entry);
  enterFly();
};

/* ---------- free-fly look: mouse position relative to canvas centre
   drives turn rate — no click/drag/lock needed, feels like a soft-aim
   shooter-style look, and works inside sandboxed iframes. ---------- */
let aimX = 0, aimY = 0; // -1..1 offset from canvas centre
cv.addEventListener('pointermove', e => {
  if (!flying) return;
  const r = cv.getBoundingClientRect();
  aimX = ((e.clientX - r.left) / r.width  - 0.5) * 2;
  aimY = ((e.clientY - r.top)  / r.height - 0.5) * 2;
});
cv.addEventListener('pointerleave', () => { aimX = 0; aimY = 0; });
cv.addEventListener('contextmenu', e => { if (flying) e.preventDefault(); });

/* ---------- head-look: fixed-position 360° for the eye-level view ---------- */
cv.addEventListener('pointerdown', e => {
  if (!headLook || e.button !== 0) return;
  headDrag = true; cv.style.cursor = 'grabbing';
  cv.setPointerCapture(e.pointerId);
});
cv.addEventListener('pointerup', e => {
  if (!headLook) return;
  headDrag = false; cv.style.cursor = 'grab';
  if (cv.hasPointerCapture(e.pointerId)) cv.releasePointerCapture(e.pointerId);
});
cv.addEventListener('pointermove', e => {
  if (!headLook || !headDrag) return;
  headEuler.y -= e.movementX * 0.005;                 // full 360° yaw
  headEuler.x -= e.movementY * 0.005;
  // neck pitch limit: can't look straight up or straight down
  headEuler.x = Math.max(-Math.PI/3, Math.min(Math.PI/3, headEuler.x));
  camera.quaternion.setFromEuler(headEuler);
});
// scroll = step forward/back along the current heading, eye stays at 5'-5"
cv.addEventListener('wheel', e => {
  if (!headLook) return;
  e.preventDefault();
  const step = Math.sign(e.deltaY) * -2.5;
  const dir = camera.getWorldDirection(new THREE.Vector3());
  camera.position.x += dir.x * step;
  camera.position.z += dir.z * step;
  camera.position.y = eyeY;                            // height locked (5'-5")
}, { passive:false });

function aimFly(dt) {
  if (!flying) return;
  const dead = 0.06, turnRate = 2.0;
  const ax = Math.abs(aimX) > dead ? aimX : 0;
  const ay = Math.abs(aimY) > dead ? aimY : 0;
  flyEuler.y -= ax * ax * Math.sign(ax) * turnRate * dt;
  flyEuler.x -= ay * ay * Math.sign(ay) * turnRate * dt;
  flyEuler.x = Math.max(-Math.PI/2 + 0.02, Math.min(Math.PI/2 - 0.02, flyEuler.x));
  camera.quaternion.setFromEuler(flyEuler);
}

/* ---------- free-fly movement ---------- */
const keys = {};
addEventListener('keydown', e => {
  if (e.code === 'Escape') { exitFly(); return; }
  if (flying && ['KeyW','KeyA','KeyS','KeyD','KeyQ','KeyE',
                  'ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code)) e.preventDefault();
  keys[e.code] = true;
});
addEventListener('keyup', e => keys[e.code] = false);
addEventListener('blur', () => { for (const k in keys) keys[k] = false; });

const fwd = new THREE.Vector3(), right = new THREE.Vector3(), UP = new THREE.Vector3(0,1,0);
function moveFly(dt) {
  if (!flying) return;
  const s = (keys.ShiftLeft || keys.ShiftRight ? 34 : 13) * dt;
  camera.getWorldDirection(fwd);
  right.crossVectors(fwd, UP).normalize();
  if (keys.KeyW || keys.ArrowUp)    camera.position.addScaledVector(fwd, s);
  if (keys.KeyS || keys.ArrowDown)  camera.position.addScaledVector(fwd, -s);
  if (keys.KeyD || keys.ArrowRight) camera.position.addScaledVector(right, s);
  if (keys.KeyA || keys.ArrowLeft)  camera.position.addScaledVector(right, -s);
  if (keys.KeyE) camera.position.y += s;
  if (keys.KeyQ) camera.position.y -= s;
}

/* ---------- loop ---------- */
// compass: bearing is measured clockwise from north, with East = -X (since +X
// is the WEST side of the building, confirmed by the 5' cantilever on X.e).
// The tick ring rotates with the card; the letters are re-placed around the
// dial each frame so they stay upright and legible instead of tumbling.
// NOTE: rotation uses the SVG rotate(a,cx,cy) attribute, not CSS transform —
// CSS rotates about the viewBox origin (0,0), which flings the card off-centre.
//
// LABEL SWAP: per your correction, geographic North is the shop's street side
// (my Z.shopS), not the back showroom side (my Z.n). Rather than rename Z.n /
// Z.shopS everywhere in the geometry — which would touch hundreds of lines
// and risk breaking a dimension — only the compass DISPLAY was flipped: the
// element id="cp-n" shows "S", id="cp-s" shows "N", id="cp-e" shows "W",
// and id="cp-w" shows "E" — all four glyphs remapped to the real site.
// The position/rotation math (CARDINALS, phi values) is untouched. So the
// compass now reads correctly on screen, but internal code comments and the
// clickable-zone detail text still use this file's raw axis names ("north
// wall" = Z.n, "west wall" = X.e). Treat those as internal labels, not site
// directions.
const compassTicks = document.getElementById('compass-ticks');
const cpText = {
  n: document.getElementById('cp-n'), e: document.getElementById('cp-e'),
  s: document.getElementById('cp-s'), w: document.getElementById('cp-w'),
};
const CP_C = 38, CP_R = 21;
const CARDINALS = [['n',0],['e',90],['s',180],['w',270]];
const camDir = new THREE.Vector3();
function updateCompass() {
  camera.getWorldDirection(camDir);
  const bearing = Math.atan2(-camDir.x, -camDir.z); // 0 = N, +90deg = E
  const A = -bearing * 180 / Math.PI;               // card rotation, degrees
  compassTicks.setAttribute('transform', `rotate(${A.toFixed(2)} ${CP_C} ${CP_C})`);
  for (const [k, phi] of CARDINALS) {
    const t = (phi + A) * Math.PI / 180;
    cpText[k].setAttribute('x', (CP_C + CP_R * Math.sin(t)).toFixed(2));
    cpText[k].setAttribute('y', (CP_C - CP_R * Math.cos(t)).toFixed(2));
  }
}
setView([CX+115, 6, CZ+28], [CX+6, 13, CZ+6]);   // open on the Main road view
const clock = new THREE.Clock();
(function tick(){
  requestAnimationFrame(tick);
  const dt = Math.min(clock.getDelta(), 0.05);
  aimFly(dt);
  moveFly(dt);
  if (!flying && !headLook) orbit.update();
  updateCompass();
  renderer.render(scene, camera);
  labelRenderer.render(scene, camera);
})();

addEventListener('resize', () => {
  camera.aspect = innerWidth/innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
  labelRenderer.setSize(innerWidth, innerHeight);
});
