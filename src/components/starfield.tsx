"use client";

import { useEffect, useRef } from "react";

type Star = { x: number; y: number; r: number; baseAlpha: number; phase: number; speed: number; hue: number };
type Meteor = { x: number; y: number; vx: number; vy: number; life: number; maxLife: number };

/**
 * Latar galaksi: nebula, bintang berkelip (sebagian berwarna cyan/magenta), meteor sesekali, planet cincin,
 * ditambah grid perspektif cyber (CSS). Dimatikan animasinya bila user memilih reduced-motion.
 */
export function Starfield({ grid = true }: { grid?: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let w = 0, h = 0, raf = 0, lastMeteor = 0;
    let stars: Star[] = [];
    let meteors: Meteor[] = [];

    const resize = () => {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
      const count = Math.min(260, Math.floor((w * h) / 8000));
      stars = Array.from({ length: count }, () => ({
        x: Math.random() * w, y: Math.random() * h, r: Math.random() * 1.5 + 0.3,
        baseAlpha: Math.random() * 0.5 + 0.25, phase: Math.random() * Math.PI * 2, speed: Math.random() * 0.9 + 0.3,
        hue: Math.random() < 0.12 ? 1 : Math.random() < 0.08 ? 2 : 0,
      }));
    };

    const nebula = () => {
      const g1 = ctx.createRadialGradient(w * 0.18, h * 0.2, 0, w * 0.18, h * 0.2, w * 0.5);
      g1.addColorStop(0, "rgba(139,92,246,0.20)"); g1.addColorStop(0.5, "rgba(139,92,246,0.06)"); g1.addColorStop(1, "rgba(139,92,246,0)");
      ctx.fillStyle = g1; ctx.fillRect(0, 0, w, h);
      const g2 = ctx.createRadialGradient(w * 0.85, h * 0.75, 0, w * 0.85, h * 0.75, w * 0.45);
      g2.addColorStop(0, "rgba(0,240,255,0.12)"); g2.addColorStop(1, "rgba(0,240,255,0)");
      ctx.fillStyle = g2; ctx.fillRect(0, 0, w, h);
      const g3 = ctx.createRadialGradient(w * 0.6, h * 0.1, 0, w * 0.6, h * 0.1, w * 0.3);
      g3.addColorStop(0, "rgba(255,43,214,0.10)"); g3.addColorStop(1, "rgba(255,43,214,0)");
      ctx.fillStyle = g3; ctx.fillRect(0, 0, w, h);
    };

    const planet = (now: number) => {
      const cx = w * 0.88, cy = h * 0.18, r = Math.min(w, h) * 0.07;
      const body = ctx.createRadialGradient(cx - r * 0.4, cy - r * 0.4, r * 0.1, cx, cy, r);
      body.addColorStop(0, "rgba(167,139,250,0.9)"); body.addColorStop(0.6, "rgba(76,29,149,0.9)"); body.addColorStop(1, "rgba(15,8,40,1)");
      ctx.fillStyle = body;
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
      // cincin
      ctx.save();
      ctx.translate(cx, cy); ctx.rotate(-0.35 + (reduced ? 0 : Math.sin(now / 9000) * 0.05));
      ctx.scale(1, 0.28);
      for (const [rr, a] of [[r * 1.55, 0.55], [r * 1.8, 0.35], [r * 2.05, 0.2]] as const) {
        ctx.strokeStyle = `rgba(0,240,255,${a})`; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(0, 0, rr, 0, Math.PI * 2); ctx.stroke();
      }
      ctx.restore();
      // glow
      const glow = ctx.createRadialGradient(cx, cy, r, cx, cy, r * 2.6);
      glow.addColorStop(0, "rgba(139,92,246,0.18)"); glow.addColorStop(1, "rgba(139,92,246,0)");
      ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(cx, cy, r * 2.6, 0, Math.PI * 2); ctx.fill();
    };

    const draw = (now: number) => {
      ctx.clearRect(0, 0, w, h);
      nebula();
      planet(now);
      for (const s of stars) {
        ctx.globalAlpha = Math.max(0.05, s.baseAlpha + (reduced ? 0 : Math.sin((now / 1000) * s.speed + s.phase) * 0.25));
        ctx.fillStyle = s.hue === 1 ? "#7df9ff" : s.hue === 2 ? "#ff8ae8" : "#d7defa";
        ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2); ctx.fill();
      }
      ctx.globalAlpha = 1;
      if (reduced) return;

      if (now - lastMeteor > 4000 + Math.random() * 5000) {
        lastMeteor = now;
        meteors.push({ x: Math.random() * w * 0.7 + w * 0.15, y: -20, vx: -(2.5 + Math.random() * 2), vy: 3.5 + Math.random() * 2.5, life: 0, maxLife: 90 + Math.random() * 40 });
      }
      meteors = meteors.filter((m) => m.life < m.maxLife);
      for (const m of meteors) {
        m.life++; m.x += m.vx; m.y += m.vy;
        const fade = 1 - m.life / m.maxLife;
        const grad = ctx.createLinearGradient(m.x, m.y, m.x - m.vx * 14, m.y - m.vy * 14);
        grad.addColorStop(0, `rgba(190,250,255,${0.95 * fade})`); grad.addColorStop(1, "rgba(255,43,214,0)");
        ctx.strokeStyle = grad; ctx.lineWidth = 1.8;
        ctx.beginPath(); ctx.moveTo(m.x, m.y); ctx.lineTo(m.x - m.vx * 14, m.y - m.vy * 14); ctx.stroke();
      }
      raf = requestAnimationFrame(draw);
    };

    resize();
    window.addEventListener("resize", resize);
    raf = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); };
  }, []);

  return (
    <>
      <canvas ref={ref} aria-hidden className="pointer-events-none fixed inset-0 z-0" />
      {grid && <div aria-hidden className="cyber-grid" />}
    </>
  );
}
