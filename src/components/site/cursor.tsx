'use client';

import { useEffect, useRef } from 'react';

export function Cursor() {
  const dot = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fine = window.matchMedia('(pointer: fine)').matches;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!fine || reduce) return;

    document.body.classList.add('cursor-on');
    let mx = window.innerWidth / 2;
    let my = window.innerHeight / 2;
    let rx = mx;
    let ry = my;
    let raf = 0;

    const move = (e: PointerEvent) => {
      mx = e.clientX;
      my = e.clientY;
      if (dot.current) {
        dot.current.style.left = `${mx}px`;
        dot.current.style.top = `${my}px`;
      }
    };
    const loop = () => {
      rx += (mx - rx) * 0.18;
      ry += (my - ry) * 0.18;
      if (ring.current) {
        ring.current.style.left = `${rx}px`;
        ring.current.style.top = `${ry}px`;
      }
      raf = requestAnimationFrame(loop);
    };

    const over = (e: Event) => {
      const t = e.target as HTMLElement;
      if (t.closest('a,button,[data-cursor]')) ring.current?.classList.add('big');
    };
    const out = () => ring.current?.classList.remove('big');

    window.addEventListener('pointermove', move);
    window.addEventListener('mouseover', over);
    window.addEventListener('mouseout', out);
    raf = requestAnimationFrame(loop);

    return () => {
      document.body.classList.remove('cursor-on');
      window.removeEventListener('pointermove', move);
      window.removeEventListener('mouseover', over);
      window.removeEventListener('mouseout', out);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <>
      <div ref={ring} className="cursor-ring" aria-hidden />
      <div ref={dot} className="cursor-dot" aria-hidden />
    </>
  );
}
