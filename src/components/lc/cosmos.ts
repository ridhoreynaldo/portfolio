// Elemen kosmik untuk kanvas hero Leetcloud: tekstur planet (gas & batuan), galaksi spiral,
// latar nebula + Bima Sakti yang bisa digeser tanpa sambungan, lubang hitam, sprite pendar.
// Semua tekstur dirender sekali (cache); tiap frame hanya transformasi & sedikit gradien.
// Komposisi diacak setiap halaman dibuka (Math.random), jadi langitnya selalu berbeda.

export const rand = (a: number, b: number) => a + Math.random() * (b - a);
export const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(Math.random() * arr.length)]!;
/** Bilangan acak berdistribusi normal (Box–Muller). */
export const gauss = () => Math.sqrt(-2 * Math.log(Math.random() || 1e-9)) * Math.cos(2 * Math.PI * Math.random());

const canvas = (w: number, h: number) => {
  const c = document.createElement("canvas");
  c.width = Math.max(1, Math.round(w)); c.height = Math.max(1, Math.round(h));
  return c;
};

/* ── noise 3D sederhana (value noise, fBm) ── */
export function makeNoise(seed: number) {
  const p = new Uint8Array(512);
  const perm = Array.from({ length: 256 }, (_, i) => i);
  let s = Math.max(1, Math.floor(seed) % 2147483646);
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
    for (let i = 0; i < oct; i++) { sum += a * n3(x * f + 17.3 * i, y * f, z * f); norm += a; a *= 0.5; f *= 2; }
    return sum / norm;
  };
}

const hex = (c: string) => [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)] as const;
const seed = () => Math.floor(Math.random() * 2e9) + 1;

/** Gandakan tekstur selebar W menjadi 2W agar mudah "dibungkus" saat planet berputar. */
const doubled = (src: HTMLCanvasElement) => {
  const c = canvas(src.width * 2, src.height);
  const g = c.getContext("2d")!;
  g.drawImage(src, 0, 0); g.drawImage(src, src.width, 0);
  return c;
};

/* ═════════════ Planet gas raksasa ═════════════ */
export type GasPal = { cols: string[]; atm: [string, string]; halo: string; ring: [string, string] };
export const GAS: GasPal[] = [
  { cols: ["#120a3a", "#2a1470", "#4c1d95", "#7c3aed", "#b03ad8", "#e04fd0", "#6d28d9", "#22b8d6", "#3b1a8a", "#1a0f4d"], atm: ["140,245,255", "150,120,255"], halo: "124,58,237", ring: ["150,235,255", "214,178,255"] },
  { cols: ["#061a2e", "#0b3550", "#0f5f7a", "#1d8fa8", "#5fd3e6", "#b8f4ff", "#2a7fa0", "#7c6cf0", "#123f66", "#08243d"], atm: ["170,250,255", "90,160,255"], halo: "34,184,214", ring: ["200,245,255", "160,200,255"] },
  { cols: ["#1f0d05", "#4a1e0a", "#8a3d12", "#c46a2a", "#e9a25f", "#ffd9a8", "#b5542a", "#ff7a59", "#5e2810", "#2e1408"], atm: ["255,214,170", "255,120,90"], halo: "255,122,89", ring: ["255,228,196", "222,184,150"] },
  { cols: ["#22061f", "#4a0e45", "#7a1670", "#b5279e", "#ff5ce1", "#ffb3ef", "#8a2be2", "#3c0a52", "#d946ef", "#2a0833"], atm: ["255,178,240", "180,110,255"], halo: "255,43,214", ring: ["255,205,245", "200,170,255"] },
  { cols: ["#03201a", "#06493a", "#0b7a5c", "#22c08a", "#9ff5c9", "#14614c", "#3ad6c6", "#0a3d33", "#5ef0b0", "#041a14"], atm: ["170,255,225", "90,220,255"], halo: "34,192,138", ring: ["195,255,232", "150,230,255"] },
];

