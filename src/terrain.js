import { TILE, CELL, PLOT } from './farm.js';
import { hash32, rng } from './util.js';
import { makeTree, makeCabin } from './sprites.js';

const R = (g, x, y, w, h, c) => { g.fillStyle = c; g.fillRect(x, y, w, h); };

export const CABIN = { tx: 12, ty: 1, windows: [{ x: 12 * 16 + 20, y: 60 }, { x: 12 * 16 + 60, y: 60 }] };

/** Pre-renders everything that never moves: grass, paths, pond, cabin, trees, empty-plot patches */
export function buildTerrain(farm) {
  const { W, H, ox, oy, cols, rows } = farm;
  const c = document.createElement('canvas');
  c.width = W * TILE; c.height = H * TILE;
  const g = c.getContext('2d');
  const rand = rng(hash32(`terra-${W}x${H}`));
  const blocked = new Uint8Array(W * H);
  const mark = (x, y, w = 1, h = 1) => {
    for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) if (i >= 0 && j >= 0 && i < W && j < H) blocked[j * W + i] = 1;
  };
  const inFarm = (x, y, pad = 0) => x >= ox - pad && x < ox + cols * CELL + pad && y >= oy - pad && y < oy + rows * CELL + pad;

  // grass: low-frequency patches + per-tile jitter
  const tones = ['#6fa957', '#78b15f', '#82bb68'];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const n = Math.sin(x * 0.55) + Math.sin(y * 0.7) + Math.sin((x + y) * 0.31) + (rand() - 0.5) * 1.6;
    R(g, x * TILE, y * TILE, TILE, TILE, tones[n < -0.6 ? 0 : n < 0.9 ? 1 : 2]);
    const tufts = rand() < 0.5 ? 1 + (rand() * 2 | 0) : 0;
    for (let t = 0; t < tufts; t++) {
      const px = x * TILE + 1 + (rand() * 13 | 0), py = y * TILE + 2 + (rand() * 12 | 0);
      R(g, px, py, 1, 2, '#58934a'); R(g, px + 1, py + 1, 1, 1, '#58934a');
    }
  }

  // empty-plot patches (unplowed fields) so the grid reads before a project has hours
  for (const p of farm.plots) {
    R(g, p.px + 14, p.py + 14, 68, 68, 'rgba(60,110,50,0.35)');
  }

  // dirt paths: grid lines between plots, a ring road, and a trail from the cabin door
  const dirt = new Set();
  const addDirt = (x, y) => { if (x >= 0 && y >= 0 && x < W && y < H) dirt.add(y * W + x); };
  for (let r = 0; r < rows; r++) for (let cc = 0; cc < cols; cc++) {
    for (let k = 0; k < CELL; k++) { addDirt(ox + cc * CELL + PLOT, oy + r * CELL + k); addDirt(ox + cc * CELL + k, oy + r * CELL + PLOT); }
  }
  for (let x = Math.min(ox - 1, CABIN.tx + 2); x < ox + cols * CELL; x++) addDirt(x, oy - 1);
  for (let y = oy - 1; y < oy + rows * CELL; y++) addDirt(ox - 1, y);
  for (let y = CABIN.ty + 4; y <= oy - 1; y++) addDirt(CABIN.tx + 2, y);
  for (const k of dirt) {
    const x = k % W, y = (k / W) | 0;
    R(g, x * TILE, y * TILE, TILE, TILE, '#b98e5a');
    for (let i = 0; i < 7; i++) R(g, x * TILE + (rand() * 15 | 0), y * TILE + (rand() * 15 | 0), 1 + (rand() * 2 | 0), 1, rand() < 0.5 ? '#a47a49' : '#cba173');
    blocked[k] = 1;
  }
  mark(ox - 1, oy - 1, cols * CELL + 1, rows * CELL + 1);

  // cabin
  g.drawImage(makeCabin(), CABIN.tx * TILE, CABIN.ty * TILE);
  mark(CABIN.tx, CABIN.ty, 5, 4);

  // pond with sand tucked in the bottom-right corner
  const pcx = W - 5, pcy = H - 5, prx = 3.3, pry = 2.4;
  const pond = [];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (blocked[y * W + x] || inFarm(x, y, 1)) continue;
    const d = ((x + 0.5 - pcx) / prx) ** 2 + ((y + 0.5 - pcy) / pry) ** 2;
    if (d <= 1) {
      R(g, x * TILE, y * TILE, TILE, TILE, '#4a8fc7');
      for (let i = 0; i < 4; i++) R(g, x * TILE + (rand() * 13 | 0), y * TILE + (rand() * 14 | 0), 3, 1, '#6bb0e0');
      pond.push({ x: x * TILE, y: y * TILE });
      mark(x, y);
    } else if (d <= 1.55) {
      R(g, x * TILE, y * TILE, TILE, TILE, '#d9c78e');
      for (let i = 0; i < 5; i++) R(g, x * TILE + (rand() * 15 | 0), y * TILE + (rand() * 15 | 0), 1, 1, '#c3b074');
      mark(x, y);
    }
  }

  // flowers and rocks
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (blocked[y * W + x] || rand() > 0.05) continue;
    const col = ['#f7f3ea', '#f4a6c0', '#f7d23e', '#b9a3f2'][rand() * 4 | 0];
    const fx = x * TILE + 3 + (rand() * 9 | 0), fy = y * TILE + 3 + (rand() * 9 | 0);
    R(g, fx, fy, 2, 2, col); R(g, fx, fy + 2, 1, 2, '#58934a');
  }
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (blocked[y * W + x] || inFarm(x, y, 2) || rand() > 0.012) continue;
    R(g, x * TILE + 3, y * TILE + 7, 9, 6, '#8a8f93'); R(g, x * TILE + 4, y * TILE + 6, 6, 2, '#a7acaf'); R(g, x * TILE + 3, y * TILE + 12, 9, 1, '#6d7276');
    mark(x, y);
  }

  // trees: dense near the world edge, sparse inland; drawn back-to-front
  const trees = [makeTree(0), makeTree(1)];
  const placed = [];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (blocked[y * W + x] || inFarm(x, y, 2)) continue;
    const d = Math.min(x, y, W - 1 - x, H - 1 - y);
    const p = d <= 1 ? 0.75 : d <= 3 ? 0.4 : d <= 5 ? 0.12 : 0.03;
    if (rand() < p) { placed.push({ x, y, v: rand() < 0.45 ? 1 : 0 }); mark(x, y); }
  }
  for (const t of placed) g.drawImage(trees[t.v], t.x * TILE - 4, t.y * TILE + TILE - 32);

  return { canvas: c, pond };
}
