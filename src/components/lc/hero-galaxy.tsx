"use client";

import { useEffect, useRef } from "react";

/* ───────────────────────────────────────────────────────────────────────────
   Latar galaksi hero Leetcloud (kanvas, hanya mengisi hero):
   - planet gas raksasa prosedural yang BERPUTAR (pemetaan bola), terminator siang/malam,
     atmosfer, cincin 3D (belakang & depan planet), bulan yang mengorbit
   - bintang 3 lapis kedalaman (warna suhu alami, pendar, kelip lembut, melaju pelan)
   - nebula lembut, meteor sesekali
   - interaktif: parallax kursor, garis "rasi" kursor→bintang terdekat, klik/tap = riak + meteor
   Berhenti saat tak terlihat / tab tak aktif; satu bingkai statis bila prefers-reduced-motion.
   ─────────────────────────────────────────────────────────────────────────── */

type Star = { x: number; y: number; r: number; a: number; tw: number; ph: number; col: string; layer: 0 | 1 | 2; glow: number };
type Meteor = { x: number; y: number; vx: number; vy: number; life: number; max: number; w: number };
type Ripple = { x: number; y: number; t: number };

const LAYER = [
  { depth: 0.15, drift: 0.004 },
  { depth: 0.45, drift: 0.009 },
  { depth: 1.0, drift: 0.018 },
] as const;

/* ── noise 3D sederhana (value noise) untuk tekstur planet & nebula ── */
function makeNoise(seed: number) {
  const p = new Uint8Array(512);
  const perm = Array.from({ length: 256 }, (_, i) => i);
  let s = seed;
  const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  for (let i = 255; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [perm[i], perm[j]] = [perm[j]!, perm[i]!]; }
  for (let i = 0; i < 512; i++) p[i] = perm[i & 255]!;
  const val = new Float32Array(256).map(() => rnd());
  const h = (x: number, y: number, z: number) => val[p[p[p[x & 255]! + (y & 255)]! + (z & 255)]!]!;
  const sm = (t: number) => t * t * (3 - 2 * t);
  const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
  const n3 = (x: number, y: number, z: number) => {
    const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
    const xf = sm(x - xi), yf = sm(y - yi), zf = sm(z - zi);
    return lerp(
      lerp(lerp(h(xi, yi, zi), h(xi + 1, yi, zi), xf), lerp(h(xi, yi + 1, zi), h(xi + 1, yi + 1, zi), xf), yf),
      lerp(lerp(h(xi, yi, zi + 1), h(xi + 1, yi, zi + 1), xf), lerp(h(xi, yi + 1, zi + 1), h(xi + 1, yi + 1, zi + 1), xf), yf),
      zf,
    );
  };
  return (x: number, y: number, z: number, oct = 4) => {
    let a = 0.5, f = 1, sum = 0, norm = 0;
    for (let i = 0; i < oct; i++) { sum += a * n3(x * f, y * f, z * f); norm += a; a *= 0.5; f *= 2; }
    return sum / norm;
  };
}

const hex = (c: string) => [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)] as const;

