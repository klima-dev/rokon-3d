import * as THREE from 'three';

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
export const TEX = {
  brickR : brickTexture(0xe9e7e0, '#dedcd4'),   // warm white brick, subtle mortar
  brickD : brickTexture(0x33404a, '#2b363f'),   // dark slate accent brick
  concrete: speckleTexture(0xcfcabf, 0.5),
  plasterN: speckleTexture(0xf4f2ec, 0.35),
};
TEX.brickR.repeat.set(4, 3);
TEX.brickD.repeat.set(2, 3);
TEX.concrete.repeat.set(3, 3);

/* ---------- materials ---------- */
export const M = {
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

export const zoneMat = c => new THREE.MeshStandardMaterial({ color:c, roughness:1, transparent:true, opacity:0.5 });
