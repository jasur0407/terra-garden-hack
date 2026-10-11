import { clamp, easeOut } from './util.js';

export class Camera {
  /** 'focus' is the world rectangle (px) the default view should frame, the whole world is the zoom-out limit */
  constructor(world, focus = { x: 0, y: 0, w: world.width, h: world.height }) {
    this.world = world;
    this.focus = focus;
    this.x = focus.x + focus.w / 2; this.y = focus.y + focus.h / 2; this.zoom = 1;
    this.vw = 1; this.vh = 1;
    this.fitZoom = 1;
    this.leftReserve = 0;
    this.flight = null;
   }

  resize(vw, vh) {
    const wasFit = Math.abs(this.zoom - this.fitZoom) < 1e-3;
    this.vw = vw; this.vh = vh;
    const f = this.focus;
    // On wide screens the HUD column covers the left edge, so frame the farm in the space to its right
    this.sideInset = vw > 760 ? this.leftReserve : 0;
    this.fitZoom = Math.min((vw - this.sideInset) / f.w, vh / f.h) * 0.97;
    this.worldZoom = Math.min(vw / this.world.width, vh / this.world.height) * 0.97;
    if (wasFit || !this.ready) { this.zoom = this.fitZoom; this.x = this.fitX; this.y = this.fitY; this.ready = true; }
    this.clampView();
   }

  get fitX() { return this.focus.x + this.focus.w / 2 - this.sideInset / 2 / this.fitZoom; }
  get fitY() { return this.focus.y + this.focus.h / 2; }

  get minZoom() { return Math.min(this.fitZoom, this.worldZoom) * 0.85; }
  get maxZoom() { return Math.max(10, this.fitZoom * 8); }

  clampView() {
    this.zoom = clamp(this.zoom, this.minZoom, this.maxZoom);
    this.x = clamp(this.x, 0, this.world.width);
    this.y = clamp(this.y, 0, this.world.height);
   }

  toWorld(sx, sy) { return [(sx - this.vw / 2) / this.zoom + this.x, (sy - this.vh / 2) / this.zoom + this.y]; }
  toScreen(wx, wy) { return [(wx - this.x) * this.zoom + this.vw / 2, (wy - this.y) * this.zoom + this.vh / 2]; }

  zoomAt(sx, sy, factor) {
    this.flight = null;
    const [wx, wy] = this.toWorld(sx, sy);
    this.zoom = clamp(this.zoom * factor, this.minZoom, this.maxZoom);
    this.x = wx - (sx - this.vw / 2) / this.zoom;
    this.y = wy - (sy - this.vh / 2) / this.zoom;
    this.clampView();
   }

  panBy(dx, dy) {
    this.flight = null;
    this.x -= dx / this.zoom; this.y -= dy / this.zoom;
    this.clampView();
   }

  flyTo(x, y, zoom, ms = 550) {
    this.flight = { x0: this.x, y0: this.y, z0: this.zoom, x1: x, y1: y, z1: clamp(zoom, this.minZoom, this.maxZoom), t: 0, ms };
   }

  fit() { this.flyTo(this.fitX, this.fitY, this.fitZoom); }

  update(dt) {
    const f = this.flight;
    if (!f) return;
    f.t += dt * 1000;
    const k = easeOut(Math.min(1, f.t / f.ms));
    this.x = f.x0 + (f.x1 - f.x0) * k;
    this.y = f.y0 + (f.y1 - f.y0) * k;
    this.zoom = f.z0 * Math.pow(f.z1 / f.z0, k);
    if (f.t >= f.ms) this.flight = null;
   }
 }

/** Mouse / touch / trackpad input: drag to pan, wheel or pinch to zoom, tap to select */
export function bindInput(el, camera, h) {
  const pts = new Map();
  let moved = 0, pinch = 0;
  const pos = (e) => { const r = el.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };

  el.addEventListener('pointerdown', (e) => {
    el.setPointerCapture(e.pointerId);
    pts.set(e.pointerId, pos(e));
    if (pts.size === 1) moved = 0;
    if (pts.size === 2) { const [a, b] = [...pts.values()]; pinch = Math.hypot(a.x - b.x, a.y - b.y); moved = 99; }
    el.classList.add('grabbing');
   });

  el.addEventListener('pointermove', (e) => {
    const p = pos(e);
    if (!pts.has(e.pointerId)) { if (e.pointerType === 'mouse') h.onHover?.(p.x, p.y); return; }
    const prev = pts.get(e.pointerId);
    pts.set(e.pointerId, p);
    if (pts.size === 1) {
      const dx = p.x - prev.x, dy = p.y - prev.y;
      moved += Math.abs(dx) + Math.abs(dy);
      if (moved > 5) { camera.panBy(dx, dy); h.onHover?.(null); }
     } else if (pts.size === 2) {
      const [a, b] = [...pts.values()];
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      if (pinch > 0 && d > 0) camera.zoomAt((a.x + b.x) / 2, (a.y + b.y) / 2, d / pinch);
      pinch = d;
      camera.panBy((p.x - prev.x) / 2, (p.y - prev.y) / 2);
      }
   });

  const end = (e) => {
    if (!pts.has(e.pointerId)) return;
    const p = pos(e);
    const wasSingle = pts.size === 1;
    pts.delete(e.pointerId);
    if (pts.size < 2) pinch = 0;
    if (!pts.size) el.classList.remove('grabbing');
    if (e.type === 'pointerup' && wasSingle && moved <= 5) h.onTap?.(p.x, p.y, e.pointerType);
   };
  el.addEventListener('pointerup', end);
  el.addEventListener('pointercancel', end);
  el.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse' && !pts.size) h.onHover?.(null); });

  el.addEventListener('wheel', (e) => {
    e.preventDefault();
    const scale = e.deltaMode === 1 ? 33 : 1;
    const speed = e.ctrlKey ? 0.01 : 0.0016;
    const p = pos(e);
    camera.zoomAt(p.x, p.y, Math.exp(-e.deltaY * scale * speed));
  }, { passive: false });

  el.addEventListener('dblclick', (e) => { const p = pos(e); h.onDouble?.(p.x, p.y); });
}
