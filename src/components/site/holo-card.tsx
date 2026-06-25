'use client';

import { useEffect, useRef } from 'react';

function Emblem() {
  return (
    <svg
      viewBox="0 0 160 140"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="A souk arch and trade coin dissolving into a digital network"
      style={{ width: 154, height: 136, display: 'block', filter: 'drop-shadow(0 10px 18px rgba(20,40,120,.28))' }}
    >
      <defs>
        <linearGradient id="arc-eg" x1="6" y1="6" x2="154" y2="134" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#0A5BFF" />
          <stop offset=".42" stopColor="#7C5CFF" />
          <stop offset=".72" stopColor="#F05BC4" />
          <stop offset="1" stopColor="#06B6D4" />
        </linearGradient>
      </defs>
      <path d="M34 128 L34 72 A46 46 0 0 1 126 72 L126 128" stroke="url(#arc-eg)" strokeWidth="3.4" strokeLinecap="round" />
      <path d="M20 128 L140 128" stroke="url(#arc-eg)" strokeWidth="3.2" strokeLinecap="round" />
      <path d="M41 124 L41 88 M49 124 L49 100" stroke="url(#arc-eg)" strokeWidth="2" strokeLinecap="round" opacity=".55" />
      <circle cx="80" cy="74" r="17" stroke="url(#arc-eg)" strokeWidth="3" />
      <path d="M80 65 L87 74 L80 83 L73 74 Z" fill="url(#arc-eg)" />
      <path d="M97 74 L116 86 M116 86 L129 104 M116 86 L103 112" stroke="url(#arc-eg)" strokeWidth="1.7" strokeDasharray="2 4.5" strokeLinecap="round" />
      <circle cx="116" cy="86" r="3.6" fill="url(#arc-eg)" />
      <circle cx="129" cy="104" r="3.1" fill="url(#arc-eg)" />
      <circle cx="103" cy="112" r="3" fill="url(#arc-eg)" />
      <rect x="120" y="120" width="4.4" height="4.4" rx="1.2" fill="url(#arc-eg)" />
      <rect x="131" y="115" width="3.6" height="3.6" rx="1" fill="url(#arc-eg)" opacity=".8" />
      <rect x="140" y="121" width="3" height="3" rx="1" fill="url(#arc-eg)" opacity=".55" />
    </svg>
  );
}

export function HoloCard() {
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let tRX = 0;
    let tRY = 0;
    let rX = 0;
    let rY = 0;
    let raf = 0;

    const move = (e: PointerEvent) => {
      const r = card.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      tRY = Math.max(-1, Math.min(1, (e.clientX - cx) / 320)) * 18;
      tRX = Math.max(-1, Math.min(1, (e.clientY - cy) / 320)) * -18;
    };

    const t0 = performance.now();
    const loop = (now: number) => {
      const t = (now - t0) * 0.001;
      rX += (tRX - rX) * 0.08;
      rY += (tRY - rY) * 0.08;
      const oy = Math.sin(t * 1.1) * 9;
      const orot = Math.sin(t * 0.55) * 9;
      const orx = Math.sin(t * 0.5) * 3;
      card.style.transform = `translateY(${oy.toFixed(1)}px) rotateX(${(rX + orx).toFixed(2)}deg) rotateY(${(rY + orot).toFixed(2)}deg)`;
      card.style.setProperty('--hx', `${(50 + (rY + orot) * 2).toFixed(1)}%`);
      card.style.setProperty('--hy', `${(50 + (rX + orx) * 2.4).toFixed(1)}%`);
      raf = requestAnimationFrame(loop);
    };

    window.addEventListener('pointermove', move);
    raf = requestAnimationFrame(loop);
    return () => {
      window.removeEventListener('pointermove', move);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div className="relative" style={{ perspective: '1300px' }}>
      <div
        ref={cardRef}
        className="card3d"
        style={{ width: 'clamp(290px,76vw,350px)', height: 'clamp(400px,104vw,470px)', borderRadius: 26 }}
      >
        <div className="holo" />
        <div className="gloss" />
        <div className="sheen" />
        <div className="rim" />
        <div className="relative z-[4] flex h-full flex-col justify-between p-7" style={{ transform: 'translateZ(30px)', color: '#0B1230' }}>
          <div className="flex items-center justify-between">
            <span
              className="h-[34px] w-[46px] rounded-[7px]"
              style={{ background: 'linear-gradient(135deg,#FFEDB6,#E9B95F 50%,#C68C2C)', boxShadow: 'inset 0 1px 2px rgba(255,255,255,.75),inset 0 -2px 5px rgba(120,80,10,.35)' }}
            />
            <span
              className="h-[26px] w-[36px] rounded-[6px]"
              style={{ background: 'conic-gradient(from 90deg,#9fb6ff,#dabfff,#ffc6ea,#bff4ff,#9fb6ff)', boxShadow: 'inset 0 0 7px rgba(255,255,255,.7)' }}
            />
          </div>
          <div className="self-center" style={{ transform: 'translateZ(20px)' }}>
            <Emblem />
          </div>
          <div className="text-center font-display text-[3rem] font-semibold leading-none tracking-tight" style={{ transform: 'translateZ(44px)' }}>
            ARC <span className="bg-brand-text bg-clip-text text-transparent">Souk</span>
          </div>
        </div>
      </div>
    </div>
  );
}
