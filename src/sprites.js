// All pixel art is drawn in code onto tiny offscreen canvases, so there is nothing to download.

const canvas = (w = 16, h = 16) => {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return c;
};
const R = (g, x, y, w, h, c) => { g.fillStyle = c; g.fillRect(x, y, w, h); };
const P = (g, x, y, c) => R(g, x, y, 1, 1, c);
function disc(g, cx, cy, r, c) {
  for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++) {
    if (x * x + y * y <= r * r + r * 0.6) P(g, cx + x, cy + y, c);
  }
}


export function makeTree(variant) {
  const c = canvas(24, 32), g = c.getContext('2d');
  R(g, 10, 22, 4, 10, '#6b4423'); R(g, 13, 22, 1, 10, '#4a2e14');
  const g1 = variant ? '#2f7a3d' : '#3a8f45', g2 = variant ? '#3f9650' : '#4fae52', g3 = '#256a33';
  if (variant === 1) {
    for (let i = 0; i < 4; i++) { const w = 6 + i * 4, y = 4 + i * 5; R(g, 12 - w / 2, y, w, 6, i % 2 ? g1 : g2); R(g, 12 - w / 2, y + 5, w, 1, g3); }
  } else {
    disc(g, 12, 12, 9, g1); disc(g, 9, 9, 6, g2); disc(g, 16, 14, 5, g1);
    for (let i = 0; i < 6; i++) P(g, 5 + ((i * 7) % 14), 18 + (i % 3), g3);
  }
  return c;
}

export function makeCabin() {
  const c = canvas(80, 64), g = c.getContext('2d');
  R(g, 8, 26, 64, 36, '#b9814a'); for (let y = 28; y < 62; y += 6) R(g, 8, y, 64, 1, '#8a5a2b');
  R(g, 8, 61, 64, 3, '#5e3a1a');
  for (let i = 0; i < 24; i++) R(g, 4 + i, 24 - i, 72 - i * 2, 1, i % 3 ? '#b5472f' : '#8f3422');
  R(g, 4, 24, 72, 2, '#6e2415');
  R(g, 34, 40, 12, 22, '#5e3a1a'); R(g, 35, 41, 10, 21, '#7a4f26'); P(g, 43, 52, '#f2c14e');
  for (const x of [14, 54]) { R(g, x, 38, 12, 12, '#3a2a1a'); R(g, x + 1, 39, 10, 10, '#ffd98a'); R(g, x + 5, 39, 1, 10, '#3a2a1a'); R(g, x + 1, 43, 10, 1, '#3a2a1a'); }
  R(g, 56, 4, 8, 14, '#8a8a8a'); R(g, 55, 3, 10, 3, '#6a6a6a');
  return c;
}