/** Tekstur permukaan planet (lebar 2× agar mudah dibungkus). Baris sudah dikompresi lintang (asin) → tampak bulat. */
function planetTexture(): HTMLCanvasElement {
  const W = 512, H = 256;
  const noise = makeNoise(1337);
  const pal = ["#120a3a", "#2a1470", "#4c1d95", "#7c3aed", "#b03ad8", "#e04fd0", "#6d28d9", "#22b8d6", "#3b1a8a", "#1a0f4d"].map(hex);
  const img = new ImageData(W, H);
  for (let y = 0; y < H; y++) {
    const lat = Math.asin((y / (H - 1)) * 2 - 1) / (Math.PI / 2); // -1..1
    for (let x = 0; x < W; x++) {
      const ang = (x / W) * Math.PI * 2;
      const nx = Math.cos(ang) * 1.6, nz = Math.sin(ang) * 1.6;
      const turb = noise(nx, lat * 3.2, nz, 5);
      const fine = noise(nx * 4, lat * 14, nz * 4, 3);
      let band = lat * 7.5 + 20 + (turb - 0.5) * 1.15 + (fine - 0.5) * 0.35;
      // badai oval
      const dx = ((ang - 2.2 + Math.PI * 3) % (Math.PI * 2)) - Math.PI, dy = (lat - 0.28) * 3.4;
      const storm = Math.max(0, 1 - Math.sqrt(dx * dx * 2.2 + dy * dy) * 2.4);
      band += storm * Math.sin(Math.atan2(dy, dx) * 2 + storm * 6) * 1.2;
      const b = ((band % pal.length) + pal.length) % pal.length;
      const i0 = Math.floor(b), t = b - i0;
      const c0 = pal[i0]!, c1 = pal[(i0 + 1) % pal.length]!;
      const lum = 0.82 + fine * 0.36 + storm * 0.35;
      const o = (y * W + x) * 4;
      img.data[o] = Math.min(255, (c0[0] + (c1[0] - c0[0]) * t) * lum);
      img.data[o + 1] = Math.min(255, (c0[1] + (c1[1] - c0[1]) * t) * lum);
      img.data[o + 2] = Math.min(255, (c0[2] + (c1[2] - c0[2]) * t) * lum);
      img.data[o + 3] = 255;
    }
  }
  const c = document.createElement("canvas");
  c.width = W * 2; c.height = H;
  const g = c.getContext("2d")!;
  g.putImageData(img, 0, 0); g.putImageData(img, W, 0);
  return c;
}

/** Awan nebula (dirender sekali, lalu digeser pelan). */
function nebulaTexture(w: number, h: number): HTMLCanvasElement {
  const c = document.createElement("canvas");
  const sc = 0.25; // resolusi rendah, akan diperhalus saat digambar
  c.width = Math.max(2, Math.round(w * sc)); c.height = Math.max(2, Math.round(h * sc));
  const g = c.getContext("2d")!;
  const noise = makeNoise(42);
  const img = g.createImageData(c.width, c.height);
  const cols = [[124, 58, 237], [0, 200, 230], [230, 60, 210]] as const;
  for (let y = 0; y < c.height; y++) {
    for (let x = 0; x < c.width; x++) {
      const u = x / c.width, v = y / c.height;
      const n = noise(u * 3, v * 3, 0.5, 5);
      const m = noise(u * 2 + 9, v * 2 + 3, 1.7, 4);
      const k0 = Math.min(1, Math.max(0, (n - 0.46) / 0.3));
      const k = k0 * k0 * (3 - 2 * k0);
      const mix = m < 0.45 ? 0 : m < 0.58 ? 1 : 2;
      const col = cols[mix]!;
      const o = (y * c.width + x) * 4;
      img.data[o] = col[0]; img.data[o + 1] = col[1]; img.data[o + 2] = col[2];
      img.data[o + 3] = Math.round(k * 78);
    }
  }
  g.putImageData(img, 0, 0);
  // perbesar ke ukuran penuh (+ ruang parallax) dengan blur → tanpa tepi kotak-kotak
  const big = document.createElement("canvas");
  big.width = Math.round(w + 80); big.height = Math.round(h + 60);
  const bg = big.getContext("2d")!;
  bg.filter = "blur(28px)";
  bg.imageSmoothingQuality = "high";
  bg.drawImage(c, -20, -20, big.width + 40, big.height + 40);
  return big;
}

/** Sprite pendar bintang (dipakai berulang, murah). */
function glowSprite(rgb: string): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = c.height = 64;
  const g = c.getContext("2d")!;
  const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, `rgba(${rgb},0.9)`); gr.addColorStop(0.15, `rgba(${rgb},0.35)`); gr.addColorStop(1, `rgba(${rgb},0)`);
  g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
  return c;
}

const STAR_COLS = [
  { w: 46, c: "#e8eeff", rgb: "232,238,255" },
  { w: 22, c: "#bcd4ff", rgb: "188,212,255" },
  { w: 14, c: "#fff1d6", rgb: "255,241,214" },
  { w: 8, c: "#ffd7a8", rgb: "255,215,168" },
  { w: 6, c: "#7df9ff", rgb: "125,249,255" },
  { w: 4, c: "#ff9ef0", rgb: "255,158,240" },
];
const pickCol = () => {
  let r = Math.random() * 100;
  for (const s of STAR_COLS) { if ((r -= s.w) <= 0) return s; }
  return STAR_COLS[0]!;
};

