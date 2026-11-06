// Elemen kosmik untuk kanvas hero: Bima Sakti, galaksi spiral jauh, lubang hitam, kilatan Big Bang.
// Tekstur statis dirender sekali (cache); yang digambar per frame hanya transformasi & sedikit gradien.

const rand = (a: number, b: number) => a + Math.random() * (b - a);
/** Bilangan acak berdistribusi normal (Box–Muller). */
const gauss = () => Math.sqrt(-2 * Math.log(Math.random() || 1e-9)) * Math.cos(2 * Math.PI * Math.random());

/** Pita Bima Sakti diagonal: ribuan bintang rapat + cahaya difus + jalur debu gelap. */
export function milkyWayTexture(w: number, h: number): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = Math.round(w + 80); c.height = Math.round(h + 60);
  const g = c.getContext("2d")!;
  const W = c.width, H = c.height;
  // sumbu pita: kiri-bawah → kanan-atas
  const x0 = -W * 0.1, y0 = H * 1.05, x1 = W * 1.1, y1 = -H * 0.05;
  const len = Math.hypot(x1 - x0, y1 - y0);
  const ux = (x1 - x0) / len, uy = (y1 - y0) / len; // arah pita
  const nx = -uy, ny = ux; // tegak lurus pita
  const width = Math.min(W, H) * 0.22;

  g.save();
  g.translate(x0, y0); g.rotate(Math.atan2(uy, ux));
  // cahaya difus pita (beberapa lapis, lebih terang di tengah)
  for (const [k, a, col] of [[1.6, 0.05, "150,170,255"], [1, 0.08, "200,190,255"], [0.45, 0.07, "255,225,240"]] as const) {
    const gr = g.createLinearGradient(0, -width * k, 0, width * k);
    gr.addColorStop(0, `rgba(${col},0)`); gr.addColorStop(0.5, `rgba(${col},${a})`); gr.addColorStop(1, `rgba(${col},0)`);
    g.fillStyle = gr; g.fillRect(0, -width * k, len, width * 2 * k);
  }
  g.restore();

  // bintang rapat terdistribusi normal di sekitar sumbu
  const n = Math.min(4200, Math.round((W * H) / 260));
  for (let i = 0; i < n; i++) {
    const t = Math.random() * len, off = gauss() * width * 0.42;
    const x = x0 + ux * t + nx * off, y = y0 + uy * t + ny * off;
    const r = Math.random() < 0.97 ? rand(0.25, 0.7) : rand(0.8, 1.3);
    const warm = Math.random();
    g.fillStyle = warm < 0.6 ? "rgba(235,238,255," : warm < 0.85 ? "rgba(255,236,214," : "rgba(190,215,255,";
    g.fillStyle += `${rand(0.25, 0.85)})`;
    g.fillRect(x, y, r, r);
  }

  // jalur debu gelap (bergelombang) di tengah pita
  g.save();
  g.globalCompositeOperation = "destination-out";
  g.filter = "blur(10px)";
  for (let i = 0; i < 70; i++) {
    const t = (i / 70) * len;
    const off = Math.sin(i * 0.35) * width * 0.12 + gauss() * width * 0.05;
    const x = x0 + ux * t + nx * off, y = y0 + uy * t + ny * off;
    g.fillStyle = `rgba(0,0,0,${rand(0.25, 0.55)})`;
    g.beginPath(); g.ellipse(x, y, rand(18, 46), rand(5, 12), Math.atan2(uy, ux), 0, Math.PI * 2); g.fill();
  }
  g.restore();
  return c;
}

/** Galaksi spiral jauh (dua lengan logaritmik), dilihat miring. */
export function spiralGalaxyTexture(size: number): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const g = c.getContext("2d")!;
  const cx = size / 2, cy = size / 2, R = size * 0.46;
  const core = g.createRadialGradient(cx, cy, 0, cx, cy, R * 0.35);
  core.addColorStop(0, "rgba(255,240,220,0.95)"); core.addColorStop(0.4, "rgba(255,190,230,0.35)"); core.addColorStop(1, "rgba(160,140,255,0)");
  g.fillStyle = core; g.beginPath(); g.arc(cx, cy, R * 0.35, 0, Math.PI * 2); g.fill();
  for (let arm = 0; arm < 2; arm++) {
    for (let i = 0; i < 900; i++) {
      const t = Math.random();
      const ang = arm * Math.PI + t * Math.PI * 3.2;
      const rr = R * (0.08 + t * 0.92);
      const spread = (1 - t * 0.5) * R * 0.09;
      const x = cx + Math.cos(ang) * rr + gauss() * spread, y = cy + Math.sin(ang) * rr + gauss() * spread;
      const blue = t > 0.35 && Math.random() < 0.5;
      g.fillStyle = blue ? `rgba(140,220,255,${rand(0.2, 0.75) * (1 - t * 0.5)})` : `rgba(230,200,255,${rand(0.15, 0.6) * (1 - t * 0.6)})`;
      const s = rand(0.5, 1.4);
      g.fillRect(x, y, s, s);
    }
  }
  return c;
}

