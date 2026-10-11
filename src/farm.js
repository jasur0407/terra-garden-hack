export const TILE = 16;
export const CELL = 7;
export const PLOT = 6;
export const MARGIN = 8;
const MIN_W = 44, MIN_H = 30;
const MAX_PLOTS = 24;

/** Layout: the biggest project sits at the centre, smaller ones spiral outwards */
export function buildFarm(latest) {
  const projects = [...latest.projects].sort((a, b) => b.seconds - a.seconds).slice(0, MAX_PLOTS);
  const n = Math.max(projects.length, 1);
  const cols = Math.min(n, Math.max(2, Math.ceil(Math.sqrt(n * 1.5))));
  const rows = Math.ceil(n / cols);
  const W = Math.max(MIN_W, cols * CELL + 2 * MARGIN);
  const H = Math.max(MIN_H, rows * CELL + 2 * MARGIN);
  const ox = Math.floor((W - cols * CELL) / 2);
  const oy = Math.floor((H - rows * CELL) / 2);

  const cells = [];
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    cells.push({ c, r, d: (c - (cols - 1) / 2) ** 2 + ((r - (rows - 1) / 2) * 1.4) ** 2 + c * 1e-3 + r * 1e-4 });
  }
  cells.sort((a, b) => a.d - b.d);

  const plots = projects.map((p, i) => {
    const cell = cells[i];
    const x = ox + cell.c * CELL, y = oy + cell.r * CELL;
    return {
      name: p.name, rank: i + 1, seconds: p.seconds,
      languages: p.languages?.length ? p.languages : latest.languages,
      x, y, px: x * TILE, py: y * TILE,
    };
  });

  return {
    W, H, cols, rows, ox, oy, plots,
    width: W * TILE, height: H * TILE,
    farmRect: { x: ox, y: oy, w: cols * CELL, h: rows * CELL },
  };
}