export function HeroGalaxy() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const host = canvas?.parentElement;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !host || !ctx) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const tex = planetTexture();
    const TW = tex.width / 2, TH = tex.height;
    const sprites = new Map(STAR_COLS.map((s) => [s.c, glowSprite(s.rgb)]));
    let nebula: HTMLCanvasElement | null = null;

    let w = 0, h = 0, raf = 0, last = 0, visible = true, lastMeteor = 0;
    let stars: Star[] = [];
    let meteors: Meteor[] = [];
    const ripples: Ripple[] = [];
    let rot = 0, moonA = 1.2, time = 0;
    const target = { x: 0, y: 0 }, cur = { x: 0, y: 0 };
    const ptr = { x: -9999, y: -9999, in: false };

    const resize = () => {
      const r = host.getBoundingClientRect();
      w = r.width; h = r.height;
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
      canvas.style.width = `${w}px`; canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const area = w * h;
      const n = [Math.min(420, area / 2600), Math.min(140, area / 8000), Math.min(45, area / 26000)];
      stars = [];
      n.forEach((cnt, layer) => {
        for (let i = 0; i < cnt; i++) {
          const col = pickCol();
          const big = layer === 2 ? Math.random() * 1.2 + 0.9 : layer === 1 ? Math.random() * 0.8 + 0.5 : Math.random() * 0.5 + 0.25;
          stars.push({
            x: Math.random() * w, y: Math.random() * h, r: big, a: layer === 0 ? Math.random() * 0.4 + 0.25 : Math.random() * 0.4 + 0.5,
            tw: Math.random() * 1.4 + 0.4, ph: Math.random() * Math.PI * 2, col: col.c, layer: layer as 0 | 1 | 2,
            glow: layer === 2 && Math.random() < 0.6 ? Math.random() * 10 + 8 : layer === 1 && Math.random() < 0.12 ? 7 : 0,
          });
        }
      });
      nebula = nebulaTexture(w, h);
    };

    /* ── planet ── */
    const P = () => {
      const r = Math.min(w, h) * (w < 640 ? 0.1 : 0.135);
      return { r, cx: w * (w < 640 ? 0.86 : 0.87), cy: h * (w < 640 ? 0.1 : 0.27) };
    };
    const TILT = -0.38, RY = 0.27;

    const ringPass = (cx: number, cy: number, r: number, front: boolean) => {
      ctx.save();
      ctx.translate(cx, cy); ctx.rotate(TILT); ctx.scale(1, RY);
      const inner = r * 1.32, outer = r * 2.25, N = 46;
      for (let i = 0; i < N; i++) {
        const t = i / (N - 1);
        const rr = inner + (outer - inner) * t;
        // profil kerapatan: celah di ~0.38 dan ~0.72
        const dens = (0.35 + 0.65 * Math.sin(t * Math.PI)) * (Math.abs(t - 0.38) < 0.03 ? 0.08 : 1) * (Math.abs(t - 0.72) < 0.02 ? 0.25 : 1);
        const hue = t < 0.45 ? `150,235,255` : `214,178,255`;
        const grain = 0.75 + 0.25 * Math.sin(i * 2.7);
        ctx.strokeStyle = `rgba(${hue},${(front ? 0.3 : 0.2) * dens * grain})`;
        ctx.lineWidth = ((outer - inner) / N) * 1.15;
        ctx.beginPath();
        // depan = setengah bawah elips (0..π), belakang = setengah atas (π..2π)
        if (front) ctx.arc(0, 0, rr, 0, Math.PI); else ctx.arc(0, 0, rr, Math.PI, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();
    };

    const moon = (cx: number, cy: number, r: number, front: boolean) => {
      const orbit = r * 2.9;
      const z = Math.sin(moonA);
      if ((z > 0) !== front) return;
      // posisi pada elips orbit yang dimiringkan sama dengan cincin
      const ex = Math.cos(moonA) * orbit, ey = Math.sin(moonA) * orbit * RY;
      const mx = cx + ex * Math.cos(TILT) - ey * Math.sin(TILT), my = cy + ex * Math.sin(TILT) + ey * Math.cos(TILT);
      const mr = r * 0.15 * (0.9 + z * 0.1);
      const g = ctx.createRadialGradient(mx - mr * 0.4, my - mr * 0.4, mr * 0.1, mx, my, mr);
      g.addColorStop(0, "#e6e0ff"); g.addColorStop(0.55, "#8a7fb8"); g.addColorStop(1, "#231c42");
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(mx, my, mr, 0, Math.PI * 2); ctx.fill();
    };

    const planet = (ox: number, oy: number) => {
      const { r, cx: bx, cy: by } = P();
      const cx = bx + ox * 26, cy = by + oy * 16 + Math.sin(time / 4200) * 5;

      // pendar ungu jauh
      const halo = ctx.createRadialGradient(cx, cy, r * 0.8, cx, cy, r * 3.2);
      halo.addColorStop(0, "rgba(124,58,237,0.20)"); halo.addColorStop(1, "rgba(124,58,237,0)");
      ctx.fillStyle = halo; ctx.beginPath(); ctx.arc(cx, cy, r * 3.2, 0, Math.PI * 2); ctx.fill();

      moon(cx, cy, r, false);
      ringPass(cx, cy, r, false);

      const body = planetBody(r);
      const half = body.width / dpr / 2;
      ctx.drawImage(body, cx - half, cy - half, half * 2, half * 2);

      ringPass(cx, cy, r, true);
      moon(cx, cy, r, true);
    };

    let bodyCache: HTMLCanvasElement | null = null, bodyRot = -1, bodyR = 0;
    function planetBody(r: number) {
      if (bodyCache && bodyR === r && Math.abs(rot - bodyRot) < 0.0009) return bodyCache;
      const pad = r * 0.2, size = Math.ceil((r + pad) * 2);
      if (!bodyCache || bodyR !== r) { bodyCache = document.createElement("canvas"); bodyCache.width = bodyCache.height = Math.ceil(size * dpr); }
      bodyR = r; bodyRot = rot;
      const g = bodyCache.getContext("2d")!;
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      g.clearRect(0, 0, size, size);
      const cx = size / 2, cy = size / 2;
      surface(g, cx, cy, r);
      return bodyCache;
    }

    function surface(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
      // permukaan berputar: strip vertikal dipetakan bujur = asin(x) → efek bola
      ctx.save();
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.clip();
      const S = Math.max(40, Math.ceil(r));
      const sw = (2 * r) / S;
      for (let i = 0; i < S; i++) {
        const x0 = (i / S) * 2 - 1, x1 = ((i + 1) / S) * 2 - 1;
        const u0 = ((Math.asin(x0) / Math.PI + 0.5) * 0.5 + rot) % 1;
        const du = ((Math.asin(x1) - Math.asin(x0)) / Math.PI) * 0.5;
        ctx.drawImage(tex, u0 * TW, 0, Math.max(0.5, du * TW), TH, cx - r + i * sw, cy - r, sw + 0.6, 2 * r);
      }
      // terminator (cahaya dari kiri-atas)
      const sh = ctx.createRadialGradient(cx - r * 0.55, cy - r * 0.45, r * 0.15, cx - r * 0.2, cy - r * 0.1, r * 1.55);
      sh.addColorStop(0, "rgba(255,255,255,0.10)"); sh.addColorStop(0.45, "rgba(0,0,0,0)"); sh.addColorStop(0.72, "rgba(4,2,16,0.78)"); sh.addColorStop(1, "rgba(2,1,8,0.97)");
      ctx.fillStyle = sh; ctx.fillRect(cx - r, cy - r, 2 * r, 2 * r);
      // penggelapan tepi
      const limb = ctx.createRadialGradient(cx, cy, r * 0.62, cx, cy, r);
      limb.addColorStop(0, "rgba(0,0,0,0)"); limb.addColorStop(1, "rgba(0,0,0,0.5)");
      ctx.fillStyle = limb; ctx.fillRect(cx - r, cy - r, 2 * r, 2 * r);
      ctx.restore();

      // atmosfer: pendar hanya di sisi yang terkena cahaya (kiri-atas), memudar ke sisi malam
      const size = Math.ceil(r * 2.6);
      const tmp = document.createElement("canvas");
      tmp.width = tmp.height = Math.ceil(size * dpr);
      const a = tmp.getContext("2d")!;
      a.setTransform(dpr, 0, 0, dpr, 0, 0);
      const tc = size / 2;
      const atm = a.createRadialGradient(tc, tc, r * 0.97, tc, tc, r * 1.2);
      atm.addColorStop(0, "rgba(140,245,255,0.75)"); atm.addColorStop(0.3, "rgba(150,120,255,0.3)"); atm.addColorStop(1, "rgba(150,110,255,0)");
      a.fillStyle = atm;
      a.beginPath(); a.arc(tc, tc, r * 1.2, 0, Math.PI * 2); a.arc(tc, tc, r * 0.97, 0, Math.PI * 2, true); a.fill("evenodd");
      a.globalCompositeOperation = "destination-in";
      const lit = a.createLinearGradient(tc - r * 0.9, tc - r * 0.8, tc + r * 0.7, tc + r * 0.8);
      lit.addColorStop(0, "rgba(0,0,0,1)"); lit.addColorStop(0.55, "rgba(0,0,0,0.35)"); lit.addColorStop(1, "rgba(0,0,0,0.04)");
      a.fillStyle = lit; a.fillRect(0, 0, size, size);
      ctx.drawImage(tmp, cx - tc, cy - tc, size, size);
    }

    /* ── frame ── */
    const draw = (now: number) => {
      const dt = Math.min(50, last ? now - last : 16); last = now; time = now;
      if (!reduced) { rot = (rot + dt * 0.0000105) % 1; moonA = (moonA + dt * 0.00022) % (Math.PI * 2); }
      cur.x += (target.x - cur.x) * 0.05; cur.y += (target.y - cur.y) * 0.05;
      ctx.clearRect(0, 0, w, h);

      // nebula
      if (nebula) {
        ctx.save();
        ctx.globalAlpha = 0.9;
        const nx = cur.x * -10 + Math.sin(now / 20000) * 20, ny = cur.y * -6;
        ctx.drawImage(nebula, nx - 40, ny - 30);
        ctx.restore();
      }

      // bintang
      const near: { s: Star; x: number; y: number; d: number }[] = [];
      for (const s of stars) {
        const L = LAYER[s.layer];
        if (!reduced) { s.x -= L.drift * dt; if (s.x < -10) { s.x = w + 10; s.y = Math.random() * h; } }
        const x = s.x + cur.x * 34 * L.depth, y = s.y + cur.y * 22 * L.depth;
        let a = s.a * (reduced ? 1 : 0.72 + 0.28 * Math.sin((now / 1000) * s.tw + s.ph));
        if (ptr.in && s.layer > 0) {
          const d = Math.hypot(x - ptr.x, y - ptr.y);
          if (d < 160) { a = Math.min(1, a + (1 - d / 160) * 0.6); near.push({ s, x, y, d }); }
        }
        if (s.glow) {
          const g = s.glow * (0.8 + 0.2 * a);
          ctx.globalAlpha = a * 0.75;
          ctx.drawImage(sprites.get(s.col)!, x - g, y - g, g * 2, g * 2);
        }
        ctx.globalAlpha = a;
        ctx.fillStyle = s.col;
        if (s.layer === 0) ctx.fillRect(x - s.r, y - s.r, s.r * 2, s.r * 2);
        else { ctx.beginPath(); ctx.arc(x, y, s.r, 0, Math.PI * 2); ctx.fill(); }
      }
      ctx.globalAlpha = 1;

      // rasi: kursor → bintang terdekat
      if (near.length) {
        near.sort((a, b) => a.d - b.d);
        const pts = near.slice(0, 7);
        ctx.lineWidth = 0.8;
        for (const p of pts) {
          ctx.strokeStyle = `rgba(125,249,255,${(1 - p.d / 160) * 0.45})`;
          ctx.beginPath(); ctx.moveTo(ptr.x, ptr.y); ctx.lineTo(p.x, p.y); ctx.stroke();
        }
        for (let i = 0; i < pts.length - 1; i++) {
          const a = pts[i]!, b = pts[i + 1]!;
          if (Math.hypot(a.x - b.x, a.y - b.y) < 110) {
            ctx.strokeStyle = `rgba(255,120,230,${(1 - a.d / 160) * 0.25})`;
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
          }
        }
      }

      planet(cur.x, cur.y);

      if (!reduced) {
        // meteor
        if (now - lastMeteor > 3500 + Math.random() * 5000) { lastMeteor = now; spawnMeteor(Math.random() * w * 0.8 + w * 0.2, -10); }
        meteors = meteors.filter((m) => m.life < m.max);
        for (const m of meteors) {
          m.life += dt / 16; m.x += m.vx * dt / 16; m.y += m.vy * dt / 16;
          const fade = Math.sin((m.life / m.max) * Math.PI);
          const tx = m.x - m.vx * 18, ty = m.y - m.vy * 18;
          const g = ctx.createLinearGradient(m.x, m.y, tx, ty);
          g.addColorStop(0, `rgba(230,253,255,${0.95 * fade})`); g.addColorStop(0.3, `rgba(125,249,255,${0.45 * fade})`); g.addColorStop(1, "rgba(255,43,214,0)");
          ctx.strokeStyle = g; ctx.lineWidth = m.w; ctx.lineCap = "round";
          ctx.beginPath(); ctx.moveTo(m.x, m.y); ctx.lineTo(tx, ty); ctx.stroke();
          ctx.globalAlpha = fade;
          ctx.drawImage(sprites.get("#7df9ff")!, m.x - 9, m.y - 9, 18, 18);
          ctx.globalAlpha = 1;
        }
        // riak klik
        for (let i = ripples.length - 1; i >= 0; i--) {
          const rp = ripples[i]!;
          rp.t += dt / 900;
          if (rp.t >= 1) { ripples.splice(i, 1); continue; }
          ctx.strokeStyle = `rgba(125,249,255,${(1 - rp.t) * 0.6})`; ctx.lineWidth = 1.5;
          ctx.beginPath(); ctx.arc(rp.x, rp.y, 6 + rp.t * 70, 0, Math.PI * 2); ctx.stroke();
          ctx.strokeStyle = `rgba(255,120,230,${(1 - rp.t) * 0.35})`;
          ctx.beginPath(); ctx.arc(rp.x, rp.y, 3 + rp.t * 40, 0, Math.PI * 2); ctx.stroke();
        }
      }

      if (visible && !reduced) raf = requestAnimationFrame(draw);
    };

    function spawnMeteor(x: number, y: number) {
      const sp = 3.2 + Math.random() * 2.4;
      const ang = Math.PI * (0.72 + Math.random() * 0.08); // ke kiri-bawah
      meteors.push({ x, y, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp, life: 0, max: 55 + Math.random() * 35, w: 1.4 + Math.random() * 1.2 });
    }

    const start = () => { cancelAnimationFrame(raf); last = 0; raf = requestAnimationFrame(draw); };
    const local = (e: PointerEvent) => { const r = host.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top, r }; };
    const onMove = (e: PointerEvent) => {
      const { x, y, r } = local(e);
      ptr.x = x; ptr.y = y; ptr.in = true;
      target.x = (x / r.width) * 2 - 1; target.y = (y / r.height) * 2 - 1;
    };
    const onLeave = () => { target.x = 0; target.y = 0; ptr.in = false; };
    const onDown = (e: PointerEvent) => {
      const { x, y } = local(e);
      ripples.push({ x, y, t: 0 });
      spawnMeteor(x + 40, y - 30);
      if (e.pointerType !== "mouse") { ptr.x = x; ptr.y = y; ptr.in = true; setTimeout(() => { ptr.in = false; }, 1200); }
    };
    const io = new IntersectionObserver(([en]) => { visible = !!en?.isIntersecting && !document.hidden; if (visible && !reduced) start(); });
    const onVis = () => { visible = !document.hidden; if (visible && !reduced) start(); };
    const ro = new ResizeObserver(() => { resize(); if (reduced) draw(performance.now()); });

    resize();
    ro.observe(host);
    io.observe(host);
    document.addEventListener("visibilitychange", onVis);
    if (!reduced) {
      host.addEventListener("pointermove", onMove);
      host.addEventListener("pointerleave", onLeave);
      host.addEventListener("pointerdown", onDown);
    }
    if (reduced) draw(performance.now()); else start();
    return () => {
      cancelAnimationFrame(raf); ro.disconnect(); io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      host.removeEventListener("pointermove", onMove); host.removeEventListener("pointerleave", onLeave); host.removeEventListener("pointerdown", onDown);
    };
  }, []);

  return <canvas ref={ref} aria-hidden className="hero-bg pointer-events-none absolute inset-0" />;
}
