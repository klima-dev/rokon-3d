import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CSS2DRenderer } from 'three/addons/renderers/CSS2DRenderer.js';
import { CX, CZ } from '../config/dimensions.js';

const app = document.getElementById('app');

export const scene = new THREE.Scene();
scene.background = new THREE.Color(0xeceae4);
// Fog pushed way back (was 90->300): the north road alone is ~144' long, so a
// close fog wall greyed things out the moment you zoomed to frame it. Now it
// only softens the very far ground plane, never the building.
scene.fog = new THREE.Fog(0xeceae4, 600, 1400);

export const camera = new THREE.PerspectiveCamera(45, innerWidth/innerHeight, 1.0, 1600);

export const renderer = new THREE.WebGLRenderer({ antialias:true, logarithmicDepthBuffer:true,
  powerPreference:'high-performance', precision:'highp' });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
// warmer, higher-contrast output than the flat default
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
app.appendChild(renderer.domElement);

export const labelRenderer = new CSS2DRenderer();
labelRenderer.setSize(innerWidth, innerHeight);
labelRenderer.domElement.style.cssText = 'position:fixed;inset:0;pointer-events:none';
app.appendChild(labelRenderer.domElement);

export const orbit = new OrbitControls(camera, renderer.domElement);
orbit.enableDamping = true;
orbit.dampingFactor = 0.07;
orbit.maxPolarAngle = Math.PI/2 - 0.02;
// Stop infinite zoom-out: past ~500' the model is a speck and it's easy to get
// lost. minDistance keeps you from clipping through the geometry up close.
orbit.minDistance = 6;
orbit.maxDistance = 500;
orbit.target.set(CX, 4, CZ);

addEventListener('resize', () => {
  camera.aspect = innerWidth/innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
  labelRenderer.setSize(innerWidth, innerHeight);
});