/** Tekstur gas raksasa (pita lintang + turbulensi + badai oval di posisi acak). */
export function gasTexture(pal: GasPal, W = 512): HTMLCanvasElement {
  const H = W / 2;
  const noise = makeNoise(seed());
  const cols = pal.cols.map(hex);
  const freq = rand(5.5, 9), stormLon = rand(0, Math.PI * 2), stormLat = rand(-0.45, 0.45), stormK = rand(0.7, 1.3);
  const img = new ImageData(W, H);
  for (let y = 0; y < H; y++) {
    const lat = Math.asin((y / (H - 1)) * 2 - 1) / (Math.PI / 2); // -1..1
    for (let x = 0; x < W; x++) {
      const ang = (x / W) * Math.PI * 2;
      const nx = Math.cos(ang) * 1.6, nz = Math.sin(ang) * 1.6;
      const turb = noise(nx, lat * 3.2, nz, 5);
      const fine = noise(nx * 4, lat * 14, nz * 4, 3);
      let band = lat * freq + 20 + (turb - 0.5) * 1.15 + (fine - 0.5) * 0.35;
      const dx = ((ang - stormLon + Math.PI * 3) % (Math.PI * 2)) - Math.PI, dy = (lat - stormLat) * 3.4;
      const storm = Math.max(0, 1 - Math.sqrt(dx * dx * 2.2 + dy * dy) * 2.4) * stormK;
      band += storm * Math.sin(Math.atan2(dy, dx) * 2 + storm * 6) * 1.2;
      const b = ((band % cols.length) + cols.length) % cols.length;
      const i0 = Math.floor(b), t = b - i0;
      const c0 = cols[i0]!, c1 = cols[(i0 + 1) % cols.length]!;
      const lum = 0.82 + fine * 0.36 + storm * 0.3;
      const o = (y * W + x) * 4;
      img.data[o] = Math.min(255, (c0[0] + (c1[0] - c0[0]) * t) * lum);
      img.data[o + 1] = Math.min(255, (c0[1] + (c1[1] - c0[1]) * t) * lum);
      img.data[o + 2] = Math.min(255, (c0[2] + (c1[2] - c0[2]) * t) * lum);
      img.data[o + 3] = 255;
    }
  }
  const c = canvas(W, H);
  c.getContext("2d")!.putImageData(img, 0, 0);
  return doubled(c);
}

/* ═════════════ Planet batuan / es / samudra / lava ═════════════ */
export type RockPal = { stops: [number, string][]; atm: string | null; craters: boolean; ridge?: boolean };
export const ROCK: RockPal[] = [
  { stops: [[0, "#2a0f07"], [0.42, "#6e2c14"], [0.58, "#a8502a"], [0.74, "#d98a52"], [1, "#f3c9a0"]], atm: "255,170,130", craters: true }, // gurun merah
  { stops: [[0, "#2b3a5c"], [0.4, "#6d82ad"], [0.62, "#a9bde0"], [0.8, "#dfe9ff"], [1, "#ffffff"]], atm: "180,220,255", craters: true }, // es
  { stops: [[0, "#04163d"], [0.5, "#0b3d8a"], [0.53, "#1aa0b8"], [0.56, "#1f8a6a"], [0.7, "#5aa35a"], [0.86, "#c9c08a"], [1, "#f4f4f4"]], atm: "120,200,255", craters: false }, // samudra
  { stops: [[0, "#ffb347"], [0.06, "#ff5a1a"], [0.16, "#5a1206"], [0.3, "#1e0a0c"], [0.7, "#2a1420"], [1, "#4a3040"]], atm: "255,110,60", craters: false, ridge: true }, // lava
  { stops: [[0, "#1e1a2e"], [0.5, "#4a4466"], [0.7, "#7b74a0"], [1, "#c9c3e6"]], atm: null, craters: true }, // bulan ungu
];

