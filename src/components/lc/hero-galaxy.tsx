"use client";

import { useEffect, useRef } from "react";
import {
  GAS, ROCK, backdropWidth, drawBlackHole, galaxyTexture, gasTexture, glowSprite, pick, rand, rockTexture, skyBackdrop,
  type GasPal, type RockPal,
} from "./cosmos";

/* ───────────────────────────────────────────────────────────────────────────
   Latar angkasa hero Leetcloud (kanvas, hanya mengisi hero).
   SETIAP HALAMAN DIBUKA komposisinya diacak: warna & jenis planet, ada/tidaknya cincin & bulan,
   bentuk galaksi, warna nebula, arah Bima Sakti, posisi semua benda.
   Semua benda melayang ke kiri dengan kecepatan sesuai jaraknya (parallax), lalu muncul lagi dari kanan:
   latar nebula+Bima Sakti → galaksi jauh → bintang → lubang hitam → planet kecil → planet utama → asteroid,
   ditambah komet berekor & meteor sesekali.
   Interaktif: parallax kursor, garis rasi kursor/jari → bintang terdekat (aktif selama jari menempel),
   asteroid menghindar dari kursor, klik/tap = riak + meteor (kadang komet).
   Berhenti saat tak terlihat / tab tak aktif; satu bingkai statis bila prefers-reduced-motion.
   ─────────────────────────────────────────────────────────────────────────── */

type Star = { x: number; y: number; r: number; a: number; tw: number; ph: number; col: string; layer: 0 | 1 | 2; glow: number };
type Meteor = { x: number; y: number; vx: number; vy: number; life: number; max: number; w: number };
type Ripple = { x: number; y: number; t: number };
type Comet = { x: number; y: number; vx: number; vy: number; len: number; age: number };
type Asteroid = { x: number; y: number; vx: number; vy: number; bvx: number; bvy: number; s: number; rot: number; vr: number; verts: number[]; c1: string; c2: string; depth: number };
type Galaxy = { tex: HTMLCanvasElement; x: number; y: number; vx: number; depth: number; f: number; tilt: number; incl: number; spin: number; alpha: number };
type Hole = { x: number; y: number; vx: number; depth: number; f: number; tilt: number; cache: HTMLCanvasElement | null; t: number; boost: number; r: number };
type Ring = { tilt: number; ry: number; inner: number; outer: number; c1: string; c2: string; gapA: number; gapB: number; alpha: number };
type Planet = {
  tex: HTMLCanvasElement; f: number; x: number; y: number; vx: number; depth: number; bob: number;
  rot: number; spin: number; atm: [string, string] | null; halo: string | null; ring: Ring | null;
  moon: { a: number; speed: number; orbit: number; size: number } | null;
  body: HTMLCanvasElement | null; bodyRot: number; bodyR: number; main: boolean;
};

const LAYER = [
  { depth: 0.15, drift: 0.004 },
  { depth: 0.45, drift: 0.009 },
  { depth: 1.0, drift: 0.018 },
] as const;

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
const ROCK_COLS = [["#d6cfec", "#241f38"], ["#dcc6ad", "#33221a"], ["#bccbe6", "#1b2234"], ["#e2c2e8", "#2c1a33"]] as const;