/**
 * Lubang hitam: cakram akresi berputar (gradien kerucut), cincin foton, cahaya yang terlensa melengkung di atasnya.
 * `boost` 0..1 = seberapa dekat kursor (menambah terang).
 */
export function drawBlackHole(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, time: number, boost: number) {
  const tilt = -0.22, flat = 0.3;
  const spin = time / 2600;
  const hasConic = typeof ctx.createConicGradient === "function";

  // pendar jauh
  const halo = ctx.createRadialGradient(x, y, r, x, y, r * 5);
  halo.addColorStop(0, `rgba(255,140,80,${0.14 + boost * 0.12})`); halo.addColorStop(0.5, `rgba(255,43,214,${0.05 + boost * 0.05})`); halo.addColorStop(1, "rgba(255,43,214,0)");
  ctx.fillStyle = halo; ctx.beginPath(); ctx.arc(x, y, r * 5, 0, Math.PI * 2); ctx.fill();

  const disk = (front: boolean) => {
    ctx.save();
    ctx.translate(x, y); ctx.rotate(tilt); ctx.scale(1, flat);
    const inner = r * 1.35, outer = r * 3.3;
    if (hasConic) {
      const cg = ctx.createConicGradient(spin, 0, 0);
      // sisi yang mendekat lebih terang (efek Doppler)
      cg.addColorStop(0, `rgba(255,236,200,${0.95})`); cg.addColorStop(0.18, "rgba(255,150,70,0.85)"); cg.addColorStop(0.42, "rgba(255,43,214,0.55)");
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
  // cahaya cakram belakang yang terlensa melengkung di atas lubang
  ctx.save();
  ctx.translate(x, y); ctx.rotate(tilt);
  const lens = ctx.createLinearGradient(0, -r * 1.9, 0, 0);
  lens.addColorStop(0, "rgba(255,200,150,0)"); lens.addColorStop(0.55, `rgba(255,190,140,${0.45 + boost * 0.3})`); lens.addColorStop(1, "rgba(255,120,200,0.1)");
  ctx.strokeStyle = lens; ctx.lineWidth = r * 0.45;
  ctx.beginPath(); ctx.ellipse(0, 0, r * 1.45, r * 1.5, 0, Math.PI * 1.05, Math.PI * 1.95); ctx.stroke();
  ctx.restore();
  // horizon peristiwa + cincin foton
  ctx.fillStyle = "#000"; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = `rgba(255,228,190,${0.75 + boost * 0.25})`; ctx.lineWidth = Math.max(1, r * 0.07);
  ctx.beginPath(); ctx.arc(x, y, r * 1.06, 0, Math.PI * 2); ctx.stroke();
  disk(true);
}

/** Kilatan Big Bang saat halaman dibuka; t = 0..1. Mengembalikan pengali kecerahan bintang (0 → 1). */
export function drawBigBang(ctx: CanvasRenderingContext2D, w: number, h: number, cx: number, cy: number, t: number): number {
  const e = 1 - Math.pow(1 - t, 3); // ease-out
  const R = Math.hypot(w, h) * (0.05 + e * 1.1);
  const a = Math.max(0, 1 - t * 1.15);
  const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, R);
  g.addColorStop(0, `rgba(255,255,255,${a})`); g.addColorStop(0.18, `rgba(190,250,255,${a * 0.85})`);
  g.addColorStop(0.45, `rgba(167,139,250,${a * 0.45})`); g.addColorStop(0.75, `rgba(255,43,214,${a * 0.18})`); g.addColorStop(1, "rgba(255,43,214,0)");
  ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
  // gelombang kejut
  ctx.strokeStyle = `rgba(125,249,255,${a * 0.8})`; ctx.lineWidth = 2 + (1 - t) * 4;
  ctx.beginPath(); ctx.arc(cx, cy, R * 0.62, 0, Math.PI * 2); ctx.stroke();
  return Math.min(1, t * 1.4);
}