const colorAt = (stops: [number, readonly [number, number, number]][], v: number) => {
  for (let i = 1; i < stops.length; i++) {
    const [t1, c1] = stops[i]!;
    if (v <= t1) {
      const [t0, c0] = stops[i - 1]!;
      const k = (v - t0) / Math.max(1e-6, t1 - t0);
      return [c0[0] + (c1[0] - c0[0]) * k, c0[1] + (c1[1] - c0[1]) * k, c0[2] + (c1[2] - c0[2]) * k] as const;
    }
  }
  return stops[stops.length - 1]![1];
};

export function rockTexture(pal: RockPal, W = 256): HTMLCanvasElement {
  const H = W / 2;
  const noise = makeNoise(seed());
  const stops = pal.stops.map(([t, c]) => [t, hex(c)] as [number, readonly [number, number, number]]);
  const img = new ImageData(W, H);
  for (let y = 0; y < H; y++) {
    const lat = Math.asin((y / (H - 1)) * 2 - 1) / (Math.PI / 2);
    for (let x = 0; x < W; x++) {
      const ang = (x / W) * Math.PI * 2;
      const nx = Math.cos(ang) * 1.3, nz = Math.sin(ang) * 1.3;
      let v = noise(nx, lat * 1.9, nz, 5);
      v = pal.ridge ? Math.min(1, Math.abs(v - 0.5) * 2.6) : Math.min(1, Math.max(0, (v - 0.28) / 0.44));
      // tudung kutub untuk dunia es/samudra
      if (!pal.ridge && Math.abs(lat) > 0.86) v = Math.max(v, 0.97);
      const fine = noise(nx * 6, lat * 10, nz * 6, 2);
      const [r, g, b] = colorAt(stops, v);
      const lum = 0.86 + fine * 0.28;
      const o = (y * W + x) * 4;
      img.data[o] = Math.min(255, r * lum); img.data[o + 1] = Math.min(255, g * lum); img.data[o + 2] = Math.min(255, b * lum); img.data[o + 3] = 255;
    }
  }
  const c = canvas(W, H);
  const g = c.getContext("2d")!;
  g.putImageData(img, 0, 0);
  if (pal.craters) {
    for (let i = 0; i < 22; i++) {
      const x = rand(8, W - 8), y = rand(H * 0.18, H * 0.82), r = rand(1.5, 7);
      g.fillStyle = "rgba(0,0,0,0.22)"; g.beginPath(); g.ellipse(x, y, r, r * 0.8, 0, 0, Math.PI * 2); g.fill();
      g.strokeStyle = "rgba(255,255,255,0.14)"; g.lineWidth = 1; g.beginPath(); g.ellipse(x + 0.6, y + 0.6, r, r * 0.8, 0, Math.PI * 0.9, Math.PI * 1.9); g.stroke();
    }
  }
  return doubled(c);
}

/* ═════════════ Galaksi spiral ═════════════ */
export const GALAXY_TINTS = [
  { core: "255,226,190", arm: "140,200,255", knot: "255,110,200" },
  { core: "255,212,232", arm: "186,150,255", knot: "255,92,225" },
  { core: "255,240,212", arm: "125,240,255", knot: "255,140,190" },
  { core: "255,214,170", arm: "170,190,255", knot: "125,249,255" },
] as const;

/**
 * Galaksi spiral (dilihat tegak, nanti dimiringkan saat digambar): inti terang, (opsional) batang,
 * lengan logaritmik dengan pendar difus + bintang tajam, jalur debu gelap, dan simpul HII merah muda.
 */
