/* =========================================================
   ✨ 파티클 & 폭죽 이펙트 (Canvas)
   ========================================================= */
import { sfx } from './audio.js';

const cvs = document.getElementById("fx-canvas");
const ctx = cvs.getContext("2d");
let W = 0, H = 0, DPR = 1;
let parts = [], rockets = [], raf = null, shows = 0;

const PALETTE = ["#ff8fd8", "#8ff3ff", "#fff38f", "#b79bff", "#9dffb0", "#ffb38f", "#ffffff", "#7cf9ff", "#ff7ad9"];
const pick = (a) => a[(Math.random() * a.length) | 0];
const rand = (a, b) => a + Math.random() * (b - a);

function resize() {
  DPR = Math.min(window.devicePixelRatio || 1, 2);
  W = window.innerWidth; H = window.innerHeight;
  cvs.width = W * DPR; cvs.height = H * DPR;
  cvs.style.width = W + "px"; cvs.style.height = H + "px";
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
}
window.addEventListener("resize", resize);
resize();

function kick() { if (!raf) raf = requestAnimationFrame(tick); }

function add(p) {
  if (parts.length > 1800) parts.shift();
  parts.push(p); kick();
}

function drawStar(x, y, r, rot) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = rot + (i * Math.PI) / 5;
    const rr = i % 2 ? r * 0.45 : r;
    ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
  }
  ctx.closePath(); ctx.fill();
}
function drawHeart(x, y, r, rot) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(r / 10, r / 10);
  ctx.beginPath(); ctx.moveTo(0, 3);
  ctx.bezierCurveTo(-10, -5, -5, -13, 0, -6);
  ctx.bezierCurveTo(5, -13, 10, -5, 0, 3);
  ctx.fill(); ctx.restore();
}

function tick() {
  ctx.clearRect(0, 0, W, H);

  // 로켓(폭죽 꼬리)
  for (let i = rockets.length - 1; i >= 0; i--) {
    const r = rockets[i];
    r.px = r.x; r.py = r.y;
    r.x += r.vx; r.y += r.vy; r.vy += 0.16;
    ctx.globalCompositeOperation = "lighter";
    ctx.strokeStyle = r.color; ctx.lineWidth = 3; ctx.globalAlpha = 0.9;
    ctx.beginPath(); ctx.moveTo(r.px, r.py + 10); ctx.lineTo(r.x, r.y); ctx.stroke();
    if (Math.random() < 0.6) add({ x: r.x, y: r.y, vx: rand(-0.5, 0.5), vy: rand(0, 1), life: 22, max: 22, size: 2, color: "#fff6c8", shape: "circle", g: 0.02, glow: true });
    if (r.vy >= -0.6) { explode(r.x, r.y, r.color); rockets.splice(i, 1); }
  }

  for (let i = parts.length - 1; i >= 0; i--) {
    const p = parts[i];
    p.life--;
    if (p.life <= 0) { parts.splice(i, 1); continue; }
    p.vx *= p.drag ?? 0.985; p.vy *= p.drag ?? 0.985;
    p.vy += p.g ?? 0.1;
    if (p.sway) p.vx += Math.sin((p.life + p.seed) * 0.12) * p.sway;
    p.x += p.vx; p.y += p.vy;
    p.rot = (p.rot || 0) + (p.vr || 0);
    const a = Math.max(0, p.life / p.max);
    ctx.globalAlpha = p.fade === false ? 1 : a;
    ctx.globalCompositeOperation = p.glow ? "lighter" : "source-over";
    ctx.fillStyle = p.color;

    switch (p.shape) {
      case "star": drawStar(p.x, p.y, p.size, p.rot); break;
      case "heart": drawHeart(p.x, p.y, p.size, p.rot); break;
      case "confetti":
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot);
        ctx.scale(1, Math.cos(p.life * 0.25 + p.seed));
        ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2); ctx.restore(); break;
      case "ring":
        p.r += p.dr;
        ctx.strokeStyle = p.color; ctx.lineWidth = Math.max(0.5, 6 * a);
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.stroke(); break;
      case "spark":
        ctx.strokeStyle = p.color; ctx.lineWidth = p.size * a + 0.5; ctx.lineCap = "round";
        ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x - p.vx * 3, p.y - p.vy * 3); ctx.stroke(); break;
      default:
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size * (0.4 + 0.6 * a), 0, Math.PI * 2); ctx.fill();
    }
  }
  ctx.globalAlpha = 1; ctx.globalCompositeOperation = "source-over";

  if (parts.length || rockets.length || shows > 0) raf = requestAnimationFrame(tick);
  else { raf = null; ctx.clearRect(0, 0, W, H); }
}

