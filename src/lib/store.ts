import { prisma } from '@/lib/prisma';
import { products as mockProducts, type Product, type Tone } from '@/lib/mock-data';

type DbProduct = {
  id: string;
  slug: string;
  name: string;
  category: string;
  description: string;
  priceUsdc: number;
  edition: string;
  inventory: number;
  tone: string;
  images: string[];
  video: string | null;
};

function toProduct(r: DbProduct): Product {
  return {
    id: r.id,
    slug: r.slug,
    name: r.name,
    category: r.category,
    description: r.description,
    priceUsdc: r.priceUsdc,
    edition: r.edition,
    inventory: r.inventory,
    tone: (['blue', 'pink', 'cyan'].includes(r.tone) ? r.tone : 'blue') as Tone,
    images: r.images ?? [],
    video: r.video ?? undefined,
  };
}

/** Products for the storefront. Falls back to mock data if the DB isn't set up yet. */
export async function getProducts(): Promise<Product[]> {
  try {
    const rows = await prisma.product.findMany({ where: { active: true }, orderBy: { createdAt: 'desc' } });
    return rows.length ? rows.map(toProduct) : mockProducts;
  } catch {
    return mockProducts;
  }
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  try {
    const row = await prisma.product.findUnique({ where: { slug } });
    if (row) return toProduct(row);
  } catch {
    /* fall through to mock */
  }
  return mockProducts.find((p) => p.slug === slug) ?? null;
}

/** Returns a content block only when it exists AND is enabled AND has content. */
export async function getContentBlock(key: string) {
  try {
    const b = await prisma.contentBlock.findUnique({ where: { key } });
    if (b && b.enabled && (b.title || b.body || b.image)) return b;
  } catch {
    /* no db */
  }
  return null;
}

// ---------- Site settings (about text + creator links) ----------

export type SiteSettings = {
  aboutTitle: string;
  aboutBody: string;
  creatorName: string;
  creatorEmail: string;
  creatorX: string;
  creatorTelegram: string;
};

type SiteSettingsRow = {
  aboutTitle: string | null;
  aboutBody: string | null;
  creatorName: string | null;
  creatorEmail: string | null;
  creatorX: string | null;
  creatorTelegram: string | null;
};

type SettingsDelegate = {
  findUnique(args: { where: { id: string } }): Promise<SiteSettingsRow | null>;
  upsert(args: {
    where: { id: string };
    update: Record<string, string | undefined>;
    create: Record<string, string | undefined> & { id: string };
  }): Promise<SiteSettingsRow>;
};

/**
 * Typed accessor for the SiteSettings model. We cast here because the generated
 * Prisma client only includes this model after `npm run db:push` (or
 * `prisma generate`) has been run for the new schema.
 */
export function settingsTable(): SettingsDelegate {
  return (prisma as unknown as { siteSettings: SettingsDelegate }).siteSettings;
}

const EMPTY_SETTINGS: SiteSettings = {
  aboutTitle: '', aboutBody: '', creatorName: '', creatorEmail: '', creatorX: '', creatorTelegram: '',
};

/** Editable site settings (about + creator links). Safe defaults if no DB/row. */
export async function getSiteSettings(): Promise<SiteSettings> {
  try {
    const s = await settingsTable().findUnique({ where: { id: 'site' } });
    if (!s) return EMPTY_SETTINGS;
    return {
      aboutTitle: s.aboutTitle ?? '',
      aboutBody: s.aboutBody ?? '',
      creatorName: s.creatorName ?? '',
      creatorEmail: s.creatorEmail ?? '',
      creatorX: s.creatorX ?? '',
      creatorTelegram: s.creatorTelegram ?? '',
    };
  } catch {
    return EMPTY_SETTINGS;
  }
}

// ---------- Auctions (off-chain mirror; bid state lives on-chain) ----------

export type AuctionRow = {
  id: string;
  auctionId: number | null;
  tokenId: number | null;
  title: string;
  description: string;
  image: string;
  startBid: number;
  durationSec: number;
  endTime: Date | null;
  txHash: string | null;
  status: string;
  winner: string | null;
  winAmount: number | null;
  createdAt: Date;
};

type AuctionDelegate = {
  create(args: { data: Record<string, unknown> }): Promise<AuctionRow>;
  findUnique(args: { where: { id: string } }): Promise<AuctionRow | null>;
  findMany(args?: { where?: Record<string, unknown>; orderBy?: Record<string, unknown> }): Promise<AuctionRow[]>;
  update(args: { where: { id: string }; data: Record<string, unknown> }): Promise<AuctionRow>;
  delete(args: { where: { id: string } }): Promise<AuctionRow>;
};

/** Typed accessor for the Auction model (available after `npm run db:push`). */
export function auctionTable(): AuctionDelegate {
  return (prisma as unknown as { auction: AuctionDelegate }).auction;
}

export async function getAuctions(statuses: string[] = ['LIVE', 'SETTLED']): Promise<AuctionRow[]> {
  try {
    const rows = await auctionTable().findMany({ orderBy: { createdAt: 'desc' } });
    return rows.filter((a) => statuses.includes(a.status));
  } catch {
    return [];
  }
}

export async function hasLiveAuction(): Promise<boolean> {
  try {
    const rows = await auctionTable().findMany({ where: { status: 'LIVE' } });
    return rows.length > 0;
  } catch {
    return false;
  }
}