export function galaxyTexture(size: number, o: { arms?: number; barred?: boolean; tint?: (typeof GALAXY_TINTS)[number] } = {}): HTMLCanvasElement {
  const arms = o.arms ?? pick([2, 2, 3, 4]);
  const barred = o.barred ?? Math.random() < 0.4;
  const tint = o.tint ?? pick(GALAXY_TINTS);
  const wind = arms === 2 ? rand(2.6, 3.4) * Math.PI : rand(1.6, 2.3) * Math.PI;
  const c = canvas(size, size);
  const g = c.getContext("2d")!;
  const cx = size / 2, cy = size / 2, R = size * 0.47;
  const bar = barred ? R * 0.24 : 0;
  // titik pada lengan k, parameter t 0..1 (0 = pangkal)
  const at = (k: number, t: number) => {
    const ang = (k * 2 * Math.PI) / arms + (Math.log(1 + t * 6) / Math.log(7)) * wind;
    const rr = bar + (R - bar) * (0.06 + t * 0.94);
    return [ang, rr] as const;
  };

  // 1) pendar difus lengan (diburamkan)
  const glow = canvas(size, size);
  const gg = glow.getContext("2d")!;
  gg.globalCompositeOperation = "lighter";
  for (let k = 0; k < arms; k++) {
    for (let i = 0; i < 1500; i++) {
      const t = Math.pow(Math.random(), 0.85);
      const [ang, rr] = at(k, t);
      const sp = R * (0.075 - t * 0.03);
      const x = cx + Math.cos(ang) * rr + gauss() * sp, y = cy + Math.sin(ang) * rr + gauss() * sp;
      gg.fillStyle = `rgba(${t < 0.25 ? tint.core : tint.arm},${0.05 * (1 - t * 0.65)})`;
      gg.beginPath(); gg.arc(x, y, rand(2, 5.5) * (1 - t * 0.4), 0, Math.PI * 2); gg.fill();
    }
  }
  if (barred) {
    for (let i = 0; i < 900; i++) {
      const u = rand(-1, 1);
      gg.fillStyle = `rgba(${tint.core},0.06)`;
      gg.beginPath(); gg.arc(cx + u * bar * 1.05, cy + gauss() * R * 0.035, rand(2, 4.5), 0, Math.PI * 2); gg.fill();
    }
  }
  g.filter = "blur(5px)";
  g.drawImage(glow, 0, 0);
  g.filter = "none";
  g.globalAlpha = 0.6; g.drawImage(glow, 0, 0); g.globalAlpha = 1;

  // 2) halo bintang tua & inti
  g.globalCompositeOperation = "lighter";
  const halo = g.createRadialGradient(cx, cy, 0, cx, cy, R * 0.9);
  halo.addColorStop(0, `rgba(${tint.core},0.22)`); halo.addColorStop(0.35, `rgba(${tint.arm},0.06)`); halo.addColorStop(1, `rgba(${tint.arm},0)`);
  g.fillStyle = halo; g.fillRect(0, 0, size, size);
  const core = g.createRadialGradient(cx, cy, 0, cx, cy, R * 0.26);
  core.addColorStop(0, "rgba(255,252,240,1)"); core.addColorStop(0.18, `rgba(${tint.core},0.85)`); core.addColorStop(0.55, `rgba(${tint.core},0.22)`); core.addColorStop(1, `rgba(${tint.core},0)`);
  g.fillStyle = core; g.beginPath(); g.arc(cx, cy, R * 0.26, 0, Math.PI * 2); g.fill();
  if (barred) {
    g.save(); g.translate(cx, cy); g.scale(1, 0.32);
    const b = g.createRadialGradient(0, 0, 0, 0, 0, bar * 1.15);
    b.addColorStop(0, `rgba(${tint.core},0.7)`); b.addColorStop(1, `rgba(${tint.core},0)`);
    g.fillStyle = b; g.beginPath(); g.arc(0, 0, bar * 1.15, 0, Math.PI * 2); g.fill();
    g.restore();
  }

  // 3) jalur debu di sisi dalam lengan
  g.globalCompositeOperation = "destination-out";
  for (let k = 0; k < arms; k++) {
    for (let i = 0; i < 520; i++) {
      const t = rand(0.08, 0.8);
      const [ang, rr] = at(k, t);
      const a2 = ang - 0.2, r2 = rr * 0.94;
      g.fillStyle = `rgba(0,0,0,${rand(0.08, 0.22)})`;
      g.beginPath(); g.arc(cx + Math.cos(a2) * r2 + gauss() * R * 0.012, cy + Math.sin(a2) * r2 + gauss() * R * 0.012, rand(1, 2.6), 0, Math.PI * 2); g.fill();
    }
  }

  // 4) bintang tajam di lengan + simpul HII
  g.globalCompositeOperation = "lighter";
  for (let k = 0; k < arms; k++) {
    for (let i = 0; i < 1300; i++) {
      const t = Math.random();
      const [ang, rr] = at(k, t);
      const sp = R * (0.05 - t * 0.02);
      const x = cx + Math.cos(ang) * rr + gauss() * sp, y = cy + Math.sin(ang) * rr + gauss() * sp;
      const blue = t > 0.3 && Math.random() < 0.65;
      g.fillStyle = `rgba(${blue ? "220,236,255" : tint.core},${rand(0.25, 0.9) * (1 - t * 0.45)})`;
      const s = Math.random() < 0.95 ? rand(0.5, 1.1) : rand(1.2, 1.8);
      g.fillRect(x, y, s, s);
    }
    for (let i = 0; i < 9; i++) {
      const [ang, rr] = at(k, rand(0.3, 0.9));
      const x = cx + Math.cos(ang) * rr, y = cy + Math.sin(ang) * rr, r = rand(1.5, 3.5);
      const kn = g.createRadialGradient(x, y, 0, x, y, r * 2.2);
      kn.addColorStop(0, `rgba(${tint.knot},0.75)`); kn.addColorStop(1, `rgba(${tint.knot},0)`);
      g.fillStyle = kn; g.beginPath(); g.arc(x, y, r * 2.2, 0, Math.PI * 2); g.fill();
    }
  }
  // bintang halo tersebar
  for (let i = 0; i < 380; i++) {
    const rr = Math.abs(gauss()) * R * 0.38, a = Math.random() * Math.PI * 2;
    g.fillStyle = `rgba(${tint.core},${rand(0.15, 0.55)})`;
    g.fillRect(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr, 0.8, 0.8);
  }
  g.globalCompositeOperation = "source-over";
  return c;
}

