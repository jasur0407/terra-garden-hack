import './style.css';
import { loadLatest } from './data.js';
import { makeDemo } from './demo.js';
import { buildFarm } from './farm.js';
import { Camera, bindInput } from './camera.js';
import { Renderer } from './renderer.js';

const canvas = document.getElementById('farm');

// Real stats if the Action has saved some, otherwise a made-up demo farm
const latest = (await loadLatest()) ?? makeDemo().latest;

const farm = buildFarm(latest);
const world = { width: farm.width, height: farm.height };
const PAD = 4 * 16;
const fr = farm.farmRect;
const camera = new Camera(world, { x: fr.x * 16 - PAD, y: fr.y * 16 - PAD, w: fr.w * 16 + 2 * PAD, h: fr.h * 16 + 2 * PAD });
const renderer = new Renderer(canvas, farm, camera);

bindInput(canvas, camera, {});
window.addEventListener('resize', () => renderer.resize());
renderer.resize();

function loop(now) {
  renderer.frame(now);
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

// Tiny debugging handle for the browser console
window.terra = { farm, camera, renderer };