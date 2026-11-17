// Notas musicales que suben por la pantalla. setRate() controla cuántas salen por segundo.
import { COLORS } from './config.js';
const GLYPHS = ['♪', '♫', '♩', '♬'];
export function startFx(canvas) {
  const cx = canvas.getContext('2d');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let parts = [], rate = 0, acc = 0, last = performance.now();
  const resize = () => { canvas.width = innerWidth * devicePixelRatio; canvas.height = innerHeight * devicePixelRatio; };
  addEventListener('resize', resize); resize();
  function spawn(color, fast = 1, y = innerHeight + 30) {
    parts.push({ x: Math.random() * innerWidth, y, vx: (Math.random() - 0.5) * 40, vy: -(60 + Math.random() * 90) * fast,
      r: (Math.random() - 0.5) * 2, a: 0, s: 22 + Math.random() * 30, g: GLYPHS[(Math.random() * 4) | 0],
      c: color || COLORS[(Math.random() * 5) | 0], life: 0 });
  }
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    if (!reduce) { acc += rate * dt; while (acc >= 1) { spawn(null, 1 + rate / 25); acc--; } }
    cx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
    cx.clearRect(0, 0, innerWidth, innerHeight);
    parts = parts.filter((p) => p.y > -60 && p.life < 8);
    for (const p of parts) {
      p.life += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.a += p.r * dt;
      cx.save(); cx.translate(p.x, p.y); cx.rotate(p.a); cx.globalAlpha = Math.min(1, p.life * 3);
      cx.fillStyle = p.c; cx.font = `${p.s}px serif`; cx.textAlign = 'center'; cx.fillText(p.g, 0, 0); cx.restore();
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  return {
    setRate: (r) => { rate = r; },
    clear: () => { parts = []; },
    burst: (n, color) => { for (let i = 0; i < n; i++) spawn(color, 2.2, innerHeight * (0.3 + Math.random() * 0.5)); }
  };
}
