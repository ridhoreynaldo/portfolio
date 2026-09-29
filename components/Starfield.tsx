"use client";

import { useEffect, useRef } from "react";

interface Star {
  x: number;
  y: number;
  r: number;
  baseAlpha: number;
  phase: number;
  speed: number;
}

interface Meteor {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
}

/** Latar bintang berkelip + meteor sesekali, fixed di belakang konten. */
export default function Starfield() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let w = 0;
    let h = 0;
    let stars: Star[] = [];
    let meteors: Meteor[] = [];
    let raf = 0;
    let lastMeteor = 0;

    const resize = () => {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
      const count = Math.min(220, Math.floor((w * h) / 9000));
      stars = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        r: Math.random() * 1.4 + 0.3,
        baseAlpha: Math.random() * 0.5 + 0.25,
        phase: Math.random() * Math.PI * 2,
        speed: Math.random() * 0.9 + 0.3,
      }));
    };

    const spawnMeteor = (now: number) => {
      if (now - lastMeteor < 4500 + Math.random() * 5000) return;
      lastMeteor = now;
      const x = Math.random() * w * 0.7 + w * 0.15;
      meteors.push({
        x,
        y: -20,
        vx: -(2.5 + Math.random() * 2),
        vy: 3.5 + Math.random() * 2.5,
        life: 0,
        maxLife: 90 + Math.random() * 40,
      });
    };

    const draw = (now: number) => {
      ctx.clearRect(0, 0, w, h);

      // nebula lembut
      const g1 = ctx.createRadialGradient(w * 0.2, h * 0.15, 0, w * 0.2, h * 0.15, w * 0.45);
      g1.addColorStop(0, "rgba(124,58,237,0.14)");
      g1.addColorStop(1, "rgba(124,58,237,0)");
      ctx.fillStyle = g1;
      ctx.fillRect(0, 0, w, h);
      const g2 = ctx.createRadialGradient(w * 0.85, h * 0.8, 0, w * 0.85, h * 0.8, w * 0.4);
      g2.addColorStop(0, "rgba(34,211,238,0.10)");
      g2.addColorStop(1, "rgba(34,211,238,0)");
      ctx.fillStyle = g2;
      ctx.fillRect(0, 0, w, h);

      for (const s of stars) {
        const tw = s.baseAlpha + Math.sin(now / 1000 * s.speed + s.phase) * 0.25;
        ctx.globalAlpha = Math.max(0.05, tw);
        ctx.fillStyle = "#cdd6ff";
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      spawnMeteor(now);
      meteors = meteors.filter((m) => m.life < m.maxLife);
      for (const m of meteors) {
        m.life++;
        m.x += m.vx;
        m.y += m.vy;
        const fade = 1 - m.life / m.maxLife;
        const grad = ctx.createLinearGradient(m.x, m.y, m.x - m.vx * 12, m.y - m.vy * 12);
        grad.addColorStop(0, `rgba(190,230,255,${0.9 * fade})`);
        grad.addColorStop(1, "rgba(190,230,255,0)");
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(m.x, m.y);
        ctx.lineTo(m.x - m.vx * 12, m.y - m.vy * 12);
        ctx.stroke();
      }

      raf = requestAnimationFrame(draw);
    };

    resize();
    window.addEventListener("resize", resize);
    raf = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={ref}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-0"
    />
  );
}
