// Explosion de pixels (niveau réussi sans faute). Les envahisseurs restent en place.
const POP = ["#FFE14D", "#FF4D8D", "#4DE1FF", "#7CFF6B", "#B98CFF", "#FF8A3D", "#FFFFFF"];
export const STAGGER = 220; // ms entre deux envahisseurs

export function explode(canvas, invaderEls) {
  const dpr = window.devicePixelRatio || 1, W = innerWidth, H = innerHeight;
  canvas.width = W * dpr; canvas.height = H * dpr;
  const ctx = canvas.getContext("2d");
  ctx.scale(dpr, dpr);
  const parts = [], rings = [], flashes = [];

  invaderEls.forEach((d, k) => {
    const t0 = k * STAGGER;
    const b = d.getBoundingClientRect(), cx = b.left + b.width / 2, cy = b.top + b.height / 2, u = b.width;
    setTimeout(() => { d.classList.add("flash"); setTimeout(() => d.classList.remove("flash"), 500); }, t0);
    rings.push({ x: cx, y: cy, r: u * 0.2, max: u * 2.2, t0, life: 1 });
    flashes.push({ x: cx, y: cy, u, t0 });
    for (let n = 0; n < 70; n++) {
      const a = Math.random() * Math.PI * 2, v = 0.8 + Math.random() * 3.6;
      parts.push({ x: cx, y: cy, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 1.6,
        s: Math.max(4, u * (0.06 + Math.random() * 0.08)), c: POP[n % POP.length],
        life: 1, decay: 0.0045 + Math.random() * 0.004, t0, twinkle: Math.random() < 0.35 });
    }
  });

  const start = performance.now();
  (function frame(now) {
    const t = now - start;
    ctx.clearRect(0, 0, W, H);
    let alive = 0;
    for (const f of flashes) {
      const dt = t - f.t0;
      if (dt < 0 || dt > 260) continue;
      alive++;
      ctx.globalAlpha = (1 - dt / 260) * 0.9; ctx.fillStyle = "#FFFFFF";
      const r = f.u * (0.6 + (dt / 260) * 0.8);
      ctx.fillRect(Math.round(f.x - r), Math.round(f.y - r), Math.round(r * 2), Math.round(r * 2));
    }
    for (const g of rings) {
      if (t < g.t0 || g.life <= 0) continue;
      alive++;
      g.r += (g.max - g.r) * 0.06; g.life -= 0.018;
      ctx.globalAlpha = Math.max(0, g.life); ctx.fillStyle = "#FFE14D";
      const step = Math.max(4, g.max * 0.07);
      for (let a = 0; a < Math.PI * 2; a += Math.PI / 14) {
        ctx.fillRect(Math.round(g.x + Math.cos(a) * g.r - step / 2), Math.round(g.y + Math.sin(a) * g.r - step / 2), step, step);
      }
    }
    for (const p of parts) {
      if (t < p.t0) { alive++; continue; }
      if (p.life <= 0) continue;
      alive++;
      p.x += p.vx; p.y += p.vy; p.vy += 0.045; p.vx *= 0.992; p.life -= p.decay;
      const dim = p.twinkle && Math.floor(t / 90) % 2;
      ctx.globalAlpha = Math.max(0, Math.min(1, p.life * 1.4)) * (dim ? 0.35 : 1);
      ctx.fillStyle = p.c;
      ctx.fillRect(Math.round(p.x), Math.round(p.y), Math.ceil(p.s), Math.ceil(p.s));
    }
    ctx.globalAlpha = 1;
    if (alive) requestAnimationFrame(frame); else ctx.clearRect(0, 0, W, H);
  })(start);

  return Math.min(4200, 2600 + invaderEls.length * STAGGER); // durée conseillée avant d'afficher la suite
}
