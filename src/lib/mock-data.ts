export type Tone = 'blue' | 'pink' | 'cyan';

export type Product = {
  id: string;
  slug: string;
  name: string;
  category: string;
  priceUsdc: number;
  edition: string;
  inventory: number;
  description: string;
  tone: Tone;
  /** Real media is wired in later (Vercel Blob). For now we render stylized placeholders. */
  images: string[];
  video?: string;
};

export const products: Product[] = [
  {
    id: 'p1',
    slug: 'monolith-no-7',
    name: 'Monolith No. 7',
    category: 'Gypsum · hand-finished',
    priceUsdc: 240,
    edition: '1 / 12',
    inventory: 12,
    description:
      'A hand-cast gypsum monolith finished over four days. Matte body, polished edge, a single edition of twelve.',
    tone: 'blue',
    images: [],
  },
  {
    id: 'p2',
    slug: 'aperture',
    name: 'Aperture',
    category: 'Plaster · pigment wash',
    priceUsdc: 180,
    edition: '1 / 8',
    inventory: 8,
    description:
      'Plaster with a hand-rubbed pigment wash that pools in the recesses. Each one drinks the pigment differently.',
    tone: 'pink',
    images: [],
  },
  {
    id: 'p3',
    slug: 'veil-study',
    name: 'Veil Study',
    category: 'Gypsum · unique',
    priceUsdc: 320,
    edition: '1 / 1',
    inventory: 1,
    description: 'A unique study in folded gypsum — one of one, never repeated.',
    tone: 'cyan',
    images: [],
  },
  {
    id: 'p4',
    slug: 'cast-shadow',
    name: 'Cast Shadow',
    category: 'Plaster · charcoal',
    priceUsdc: 210,
    edition: '1 / 10',
    inventory: 10,
    description: 'Charcoal-tinted plaster that reads differently as the light moves around it.',
    tone: 'blue',
    images: [],
  },
  {
    id: 'p5',
    slug: 'lumen',
    name: 'Lumen',
    category: 'Gypsum · pearl finish',
    priceUsdc: 280,
    edition: '1 / 6',
    inventory: 6,
    description: 'A pearl-finished gypsum form that catches and scatters light along its curve.',
    tone: 'cyan',
    images: [],
  },
  {
    id: 'p6',
    slug: 'meridian',
    name: 'Meridian',
    category: 'Plaster · unique',
    priceUsdc: 360,
    edition: '1 / 1',
    inventory: 1,
    description: 'A single, sweeping plaster arc — the studio’s signature form, made once.',
    tone: 'pink',
    images: [],
  },
];

export const toneStyles: Record<Tone, { art: string; obj: string }> = {
  blue: {
    art: 'radial-gradient(120% 90% at 30% 15%,rgba(45,124,255,.55),transparent 60%),radial-gradient(120% 100% at 80% 95%,rgba(34,211,238,.45),transparent 55%),linear-gradient(160deg,#dfe7fb,#c4d0ef)',
    obj: 'linear-gradient(150deg,#FFFFFF,#C2CEEC 60%,#8092C2)',
  },
  pink: {
    art: 'radial-gradient(120% 90% at 70% 15%,rgba(240,91,196,.45),transparent 60%),radial-gradient(120% 100% at 20% 95%,rgba(124,92,255,.45),transparent 55%),linear-gradient(160deg,#f3e6f6,#ddc8e6)',
    obj: 'linear-gradient(150deg,#FFFFFF,#E8CFE2 60%,#C295B8)',
  },
  cyan: {
    art: 'radial-gradient(120% 90% at 50% 10%,rgba(34,211,238,.5),transparent 60%),radial-gradient(120% 100% at 50% 100%,rgba(45,124,255,.4),transparent 55%),linear-gradient(160deg,#dff0f6,#c2dceb)',
    obj: 'linear-gradient(150deg,#FFFFFF,#BFDDEA 60%,#86AEC2)',
  },
};

export function getProduct(slug: string) {
  return products.find((p) => p.slug === slug);
}
