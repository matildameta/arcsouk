'use client';

import { useState } from 'react';
import { Reveal } from '@/components/site/reveal';
import { ProductCard } from '@/components/ui/product-card';
import { type Product } from '@/lib/mock-data';
import { cn } from '@/lib/utils';

const filters = [
  { id: 'all', label: 'All' },
  { id: 'gypsum', label: 'Gypsum' },
  { id: 'plaster', label: 'Plaster' },
  { id: 'unique', label: '1 of 1' },
];

export function ShopGrid({ products }: { products: Product[] }) {
  const [active, setActive] = useState('all');

  const list = products.filter((p) => {
    if (active === 'all') return true;
    if (active === 'gypsum') return p.category.toLowerCase().includes('gypsum');
    if (active === 'plaster') return p.category.toLowerCase().includes('plaster');
    if (active === 'unique') return p.edition.replace(/\s/g, '') === '1/1';
    return true;
  });

  return (
    <div className="px-9 pb-32 pt-[140px]">
      <div className="mx-auto max-w-[1220px]">
        <Reveal>
          <div className="mb-4 font-mono text-xs uppercase tracking-[.2em] text-ink3">The collection</div>
        </Reveal>
        <Reveal>
          <h1 className="font-display text-[clamp(2.4rem,5vw,4rem)] font-semibold tracking-[-.03em]">Shop every edition</h1>
        </Reveal>

        <div className="mt-8 flex flex-wrap gap-2">
          {filters.map((f) => (
            <button
              key={f.id}
              data-cursor
              onClick={() => setActive(f.id)}
              className={cn(
                'rounded-full border px-4 py-2 font-mono text-[12px] transition',
                active === f.id ? 'border-transparent bg-brand text-white' : 'border-line text-ink2 hover:text-ink',
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="mt-10 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3 lg:gap-[26px]">
          {list.map((p, i) => (
            <Reveal key={p.id} delay={(i % 3) * 0.06}>
              <ProductCard product={p} />
            </Reveal>
          ))}
        </div>
      </div>
    </div>
  );
}
