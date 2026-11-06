"use client";

import { useEffect, useRef } from "react";

type Star = { x: number; y: number; r: number; a: number; phase: number; speed: number; hue: 0 | 1 | 2; depth: number };
type Meteor = { x: number; y: number; vx: number; vy: number; life: number; max: number };

/**
 * Latar galaksi hero Leetcloud (diadaptasi dari Starfield portofolio, tapi hanya mengisi hero):
 * bintang berkelip, meteor sesekali, planet bercincin, dan parallax mengikuti kursor.
 * Berhenti saat hero tidak terlihat / tab tidak aktif; statis bila prefers-reduced-motion.
 */
export function HeroGalaxy() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const host = canvas?.parentElement;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !host || !ctx) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    let w = 0, h = 0, raf = 0, lastMeteor = 0, visible = true;
    let stars: Star[] = [];
    let meteors: Meteor[] = [];
    // parallax: posisi kursor (-1..1), dihaluskan
    const target = { x: 0, y: 0 };
    const cur = { x: 0, y: 0 };

    const resize = () => {
      const r = host.getBoundingClientRect();
      w = r.width; h = r.height;
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
      canvas.style.width = `${w}px`; canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.min(220, Math.floor((w * h) / 4200));
      stars = Array.from({ length: count }, () => ({
        x: Math.random() * w, y: Math.random() * h, r: Math.random() * 1.4 + 0.3,
        a: Math.random() * 0.5 + 0.3, phase: Math.random() * Math.PI * 2, speed: Math.random() * 0.9 + 0.3,
        hue: Math.random() < 0.14 ? 1 : Math.random() < 0.1 ? 2 : 0,
        depth: Math.random() * 0.9 + 0.1,
      }));
    };

    const planet = (now: number, ox: number, oy: number) => {
      const r = Math.min(w, h) * (w < 640 ? 0.09 : 0.11);
      const cx = w * (w < 640 ? 0.86 : 0.84) + ox * 18, cy = h * 0.24 + oy * 12;
      const glow = ctx.createRadialGradient(cx, cy, r, cx, cy, r * 2.8);
      glow.addColorStop(0, "rgba(139,92,246,0.22)"); glow.addColorStop(1, "rgba(139,92,246,0)");
      ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(cx, cy, r * 2.8, 0, Math.PI * 2); ctx.fill();
      const body = ctx.createRadialGradient(cx - r * 0.4, cy - r * 0.4, r * 0.1, cx, cy, r);
      body.addColorStop(0, "rgba(167,139,250,0.95)"); body.addColorStop(0.6, "rgba(76,29,149,0.95)"); body.addColorStop(1, "rgba(15,8,40,1)");
      ctx.fillStyle = body; ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
      ctx.save();
      ctx.translate(cx, cy); ctx.rotate(-0.35 + (reduced ? 0 : Math.sin(now / 6000) * 0.08)); ctx.scale(1, 0.28);
      for (const [rr, a, c] of [[r * 1.55, 0.6, "0,240,255"], [r * 1.8, 0.4, "255,43,214"], [r * 2.05, 0.22, "0,240,255"]] as const) {
        ctx.strokeStyle = `rgba(${c},${a})`; ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.arc(0, 0, rr, 0, Math.PI * 2); ctx.stroke();
      }
      ctx.restore();
    };

    const draw = (now: number) => {
      cur.x += (target.x - cur.x) * 0.06; cur.y += (target.y - cur.y) * 0.06;
      ctx.clearRect(0, 0, w, h);
      planet(now, cur.x, cur.y);
      for (const s of stars) {
        const px = s.x + cur.x * 22 * s.depth, py = s.y + cur.y * 14 * s.depth;
        ctx.globalAlpha = Math.max(0.06, s.a + (reduced ? 0 : Math.sin((now / 1000) * s.speed + s.phase) * 0.28));
        ctx.fillStyle = s.hue === 1 ? "#7df9ff" : s.hue === 2 ? "#ff8ae8" : "#dbe3ff";
        ctx.beginPath(); ctx.arc(px, py, s.r, 0, Math.PI * 2); ctx.fill();
      }
      ctx.globalAlpha = 1;
      if (reduced) return;

      if (now - lastMeteor > 2600 + Math.random() * 4200) {
        lastMeteor = now;
        meteors.push({ x: Math.random() * w * 0.8 + w * 0.15, y: -10, vx: -(2.6 + Math.random() * 2), vy: 2.6 + Math.random() * 2, life: 0, max: 70 + Math.random() * 40 });
      }
      meteors = meteors.filter((m) => m.life < m.max);
      for (const m of meteors) {
        m.life++; m.x += m.vx; m.y += m.vy;
        const fade = 1 - m.life / m.max;
        const g = ctx.createLinearGradient(m.x, m.y, m.x - m.vx * 16, m.y - m.vy * 16);
        g.addColorStop(0, `rgba(200,252,255,${0.95 * fade})`); g.addColorStop(1, "rgba(255,43,214,0)");
        ctx.strokeStyle = g; ctx.lineWidth = 1.8;
        ctx.beginPath(); ctx.moveTo(m.x, m.y); ctx.lineTo(m.x - m.vx * 16, m.y - m.vy * 16); ctx.stroke();
      }
      if (visible) raf = requestAnimationFrame(draw);
    };

    const start = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(draw); };
    const onMove = (e: PointerEvent) => {
      const r = host.getBoundingClientRect();
      target.x = ((e.clientX - r.left) / r.width) * 2 - 1;
      target.y = ((e.clientY - r.top) / r.height) * 2 - 1;
    };
    const onLeave = () => { target.x = 0; target.y = 0; };
    const io = new IntersectionObserver(([en]) => { visible = !!en?.isIntersecting && !document.hidden; if (visible) start(); });
    const onVis = () => { visible = !document.hidden; if (visible) start(); };
    const ro = new ResizeObserver(() => { resize(); if (reduced) draw(performance.now()); });

    resize();
    ro.observe(host);
    io.observe(host);
    document.addEventListener("visibilitychange", onVis);
    if (!reduced) { host.addEventListener("pointermove", onMove); host.addEventListener("pointerleave", onLeave); }
    start();
    return () => {
      cancelAnimationFrame(raf); ro.disconnect(); io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      host.removeEventListener("pointermove", onMove); host.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return <canvas ref={ref} aria-hidden className="hero-bg pointer-events-none absolute inset-0" />;
}