/* ═════════════ Latar: nebula + Bima Sakti (bisa digeser horizontal tanpa sambungan) ═════════════ */
const NEB_PALS = [
  [[124, 58, 237], [0, 200, 230], [230, 60, 210]],
  [[255, 90, 70], [230, 50, 200], [110, 60, 240]],
  [[0, 200, 230], [60, 110, 255], [34, 211, 170]],
  [[150, 70, 255], [255, 120, 60], [0, 180, 255]],
] as const;

/** Lebar ubin latar untuk lebar layar w. */
export const backdropWidth = (w: number) => Math.round(Math.max(w * 1.6, w + 500));

export function skyBackdrop(w: number, h: number): HTMLCanvasElement {
  const W = backdropWidth(w), H = Math.round(h + 60);
  const out = canvas(W, H);
  const og = out.getContext("2d")!;

  // nebula resolusi rendah, noise dipetakan ke lingkaran → kiri & kanan ubin menyambung
  const sc = 0.22;
  const lw = Math.max(4, Math.round(W * sc)), lh = Math.max(4, Math.round(H * sc));
  const low = canvas(lw, lh);
  const lg = low.getContext("2d")!;
  const noise = makeNoise(seed());
  const cols = pick(NEB_PALS);
  const Rn = (3 * W) / (2 * Math.PI * w);
  const thr = rand(0.42, 0.5);
  const img = lg.createImageData(lw, lh);
  for (let y = 0; y < lh; y++) {
    const v = y / lh;
    for (let x = 0; x < lw; x++) {
      const a = (x / lw) * Math.PI * 2, ca = Math.cos(a), sa = Math.sin(a);
      const n = noise(ca * Rn, v * 3, sa * Rn, 5);
      const m = noise(ca * Rn * 0.7 + 9, v * 2 + 3, sa * Rn * 0.7, 3);
      const k0 = Math.min(1, Math.max(0, (n - thr) / 0.3));
      const k = k0 * k0 * (3 - 2 * k0);
      const col = cols[m < 0.45 ? 0 : m < 0.57 ? 1 : 2]!;
      const i = (y * lw + x) * 4;
      img.data[i] = col[0]; img.data[i + 1] = col[1]; img.data[i + 2] = col[2]; img.data[i + 3] = Math.round(k * 80);
    }
  }
  lg.putImageData(img, 0, 0);
  og.filter = "blur(26px)";
  og.imageSmoothingQuality = "high";
  for (const k of [-1, 0, 1]) og.drawImage(low, k * W, -20, W, H + 40);
  og.filter = "none";

  // pita Bima Sakti diagonal, digambar di kanvas sendiri lalu dipudarkan di tepi kiri/kanan ubin → sambungan tak terlihat
  const mw = canvas(W, H);
  const o = mw.getContext("2d")!;
  const flip = Math.random() < 0.5;
  const x0 = W * 0.08, x1 = W * 0.92;
  const y0 = flip ? -H * 0.08 : H * 1.08, y1 = flip ? H * 1.08 : -H * 0.08;
  const len = Math.hypot(x1 - x0, y1 - y0);
  const ux = (x1 - x0) / len, uy = (y1 - y0) / len, nx = -uy, ny = ux;
  const bw = Math.min(W, H) * rand(0.18, 0.26);
  o.save();
  o.translate(x0, y0); o.rotate(Math.atan2(uy, ux));
  for (const [k, a, col] of [[1.6, 0.05, "150,170,255"], [1, 0.08, "200,190,255"], [0.45, 0.07, "255,225,240"]] as const) {
    const gr = o.createLinearGradient(0, -bw * k, 0, bw * k);
    gr.addColorStop(0, `rgba(${col},0)`); gr.addColorStop(0.5, `rgba(${col},${a})`); gr.addColorStop(1, `rgba(${col},0)`);
    // pudar di kedua ujung pita
    o.fillStyle = gr; o.fillRect(0, -bw * k, len, bw * 2 * k);
  }
  o.restore();
  const n = Math.min(5200, Math.round((W * H) / 300));
  for (let i = 0; i < n; i++) {
    const t = Math.random() * len, off = gauss() * bw * 0.42;
    const x = x0 + ux * t + nx * off, y = y0 + uy * t + ny * off;
    const r = Math.random() < 0.97 ? rand(0.25, 0.7) : rand(0.8, 1.3);
    const warm = Math.random();
    o.fillStyle = `${warm < 0.6 ? "rgba(235,238,255," : warm < 0.85 ? "rgba(255,236,214," : "rgba(190,215,255,"}${rand(0.25, 0.85)})`;
    o.fillRect(x, y, r, r);
  }
  o.save();
  o.globalCompositeOperation = "destination-out";
  o.filter = "blur(10px)";
  for (let i = 0; i < 80; i++) {
    const t = (i / 80) * len;
    const off = Math.sin(i * 0.35) * bw * 0.12 + gauss() * bw * 0.05;
    o.fillStyle = `rgba(0,0,0,${rand(0.25, 0.55)})`;
    o.beginPath(); o.ellipse(x0 + ux * t + nx * off, y0 + uy * t + ny * off, rand(18, 46), rand(5, 12), Math.atan2(uy, ux), 0, Math.PI * 2); o.fill();
  }
  o.restore();
  o.globalCompositeOperation = "destination-in";
  const edge = o.createLinearGradient(0, 0, W, 0);
  edge.addColorStop(0, "rgba(0,0,0,0)"); edge.addColorStop(0.14, "rgba(0,0,0,1)"); edge.addColorStop(0.86, "rgba(0,0,0,1)"); edge.addColorStop(1, "rgba(0,0,0,0)");
  o.fillStyle = edge; o.fillRect(0, 0, W, H);
  og.drawImage(mw, 0, 0);
  return out;
}

