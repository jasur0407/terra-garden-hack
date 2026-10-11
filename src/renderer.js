import { buildTerrain } from './terrain.js';

export class Renderer {
  constructor(canvas, farm, camera) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.farm = farm; this.camera = camera;
    this.terrain = buildTerrain(farm);
    this.dpr = 1;
    this.last = performance.now();
  }

  resize() {
    const r = this.canvas.getBoundingClientRect();
    this.dpr = Math.min(window.devicePixelRatio || 1, 3);
    this.canvas.width = Math.max(1, Math.round(r.width * this.dpr));
    this.canvas.height = Math.max(1, Math.round(r.height * this.dpr));
    this.camera.resize(r.width, r.height);
    this.vw = r.width; this.vh = r.height;
  }

  frame(now) {
    const dt = Math.min(0.05, (now - this.last) / 1000);
    this.last = now;
    const { ctx, camera, dpr } = this;
    camera.update(dt);

    // outside-the-world colour
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#1f3524';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // scale by zoom, shift so the camera centre is mid-screen
    const z = camera.zoom * dpr;
    ctx.setTransform(z, 0, 0, z,
      Math.round((this.vw / 2 - camera.x * camera.zoom) * dpr),
      Math.round((this.vh / 2 - camera.y * camera.zoom) * dpr));
    ctx.imageSmoothingEnabled = false;

    ctx.drawImage(this.terrain.canvas, 0, 0);
    this.drawWater(now);
  }

  drawWater(now) {
    const { ctx } = this;
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    this.terrain.pond.forEach((t, i) => {
      const k = (now / 700 + i * 0.37) % 1;
      ctx.fillRect(t.x + 2 + ((k * 10) | 0), t.y + 4 + ((i * 5) % 8), 3, 1);
    });
  }
}