function explode(x, y, base) {
  sfx.pop();
  const n = 70 + ((Math.random() * 40) | 0);
  const colors = [base, pick(PALETTE), "#ffffff"];
  const sp = rand(4.5, 7);
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + rand(-0.05, 0.05);
    const s = sp * rand(0.75, 1.05);
    add({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: rand(50, 80), max: 80, size: 2.4, color: pick(colors), shape: "spark", g: 0.06, drag: 0.965, glow: true });
  }
  for (let i = 0; i < 24; i++) {
    add({ x, y, vx: rand(-2, 2), vy: rand(-2, 2), life: rand(60, 100), max: 100, size: rand(1.5, 3), color: "#fff9d6", shape: "circle", g: 0.03, drag: 0.97, glow: true });
  }
  add({ x, y, r: 6, dr: 5, life: 26, max: 26, color: base, shape: "ring", g: 0, vx: 0, vy: 0, glow: true });
}

export const fx = {
  /* 한 지점에서 팡! 터지는 반짝이 */
  burst(x, y, { count = 60, speed = 7, colors = PALETTE, shapes = ["star", "circle", "heart"], g = 0.14, life = 70 } = {}) {
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2, s = rand(speed * 0.3, speed);
      add({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 2, life: rand(life * 0.6, life), max: life, size: rand(3, 8), color: pick(colors), shape: pick(shapes), g, rot: rand(0, 6), vr: rand(-0.2, 0.2), glow: true });
    }
    add({ x, y, r: 8, dr: 6, life: 22, max: 22, color: "#ffffff", shape: "ring", g: 0, vx: 0, vy: 0, glow: true });
  },

  /* 화면 위에서 쏟아지는 색종이 */
  confetti(count = 160) {
    for (let i = 0; i < count; i++) {
      add({ x: rand(0, W), y: rand(-H * 0.4, -10), vx: rand(-2, 2), vy: rand(2, 5), life: rand(160, 260), max: 260, size: rand(8, 14), color: pick(PALETTE.slice(0, 6)), shape: pick(["confetti", "confetti", "heart", "star"]), g: 0.04, drag: 0.995, rot: rand(0, 6), vr: rand(-0.15, 0.15), sway: 0.06, seed: rand(0, 100), fade: false });
    }
  },

  /* 화면 중앙으로 빨려드는 빛 (진화 충전) */
  converge(cx, cy, count = 80) {
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2, d = rand(220, Math.max(W, H) * 0.6);
      const x = cx + Math.cos(a) * d, y = cy + Math.sin(a) * d;
      const life = rand(40, 70);
      add({ x, y, vx: (cx - x) / life, vy: (cy - y) / life, life, max: life, size: rand(2, 4), color: pick(PALETTE), shape: "circle", g: 0, drag: 1, glow: true });
    }
  },

  rocket(x) {
    rockets.push({ x: x ?? rand(W * 0.15, W * 0.85), y: H + 10, vx: rand(-1.2, 1.2), vy: -rand(H / 70, H / 52), color: pick(PALETTE) });
    kick();
  },

  /* 폭죽 쇼 (ms 동안) */
  fireworks(duration = 4000, every = 260) {
    shows++; kick();
    const id = setInterval(() => { fx.rocket(); if (Math.random() < 0.4) fx.rocket(); }, every);
    setTimeout(() => { clearInterval(id); shows--; }, duration);
  },

  clear() { parts = []; rockets = []; }
};
