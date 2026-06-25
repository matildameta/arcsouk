'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * Full-screen image lightbox.
 *
 * Rendered through a portal to <body> so it escapes any ancestor stacking
 * context (e.g. the `<main className="relative z-[4]">` wrapper) and therefore
 * always paints above the fixed navbar.
 *
 * Features: ←/→ arrow-key + button navigation, drag-to-swipe, an "n / total"
 * counter, Esc-to-close, backdrop click to close, and body scroll-lock.
 */
export function Lightbox({
  open,
  images,
  index,
  onClose,
  onIndexChange,
  alt = '',
}: {
  open: boolean;
  images: string[];
  index: number;
  onClose: () => void;
  onIndexChange: (i: number) => void;
  alt?: string;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const count = images.length;
  const multiple = count > 1;

  // Track the travel direction so the slide animation knows which way to move.
  const prevIndex = useRef(index);
  const direction = index >= prevIndex.current ? 1 : -1;
  useEffect(() => {
    prevIndex.current = index;
  }, [index]);

  const go = useCallback(
    (delta: number) => {
      if (count < 2) return;
      onIndexChange((index + delta + count) % count);
    },
    [count, index, onIndexChange],
  );

  // Keyboard nav + Esc, and lock body scroll while open.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowRight') go(1);
      else if (e.key === 'ArrowLeft') go(-1);
    };
    window.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, go, onClose]);

  if (!mounted) return null;

  const src = images[index];

  return createPortal(
    <AnimatePresence>
      {open && src && (
        <motion.div
          key="lightbox"
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm sm:p-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          {/* Close */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="absolute right-4 top-4 z-[2] grid h-11 w-11 place-items-center rounded-full bg-white/10 text-white backdrop-blur transition hover:bg-white/20 sm:right-6 sm:top-6"
          >
            <X size={22} />
          </button>

          {/* Prev / Next */}
          {multiple && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  go(-1);
                }}
                aria-label="Previous image"
                className="absolute left-3 top-1/2 z-[2] grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white backdrop-blur transition hover:bg-white/20 sm:left-6"
              >
                <ChevronLeft size={26} />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  go(1);
                }}
                aria-label="Next image"
                className="absolute right-3 top-1/2 z-[2] grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white backdrop-blur transition hover:bg-white/20 sm:right-6"
              >
                <ChevronRight size={26} />
              </button>
            </>
          )}

          {/* Image (keyed so each change slides in) */}
          <AnimatePresence mode="popLayout" custom={direction} initial={false}>
            <motion.img
              key={index}
              src={src}
              alt={alt}
              custom={direction}
              variants={{
                enter: (d: number) => ({ x: d > 0 ? 80 : -80, opacity: 0 }),
                center: { x: 0, opacity: 1 },
                exit: (d: number) => ({ x: d > 0 ? -80 : 80, opacity: 0 }),
              }}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ x: { type: 'spring', stiffness: 300, damping: 30 }, opacity: { duration: 0.2 } }}
              drag={multiple ? 'x' : false}
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.18}
              onDragEnd={(_, info) => {
                if (info.offset.x < -80) go(1);
                else if (info.offset.x > 80) go(-1);
              }}
              onClick={(e) => e.stopPropagation()}
              className="max-h-[88vh] max-w-[92vw] cursor-grab rounded-2xl object-contain shadow-2xl active:cursor-grabbing"
            />
          </AnimatePresence>

          {/* Counter */}
          {multiple && (
            <div className="pointer-events-none absolute bottom-5 left-1/2 -translate-x-1/2 rounded-full bg-black/45 px-3.5 py-1.5 font-mono text-[12px] tracking-wide text-white backdrop-blur">
              {index + 1} / {count}
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