/** Sprite pendar bulat (dipakai berulang, murah). */
export function glowSprite(rgb: string): HTMLCanvasElement {
  const c = canvas(64, 64);
  const g = c.getContext("2d")!;
  const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, `rgba(${rgb},0.9)`); gr.addColorStop(0.15, `rgba(${rgb},0.35)`); gr.addColorStop(1, `rgba(${rgb},0)`);
  g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
  return c;
}

/**
 * Lubang hitam: cakram akresi berputar (gradien kerucut), cincin foton, cahaya yang terlensa melengkung di atasnya.
 * `boost` 0..1 = seberapa dekat kursor (menambah terang).
 */
export function drawBlackHole(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, time: number, boost: number, tilt = -0.22) {
  const flat = 0.3;
  const spin = time / 2600;
  const hasConic = typeof ctx.createConicGradient === "function";

  const halo = ctx.createRadialGradient(x, y, r, x, y, r * 5);
  halo.addColorStop(0, `rgba(255,140,80,${0.14 + boost * 0.12})`); halo.addColorStop(0.5, `rgba(255,43,214,${0.05 + boost * 0.05})`); halo.addColorStop(1, "rgba(255,43,214,0)");
  ctx.fillStyle = halo; ctx.beginPath(); ctx.arc(x, y, r * 5, 0, Math.PI * 2); ctx.fill();

  const disk = (front: boolean) => {
    ctx.save();
    ctx.translate(x, y); ctx.rotate(tilt); ctx.scale(1, flat);
    const inner = r * 1.35, outer = r * 3.3;
    if (hasConic) {
      const cg = ctx.createConicGradient(spin, 0, 0);
      cg.addColorStop(0, "rgba(255,236,200,0.95)"); cg.addColorStop(0.18, "rgba(255,150,70,0.85)"); cg.addColorStop(0.42, "rgba(255,43,214,0.55)");
      cg.addColorStop(0.62, "rgba(124,58,237,0.35)"); cg.addColorStop(0.82, "rgba(0,229,244,0.55)"); cg.addColorStop(1, "rgba(255,236,200,0.95)");
      ctx.strokeStyle = cg;
    } else ctx.strokeStyle = "rgba(255,160,90,0.7)";
    for (let i = 0; i < 18; i++) {
      const t = i / 17;
      ctx.globalAlpha = (0.25 + 0.75 * Math.sin(t * Math.PI)) * (0.55 + boost * 0.35);
      ctx.lineWidth = ((outer - inner) / 18) * 1.3;
      ctx.beginPath();
      if (front) ctx.arc(0, 0, inner + (outer - inner) * t, 0, Math.PI); else ctx.arc(0, 0, inner + (outer - inner) * t, Math.PI, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
    ctx.globalAlpha = 1;
  };

  disk(false);
  ctx.save();
  ctx.translate(x, y); ctx.rotate(tilt);
  const lens = ctx.createLinearGradient(0, -r * 1.9, 0, 0);
  lens.addColorStop(0, "rgba(255,200,150,0)"); lens.addColorStop(0.55, `rgba(255,190,140,${0.45 + boost * 0.3})`); lens.addColorStop(1, "rgba(255,120,200,0.1)");
  ctx.strokeStyle = lens; ctx.lineWidth = r * 0.45;
  ctx.beginPath(); ctx.ellipse(0, 0, r * 1.45, r * 1.5, 0, Math.PI * 1.05, Math.PI * 1.95); ctx.stroke();
  ctx.restore();
  ctx.fillStyle = "#000"; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = `rgba(255,228,190,${0.75 + boost * 0.25})`; ctx.lineWidth = Math.max(1, r * 0.07);
  ctx.beginPath(); ctx.arc(x, y, r * 1.06, 0, Math.PI * 2); ctx.stroke();
  disk(true);
}