export function HeroGalaxy() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const host = canvas?.parentElement;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !host || !ctx) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const sprites = new Map(STAR_COLS.map((s) => [s.c, glowSprite(s.rgb)]));
    const comaSprite = glowSprite("190,250,255");

    let w = 0, h = 0, raf = 0, last = 0, visible = true, lastMeteor = 0, nextComet = 0;
    let stars: Star[] = [];
    let meteors: Meteor[] = [];
    let comets: Comet[] = [];
    const ripples: Ripple[] = [];
    let sky: HTMLCanvasElement | null = null, skyW = 0, skyX = 0;
    const target = { x: 0, y: 0 }, cur = { x: 0, y: 0 };
    // ptr.hold = jari/klik sedang menempel → garis rasi aktif terus & makin luas sampai dilepas
    const ptr = { x: -9999, y: -9999, in: false, hold: false, touch: false, reach: 160 };

    const mob = () => w < 640;
    const minWH = () => Math.min(w, h);
    const speed = () => (mob() ? 0.65 : 1);
    /** y acak di pita atas atau bawah hero (tengah dipakai judul). */
    const zoneY = (top: boolean) => h * (top ? rand(0.08, 0.3) : rand(0.7, 0.9));

    /* ── komposisi acak ── */
    const planets: Planet[] = [];
    const galaxies: Galaxy[] = [];
    let hole: Hole | null = null;
    let asteroids: Asteroid[] = [];

    const makeRing = (main: boolean, pal: GasPal | null): Ring => ({
      tilt: rand(-0.55, 0.55), ry: rand(0.2, 0.34), inner: rand(1.25, 1.4), outer: main ? rand(1.9, 2.35) : rand(1.5, 1.8),
      c1: pal?.ring[0] ?? "200,215,255", c2: pal?.ring[1] ?? "220,200,255", gapA: rand(0.3, 0.45), gapB: rand(0.65, 0.8), alpha: main ? 1 : 0.7,
    });

    const makeMain = (): Planet => {
      const pal = pick(GAS);
      const ringed = Math.random() < 0.72;
      return {
        tex: gasTexture(pal), f: mob() ? rand(0.09, 0.115) : rand(0.115, 0.15), x: 0, y: 0, vx: -rand(6, 8), depth: 0.8, bob: rand(0, 6),
        rot: Math.random(), spin: rand(0.8, 1.3) * 0.0000105, atm: pal.atm, halo: pal.halo,
        ring: ringed ? makeRing(true, pal) : null,
        moon: Math.random() < 0.65 ? { a: rand(0, Math.PI * 2), speed: rand(0.00015, 0.00028), orbit: ringed ? rand(2.6, 3.1) : rand(1.8, 2.6), size: rand(0.12, 0.18) } : null,
        body: null, bodyRot: -1, bodyR: 0, main: true,
      };
    };
    const makeSmall = (): Planet => {
      const gas = Math.random() < 0.3;
      const pal: GasPal | RockPal = gas ? pick(GAS) : pick(ROCK);
      const atm: [string, string] | null = gas ? (pal as GasPal).atm : (pal as RockPal).atm ? [(pal as RockPal).atm!, (pal as RockPal).atm!] : null;
      return {
        tex: gas ? gasTexture(pal as GasPal, 256) : rockTexture(pal as RockPal), f: mob() ? rand(0.025, 0.04) : rand(0.022, 0.042), x: 0, y: 0, vx: -rand(9, 14), depth: 0.5, bob: rand(0, 6),
        rot: Math.random(), spin: rand(1.4, 2.4) * 0.0000105, atm, halo: null,
        ring: Math.random() < 0.18 ? makeRing(false, gas ? (pal as GasPal) : null) : null, moon: null,
        body: null, bodyRot: -1, bodyR: 0, main: false,
      };
    };
    const makeGalaxy = (big: boolean): Galaxy => ({
      tex: galaxyTexture(big ? 420 : 200), x: 0, y: 0, vx: -(big ? rand(2.2, 3.2) : rand(1.4, 2)), depth: big ? 0.25 : 0.12,
      f: big ? (mob() ? rand(0.42, 0.52) : rand(0.34, 0.44)) : rand(0.1, 0.15),
      tilt: rand(-0.9, 0.9), incl: rand(0.36, 0.66), spin: Math.random() * Math.PI * 2, alpha: big ? rand(0.75, 0.92) : rand(0.45, 0.6),
    });
    const makeAsteroid = (x: number): Asteroid => {
      const big = Math.random() < 0.18;
      const s = big ? rand(6, mob() ? 9 : 12) : rand(1.2, 4.5);
      const n = Math.floor(rand(8, 13));
      const v = -rand(14, 42) * (0.6 + s / 12) * speed();
      const vy = rand(-3, 3);
      const [c1, c2] = pick(ROCK_COLS);
      return {
        x, y: rand(0.04, 0.96) * h, vx: v, vy, bvx: v, bvy: vy, s, rot: rand(0, 6.28), vr: rand(-0.0012, 0.0012), c1, c2,
        verts: Array.from({ length: n }, () => rand(0.68, 1.12)), depth: 0.6 + s / 12,
      };
    };

    // posisi awal yang saling berjauhan: dari beberapa kandidat acak, ambil yang paling lega
    const taken: { x: number; y: number; r: number }[] = [];
    const place = (o: { x: number; y: number }, r: number) => {
      let best = { x: 0, y: 0, gap: -Infinity };
      for (let i = 0; i < 18; i++) {
        const x = rand(0.06, 0.94) * w, y = zoneY(Math.random() < 0.5);
        const gap = taken.length ? Math.min(...taken.map((t) => Math.hypot(t.x - x, (t.y - y) * 1.4) - t.r - r)) : 0;
        if (gap > best.gap) best = { x, y, gap };
      }
      o.x = best.x; o.y = best.y;
      taken.push({ x: best.x, y: best.y, r });
    };

    const buildScene = () => {
      const m = minWH();
      const main = makeMain();
      place(main, m * main.f * (main.ring ? main.ring.outer : 1.4));
      planets.push(main);
      hole = {
        x: 0, y: 0, vx: -rand(3, 4.5), depth: 0.35,
        f: mob() ? rand(0.04, 0.05) : rand(0.042, 0.056), tilt: rand(-0.4, 0.15), cache: null, t: -1e9, boost: -1, r: 0,
      };
      place(hole, m * hole.f * 3.4);
      const gBig = makeGalaxy(true);
      place(gBig, m * gBig.f * 0.5);
      galaxies.push(gBig);
      if (Math.random() < 0.7) { const g2 = makeGalaxy(false); place(g2, m * g2.f * 0.5); galaxies.push(g2); }
      asteroids = Array.from({ length: mob() ? 7 : 12 }, () => makeAsteroid(rand(0, w)));
      // planet kecil dibuat setelah frame pertama agar halaman tak tersendat
      const smalls = Math.random() < 0.5 ? 2 : 1;
      for (let i = 0; i < smalls; i++) {
        setTimeout(() => { const p = makeSmall(); place(p, minWH() * p.f * 1.6); planets.unshift(p); }, 60 + i * 80);
      }
    };

    let prevW = 0, prevH = 0;
    const resize = () => {
      const r = host.getBoundingClientRect();
      w = r.width; h = r.height;
      if (w < 2 || h < 2) return;
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
      if (!sky || Math.abs(prevW - w) > 40 || Math.abs(prevH - h) > 40) {
        sky = skyBackdrop(w, h); skyW = backdropWidth(w); skyX = Math.random() * skyW;
      }
      // pertahankan posisi relatif benda saat ukuran berubah
      if (prevW && prevH) {
        const sx = w / prevW, sy = h / prevH;
        for (const o of [...planets, ...galaxies, ...asteroids, ...(hole ? [hole] : [])]) { o.x *= sx; o.y *= sy; }
      }
      prevW = w; prevH = h;
    };

    /** Benda yang keluar di kiri muncul lagi dari kanan (dengan jeda acak). */
    const wrap = (o: { x: number; y: number }, size: number, top?: boolean) => {
      if (o.x < -size - 60) { o.x = w + size + 40 + rand(0, w * 0.3); o.y = zoneY(top ?? Math.random() < 0.5); return true; }
      return false;
    };

    /* ── planet ── */
    const ringPass = (p: Planet, cx: number, cy: number, r: number, front: boolean) => {
      const R = p.ring!;
      ctx.save();
      ctx.translate(cx, cy); ctx.rotate(R.tilt); ctx.scale(1, R.ry);
      const inner = r * R.inner, outer = r * R.outer, N = p.main ? 46 : 18;
      for (let i = 0; i < N; i++) {
        const t = i / (N - 1);
        const rr = inner + (outer - inner) * t;
        const dens = (0.35 + 0.65 * Math.sin(t * Math.PI)) * (Math.abs(t - R.gapA) < 0.03 ? 0.08 : 1) * (Math.abs(t - R.gapB) < 0.02 ? 0.25 : 1);
        const grain = 0.75 + 0.25 * Math.sin(i * 2.7);
        ctx.strokeStyle = `rgba(${t < 0.45 ? R.c1 : R.c2},${(front ? 0.3 : 0.2) * dens * grain * R.alpha})`;
        ctx.lineWidth = ((outer - inner) / N) * 1.15;
        ctx.beginPath();
        if (front) ctx.arc(0, 0, rr, 0, Math.PI); else ctx.arc(0, 0, rr, Math.PI, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();
    };

    const moon = (p: Planet, cx: number, cy: number, r: number, front: boolean) => {
      const m = p.moon!;
      const tilt = p.ring?.tilt ?? -0.38, ry = p.ring?.ry ?? 0.27;
      const z = Math.sin(m.a);
      if ((z > 0) !== front) return;
      const orbit = r * m.orbit;
      const ex = Math.cos(m.a) * orbit, ey = Math.sin(m.a) * orbit * ry;
      const mx = cx + ex * Math.cos(tilt) - ey * Math.sin(tilt), my = cy + ex * Math.sin(tilt) + ey * Math.cos(tilt);
      const mr = r * m.size * (0.9 + z * 0.1);
      const g = ctx.createRadialGradient(mx - mr * 0.4, my - mr * 0.4, mr * 0.1, mx, my, mr);
      g.addColorStop(0, "#e6e0ff"); g.addColorStop(0.55, "#8a7fb8"); g.addColorStop(1, "#231c42");
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(mx, my, mr, 0, Math.PI * 2); ctx.fill();
    };

    function surface(g: CanvasRenderingContext2D, p: Planet, cx: number, cy: number, r: number) {
      const TW = p.tex.width / 2, TH = p.tex.height;
      g.save();
      g.beginPath(); g.arc(cx, cy, r, 0, Math.PI * 2); g.clip();
      const S = Math.max(28, Math.ceil(r));
      const sw = (2 * r) / S;
      for (let i = 0; i < S; i++) {
        const x0 = (i / S) * 2 - 1, x1 = ((i + 1) / S) * 2 - 1;
        const u0 = ((Math.asin(x0) / Math.PI + 0.5) * 0.5 + p.rot) % 1;
        const du = ((Math.asin(x1) - Math.asin(x0)) / Math.PI) * 0.5;
        g.drawImage(p.tex, u0 * TW, 0, Math.max(0.5, du * TW), TH, cx - r + i * sw, cy - r, sw + 0.6, 2 * r);
      }
      // terminator: cahaya dari kiri-atas (sama untuk semua benda)
      const sh = g.createRadialGradient(cx - r * 0.55, cy - r * 0.45, r * 0.15, cx - r * 0.2, cy - r * 0.1, r * 1.55);
      sh.addColorStop(0, "rgba(255,255,255,0.10)"); sh.addColorStop(0.45, "rgba(0,0,0,0)"); sh.addColorStop(0.72, "rgba(4,2,16,0.78)"); sh.addColorStop(1, "rgba(2,1,8,0.97)");
      g.fillStyle = sh; g.fillRect(cx - r, cy - r, 2 * r, 2 * r);
      const limb = g.createRadialGradient(cx, cy, r * 0.62, cx, cy, r);
      limb.addColorStop(0, "rgba(0,0,0,0)"); limb.addColorStop(1, "rgba(0,0,0,0.5)");
      g.fillStyle = limb; g.fillRect(cx - r, cy - r, 2 * r, 2 * r);
      g.restore();
      if (!p.atm) return;
      // atmosfer hanya di sisi siang
      const size = Math.ceil(r * 2.6);
      const tmp = document.createElement("canvas");
      tmp.width = tmp.height = Math.ceil(size * dpr);
      const a = tmp.getContext("2d")!;
      a.setTransform(dpr, 0, 0, dpr, 0, 0);
      const tc = size / 2;
      const atm = a.createRadialGradient(tc, tc, r * 0.97, tc, tc, r * 1.2);
      atm.addColorStop(0, `rgba(${p.atm[0]},0.75)`); atm.addColorStop(0.3, `rgba(${p.atm[1]},0.3)`); atm.addColorStop(1, `rgba(${p.atm[1]},0)`);
      a.fillStyle = atm;
      a.beginPath(); a.arc(tc, tc, r * 1.2, 0, Math.PI * 2); a.arc(tc, tc, r * 0.97, 0, Math.PI * 2, true); a.fill("evenodd");
      a.globalCompositeOperation = "destination-in";
      const lit = a.createLinearGradient(tc - r * 0.9, tc - r * 0.8, tc + r * 0.7, tc + r * 0.8);
      lit.addColorStop(0, "rgba(0,0,0,1)"); lit.addColorStop(0.55, "rgba(0,0,0,0.35)"); lit.addColorStop(1, "rgba(0,0,0,0.04)");
      a.fillStyle = lit; a.fillRect(0, 0, size, size);
      g.drawImage(tmp, cx - tc, cy - tc, size, size);
    }

    /** Badan planet di-cache; dirender ulang hanya bila rotasi bergeser ≥ ~0.4 px. */
    function planetBody(p: Planet, r: number) {
      if (p.body && p.bodyR === r && Math.abs(p.rot - p.bodyRot) < 0.4 / (2 * Math.PI * r)) return p.body;
      const size = Math.ceil(r * 1.2 * 2);
      if (!p.body || p.bodyR !== r) { p.body = document.createElement("canvas"); p.body.width = p.body.height = Math.ceil(size * dpr); }
      p.bodyR = r; p.bodyRot = p.rot;
      const g = p.body.getContext("2d")!;
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      g.clearRect(0, 0, size, size);
      surface(g, p, size / 2, size / 2, r);
      return p.body;
    }

    const drawPlanet = (p: Planet, now: number) => {
      const r = minWH() * p.f;
      const cx = p.x + cur.x * 30 * p.depth, cy = p.y + cur.y * 18 * p.depth + Math.sin(now / 4200 + p.bob) * (p.main ? 5 : 2);
      if (p.halo) {
        const halo = ctx.createRadialGradient(cx, cy, r * 0.8, cx, cy, r * 3.2);
        halo.addColorStop(0, `rgba(${p.halo},0.2)`); halo.addColorStop(1, `rgba(${p.halo},0)`);
        ctx.fillStyle = halo; ctx.beginPath(); ctx.arc(cx, cy, r * 3.2, 0, Math.PI * 2); ctx.fill();
      }
      if (p.moon) moon(p, cx, cy, r, false);
      if (p.ring) ringPass(p, cx, cy, r, false);
      const body = planetBody(p, r);
      const half = body.width / dpr / 2;
      ctx.drawImage(body, cx - half, cy - half, half * 2, half * 2);
      if (p.ring) ringPass(p, cx, cy, r, true);
      if (p.moon) moon(p, cx, cy, r, true);
    };

    const holeSprite = (o: Hole, r: number, tNow: number, boost: number) => {
      if (o.cache && o.r === r && Math.abs(tNow - o.t) < 100 && Math.abs(boost - o.boost) < 0.05) return o.cache;
      const size = Math.ceil(r * 10);
      if (!o.cache || o.r !== r) { o.cache = document.createElement("canvas"); o.cache.width = o.cache.height = Math.ceil(size * dpr); }
      o.r = r; o.t = tNow; o.boost = boost;
      const g = o.cache.getContext("2d")!;
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      g.clearRect(0, 0, size, size);
      drawBlackHole(g, size / 2, size / 2, r, tNow, boost, o.tilt);
      return o.cache;
    };

    /* ── komet: kepala bercahaya, ekor debu melengkung + ekor ion lurus ── */
    const spawnComet = (x?: number, y?: number) => {
      const fromTop = Math.random() < 0.55;
      const ang = Math.PI * rand(0.8, 0.9);
      const sp = rand(55, 95) * speed();
      comets.push({
        x: x ?? (fromTop ? rand(0.4, 1.05) * w : w + 30), y: y ?? (fromTop ? -30 : rand(0, 0.45) * h),
        vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp, len: (mob() ? rand(70, 120) : rand(120, 210)), age: 0,
      });
    };
    const drawComet = (c: Comet) => {
      const sp = Math.hypot(c.vx, c.vy) || 1, dx = c.vx / sp, dy = c.vy / sp, px = -dy, py = dx;
      const f = Math.min(1, c.age / 700);
      const L = c.len, x = c.x, y = c.y;
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      // ekor debu (lebar, melengkung)
      const ex = x - dx * L + px * L * 0.16, ey = y - dy * L + py * L * 0.16;
      const gd = ctx.createLinearGradient(x, y, ex, ey);
      gd.addColorStop(0, `rgba(255,244,226,${0.5 * f})`); gd.addColorStop(0.35, `rgba(255,170,236,${0.2 * f})`); gd.addColorStop(1, "rgba(255,120,220,0)");
      ctx.fillStyle = gd;
      ctx.beginPath();
      ctx.moveTo(x + px * 2.4, y + py * 2.4);
      ctx.quadraticCurveTo(x - dx * L * 0.5 + px * L * 0.12, y - dy * L * 0.5 + py * L * 0.12, ex + px * L * 0.08, ey + py * L * 0.08);
      ctx.lineTo(ex - px * L * 0.04, ey - py * L * 0.04);
      ctx.quadraticCurveTo(x - dx * L * 0.5 - px * L * 0.01, y - dy * L * 0.5 - py * L * 0.01, x - px * 2.4, y - py * 2.4);
      ctx.closePath(); ctx.fill();
      // ekor ion (tipis, lurus, biru)
      const ix = x - dx * L * 1.35, iy = y - dy * L * 1.35;
      const gi = ctx.createLinearGradient(x, y, ix, iy);
      gi.addColorStop(0, `rgba(160,245,255,${0.75 * f})`); gi.addColorStop(1, "rgba(80,160,255,0)");
      ctx.strokeStyle = gi; ctx.lineCap = "round";
      ctx.lineWidth = 4; ctx.globalAlpha = 0.35; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(ix, iy); ctx.stroke();
      ctx.lineWidth = 1.3; ctx.globalAlpha = 1; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(ix, iy); ctx.stroke();
      // koma
      ctx.globalAlpha = f;
      ctx.drawImage(comaSprite, x - 16, y - 16, 32, 32);
      ctx.fillStyle = "#ffffff"; ctx.beginPath(); ctx.arc(x, y, 1.8, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    };

    const drawAsteroid = (a: Asteroid) => {
      const x = a.x + cur.x * 34 * a.depth, y = a.y + cur.y * 22 * a.depth;
      if (a.s < 2) { ctx.globalAlpha = 0.85; ctx.fillStyle = a.c1; ctx.fillRect(x - a.s / 2, y - a.s / 2, a.s, a.s); ctx.globalAlpha = 1; return; }
      const g = ctx.createRadialGradient(x - a.s * 0.45, y - a.s * 0.45, a.s * 0.1, x, y, a.s * 1.25);
      g.addColorStop(0, a.c1); g.addColorStop(1, a.c2);
      ctx.fillStyle = g;
      ctx.beginPath();
      const n = a.verts.length;
      for (let i = 0; i < n; i++) {
        const an = a.rot + (i / n) * Math.PI * 2, rr = a.s * a.verts[i]!;
        if (i) ctx.lineTo(x + Math.cos(an) * rr, y + Math.sin(an) * rr); else ctx.moveTo(x + Math.cos(an) * rr, y + Math.sin(an) * rr);
      }
      ctx.closePath(); ctx.fill();
      if (a.s > 6) {
        ctx.fillStyle = "rgba(0,0,0,0.28)";
        ctx.beginPath(); ctx.ellipse(x + Math.cos(a.rot) * a.s * 0.3, y + Math.sin(a.rot) * a.s * 0.3, a.s * 0.22, a.s * 0.16, a.rot, 0, Math.PI * 2); ctx.fill();
      }
    };

    /* ── frame ── */
    const draw = (now: number) => {
      const dt = Math.min(50, last ? now - last : 16); last = now;
      const ds = reduced ? 0 : dt / 1000; // detik
      cur.x += (target.x - cur.x) * 0.05; cur.y += (target.y - cur.y) * 0.05;
      // jangkauan rasi melebar selama jari/klik ditahan
      ptr.reach += ((ptr.hold ? 250 : 160) - ptr.reach) * 0.04;
      ctx.clearRect(0, 0, w, h);

      // latar nebula + Bima Sakti (ubin yang terus bergeser)
      if (sky) {
        skyX = (skyX + 1.6 * speed() * ds) % skyW;
        const ox = -skyX + cur.x * -12 - 40, oy = cur.y * -7 - 30;
        ctx.drawImage(sky, ox, oy);
        if (ox + skyW < w) ctx.drawImage(sky, ox + skyW, oy);
      }

      // galaksi
      for (const g of galaxies) {
        g.x += g.vx * speed() * ds;
        const gs = minWH() * g.f;
        wrap(g, gs);
        g.spin += ds * 0.09;
        const gx = g.x + cur.x * 24 * g.depth, gy = g.y + cur.y * 14 * g.depth;
        ctx.save();
        ctx.globalAlpha = g.alpha;
        ctx.translate(gx, gy); ctx.rotate(g.tilt); ctx.scale(1, g.incl); ctx.rotate(g.spin);
        ctx.drawImage(g.tex, -gs / 2, -gs / 2, gs, gs);
        ctx.restore();
      }

      // bintang
      const near: { x: number; y: number; d: number }[] = [];
      const reach = ptr.reach;
      for (const s of stars) {
        const L = LAYER[s.layer];
        if (!reduced) { s.x -= L.drift * dt * speed(); if (s.x < -10) { s.x = w + 10; s.y = Math.random() * h; } }
        const x = s.x + cur.x * 34 * L.depth, y = s.y + cur.y * 22 * L.depth;
        let a = s.a * (reduced ? 1 : 0.72 + 0.28 * Math.sin((now / 1000) * s.tw + s.ph));
        if (ptr.in && s.layer > 0) {
          const d = Math.hypot(x - ptr.x, y - ptr.y);
          if (d < reach) { a = Math.min(1, a + (1 - d / reach) * 0.6); near.push({ x, y, d }); }
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

      // lubang hitam
      if (hole) {
        hole.x += hole.vx * speed() * ds;
        const br = minWH() * hole.f;
        wrap(hole, br * 5);
        const bx = hole.x + cur.x * 16, by = hole.y + cur.y * 10;
        const boost = ptr.in ? Math.max(0, 1 - Math.hypot(ptr.x - bx, ptr.y - by) / 260) : 0;
        const bh = holeSprite(hole, br, reduced ? 0 : now, boost);
        const half = bh.width / dpr / 2;
        ctx.drawImage(bh, bx - half, by - half, half * 2, half * 2);
      }

      // planet (kecil dulu, utama terakhir = paling dekat)
      for (const p of planets) {
        p.x += p.vx * speed() * ds;
        const r = minWH() * p.f;
        wrap(p, r * (p.ring ? p.ring.outer : 1.3) + (p.moon ? r * p.moon.orbit : 0));
        if (!reduced) { p.rot = (p.rot + dt * p.spin) % 1; if (p.moon) p.moon.a = (p.moon.a + dt * p.moon.speed) % (Math.PI * 2); }
        drawPlanet(p, now);
      }

      // asteroid (menghindar dari kursor/jari)
      for (const a of asteroids) {
        if (!reduced) {
          if (ptr.in) {
            const dx = a.x - ptr.x, dy = a.y - ptr.y, d = Math.hypot(dx, dy);
            if (d < 120 && d > 0.1) { const k = (1 - d / 120) * 140 * ds; a.vx += (dx / d) * k; a.vy += (dy / d) * k; }
          }
          a.vx += (a.bvx - a.vx) * 0.02; a.vy += (a.bvy - a.vy) * 0.02;
          a.x += a.vx * ds; a.y += a.vy * ds; a.rot += a.vr * dt;
          if (a.x < -30 || a.y < -40 || a.y > h + 40) Object.assign(a, makeAsteroid(w + rand(10, w * 0.4)));
        }
        drawAsteroid(a);
      }

      if (!reduced) {
        // komet
        if (!nextComet) nextComet = now + rand(2500, 5000);
        if (now > nextComet) { spawnComet(); nextComet = now + rand(11000, 22000); }
        comets = comets.filter((c) => c.x > -c.len * 1.6 && c.y < h + c.len * 1.6);
        for (const c of comets) { c.age += dt; c.x += c.vx * ds; c.y += c.vy * ds; drawComet(c); }
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
      }

      // tabir lembut di belakang judul → teks tetap mudah dibaca walau benda lewat
      {
        const vr = mob() ? w * 0.75 : Math.min(w * 0.4, 560);
        ctx.save();
        ctx.translate(w / 2, h * 0.47); ctx.scale(1, (h * 0.42) / vr);
        const v = ctx.createRadialGradient(0, 0, 0, 0, 0, vr);
        v.addColorStop(0, "rgba(5,7,22,0.5)"); v.addColorStop(0.6, "rgba(5,7,22,0.3)"); v.addColorStop(1, "rgba(5,7,22,0)");
        ctx.fillStyle = v; ctx.beginPath(); ctx.arc(0, 0, vr, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      }

      // rasi: kursor/jari → bintang terdekat (lebih banyak garis saat ditahan)
      if (near.length) {
        near.sort((a, b) => a.d - b.d);
        const pts = near.slice(0, ptr.hold ? 11 : 7);
        ctx.lineWidth = ptr.hold ? 1 : 0.8;
        for (const p of pts) {
          ctx.strokeStyle = `rgba(125,249,255,${(1 - p.d / reach) * (ptr.hold ? 0.6 : 0.45)})`;
          ctx.beginPath(); ctx.moveTo(ptr.x, ptr.y); ctx.lineTo(p.x, p.y); ctx.stroke();
        }
        for (let i = 0; i < pts.length - 1; i++) {
          const a = pts[i]!, b = pts[i + 1]!;
          if (Math.hypot(a.x - b.x, a.y - b.y) < 130) {
            ctx.strokeStyle = `rgba(255,120,230,${(1 - a.d / reach) * 0.3})`;
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
          }
        }
      }
      // titik sentuh berdenyut selama ditahan
      if (ptr.hold && ptr.in) {
        const pulse = 0.5 + 0.5 * Math.sin(now / 220);
        ctx.strokeStyle = `rgba(125,249,255,${0.35 + pulse * 0.35})`; ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.arc(ptr.x, ptr.y, 10 + pulse * 6, 0, Math.PI * 2); ctx.stroke();
        ctx.globalAlpha = 0.6; ctx.drawImage(sprites.get("#7df9ff")!, ptr.x - 14, ptr.y - 14, 28, 28); ctx.globalAlpha = 1;
      }

      if (!reduced) {
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
      const ang = Math.PI * (0.72 + Math.random() * 0.08);
      meteors.push({ x, y, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp, life: 0, max: 55 + Math.random() * 35, w: 1.4 + Math.random() * 1.2 });
    }

    const start = () => { cancelAnimationFrame(raf); last = 0; raf = requestAnimationFrame(draw); };
    const local = (e: PointerEvent) => { const r = host.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top, r }; };
    const aim = (x: number, y: number, r: DOMRect) => { ptr.x = x; ptr.y = y; ptr.in = true; target.x = (x / r.width) * 2 - 1; target.y = (y / r.height) * 2 - 1; };
    const onMove = (e: PointerEvent) => { const { x, y, r } = local(e); aim(x, y, r); };
    const onLeave = (e: PointerEvent) => { if (e.pointerType === "mouse" && !ptr.hold) { target.x = 0; target.y = 0; ptr.in = false; } };
    const onDown = (e: PointerEvent) => {
      const { x, y, r } = local(e);
      aim(x, y, r);
      ptr.hold = true; ptr.touch = e.pointerType !== "mouse";
      ripples.push({ x, y, t: 0 });
      if (Math.random() < 0.25) spawnComet(x + 120, y - 80); else spawnMeteor(x + 40, y - 30);
    };
    // dilepas / dibatalkan (mis. halaman mulai digulir) → garis untuk sentuhan hilang, untuk mouse tetap mengikuti kursor
    const onUp = (e?: Event) => {
      // sentuhan: pointercancel muncul saat halaman ikut tergulir → abaikan, tunggu touchend
      if (ptr.touch && e?.type === "pointercancel") return;
      ptr.hold = false;
      if (ptr.touch) { ptr.in = false; target.x = 0; target.y = 0; }
    };
    // touchmove tetap terkirim walau halaman sedang digulir → garis ikut jari sampai dilepas
    const onTouchMove = (e: TouchEvent) => {
      const t = e.touches[0];
      if (!t || !ptr.hold) return;
      const r = host.getBoundingClientRect();
      aim(t.clientX - r.left, t.clientY - r.top, r);
    };
    const onTouchEnd = (e: TouchEvent) => { if (!e.touches.length) onUp(); };
    const io = new IntersectionObserver(([en]) => { visible = !!en?.isIntersecting && !document.hidden; if (visible && !reduced) start(); });
    const onVis = () => { visible = !document.hidden; if (visible && !reduced) start(); };
    const ro = new ResizeObserver(() => { resize(); if (reduced) draw(performance.now()); });

    resize();
    buildScene();
    ro.observe(host);
    io.observe(host);
    document.addEventListener("visibilitychange", onVis);
    if (!reduced) {
      host.addEventListener("pointermove", onMove);
      host.addEventListener("pointerleave", onLeave);
      host.addEventListener("pointerdown", onDown);
      window.addEventListener("pointerup", onUp);
      window.addEventListener("pointercancel", onUp);
      window.addEventListener("touchmove", onTouchMove, { passive: true });
      window.addEventListener("touchend", onTouchEnd, { passive: true });
      window.addEventListener("touchcancel", onTouchEnd, { passive: true });
    }
    if (reduced) setTimeout(() => draw(performance.now()), 250); else start();
    return () => {
      cancelAnimationFrame(raf); ro.disconnect(); io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      host.removeEventListener("pointermove", onMove); host.removeEventListener("pointerleave", onLeave); host.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp); window.removeEventListener("pointercancel", onUp);
      window.removeEventListener("touchmove", onTouchMove); window.removeEventListener("touchend", onTouchEnd); window.removeEventListener("touchcancel", onTouchEnd);
    };
  }, []);

  return <canvas ref={ref} aria-hidden className="hero-bg pointer-events-none absolute inset-0" />;
}
