'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Box, ShoppingBag, Coins, Clock, Plus, Pencil, Trash2, X, Upload, Loader2, Truck, Check } from 'lucide-react';
import { formatUsdc } from '@/lib/utils';

type AdminProduct = {
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
  active: boolean;
};
type AdminOrder = {
  id: string;
  orderRef: string;
  amountUsdc: number;
  status: string;
  txHash: string | null;
  buyerEmail: string;
  shippingAddress: string;
  phone: string;
  walletAddress: string;
  productName: string;
  createdAt: string;
};
type Banner = { title: string; body: string; enabled: boolean };
type SiteSettingsForm = {
  aboutTitle: string;
  aboutBody: string;
  creatorName: string;
  creatorEmail: string;
  creatorX: string;
  creatorTelegram: string;
};

type FormState = Partial<AdminProduct> & { id?: string };

const STATUS_C: Record<string, string> = {
  AWAITING_PAYMENT: 'var(--warn)',
  PAID: 'var(--ok)',
  SHIPPED: 'var(--info)',
  CANCELLED: 'var(--text-3)',
};
const STATUS_LABEL: Record<string, string> = {
  AWAITING_PAYMENT: 'Awaiting payment',
  PAID: 'Paid',
  SHIPPED: 'Shipped',
  CANCELLED: 'Cancelled',
};

const empty: FormState = {
  slug: '', name: '', category: '', description: '', priceUsdc: 0, edition: '1 / 1', inventory: 1, tone: 'blue', images: [], video: null, active: true,
};

export function AdminDashboard({ products, orders, banner, settings }: { products: AdminProduct[]; orders: AdminOrder[]; banner: Banner; settings: SiteSettingsForm }) {
  const router = useRouter();
  const [form, setForm] = useState<FormState | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [bannerState, setBannerState] = useState<Banner>(banner);
  const [bannerSaving, setBannerSaving] = useState(false);
  const [bannerMsg, setBannerMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [siteState, setSiteState] = useState<SiteSettingsForm>(settings);
  const [siteSaving, setSiteSaving] = useState(false);
  const [siteMsg, setSiteMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const revenue = orders.filter((o) => o.status === 'PAID' || o.status === 'SHIPPED').reduce((s, o) => s + o.amountUsdc, 0);
  const shipped = orders.filter((o) => o.status === 'SHIPPED').length;
  const metrics = [
    { label: 'Products', value: String(products.length), icon: Box },
    { label: 'Orders', value: String(orders.length), icon: ShoppingBag },
    { label: 'Revenue (USDC)', value: formatUsdc(revenue), icon: Coins },
    { label: 'Shipped', value: String(shipped), icon: Truck },
  ];

  const set = (patch: Partial<FormState>) => setForm((f) => ({ ...(f as FormState), ...patch }));

  async function save() {
    if (!form) return;
    setSaving(true);
    setError('');
    try {
      const res = await fetch(form.id ? `/api/admin/products/${form.id}` : '/api/admin/products', {
        method: form.id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || 'Save failed');
      setForm(null);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  async function del(id: string) {
    if (!confirm('Delete this product?')) return;
    await fetch(`/api/admin/products/${id}`, { method: 'DELETE' });
    router.refresh();
  }

  async function upload(file: File, kind: 'image' | 'video') {
    setUploading(true);
    setError('');
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/admin/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');
      if (kind === 'image') set({ images: [...(form?.images ?? []), data.url] });
      else set({ video: data.url });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  }

  async function setStatus(id: string, status: string) {
    await fetch(`/api/admin/orders/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    router.refresh();
  }

  async function delOrder(id: string) {
    if (!confirm('Delete this order? This cannot be undone.')) return;
    await fetch(`/api/admin/orders/${id}`, { method: 'DELETE' });
    router.refresh();
  }

  async function saveBanner() {
    setBannerSaving(true);
    setBannerMsg(null);
    try {
      const res = await fetch('/api/admin/content', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'home_banner', ...bannerState }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Could not save banner');
      setBannerMsg({ ok: true, text: bannerState.enabled ? 'Saved — banner is live on the homepage.' : 'Saved — banner is hidden.' });
      router.refresh();
    } catch (e) {
      setBannerMsg({ ok: false, text: e instanceof Error ? e.message : 'Could not save banner' });
    } finally {
      setBannerSaving(false);
    }
  }

  async function saveSettings() {
    setSiteSaving(true);
    setSiteMsg(null);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(siteState),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Could not save');
      setSiteMsg({ ok: true, text: 'Saved — your About page and footer are updated.' });
      router.refresh();
    } catch (e) {
      setSiteMsg({ ok: false, text: e instanceof Error ? e.message : 'Could not save' });
    } finally {
      setSiteSaving(false);
    }
  }

  const inputCls = 'w-full rounded-xl border border-line bg-surface2 px-4 py-3 text-[14px] text-ink outline-none transition focus:border-accent';

  return (
    <div className="px-9 pb-32 pt-[140px]">
      <div className="mx-auto max-w-[1220px]">
        <div className="mb-4 font-mono text-xs uppercase tracking-[.2em] text-ink3">Admin · restricted to ADMIN_EMAILS</div>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h1 className="font-display text-[clamp(2.2rem,4.5vw,3.4rem)] font-semibold tracking-[-.03em]">Dashboard</h1>
          <button onClick={() => { setForm({ ...empty }); setError(''); }} data-cursor className="inline-flex items-center gap-2 rounded-full bg-brand px-5 py-3 font-semibold text-white shadow-glow transition hover:-translate-y-[2px]">
            <Plus size={17} /> New product
          </button>
        </div>

        <div className="mt-10 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {metrics.map((m) => (
            <div key={m.label} className="rounded-2xl border border-line bg-surface p-5 backdrop-blur">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[12px] text-ink3">{m.label}</span>
                <m.icon size={18} className="text-accent" />
              </div>
              <div className="mt-3 font-mono text-[1.8rem] font-semibold">{m.value}</div>
            </div>
          ))}
        </div>

        <div className="mt-8 grid grid-cols-1 gap-7 lg:grid-cols-[1.3fr_1fr]">
          {/* Products */}
          <div className="rounded-3xl border border-line bg-surface p-6 backdrop-blur">
            <div className="mb-4 font-display text-[1.2rem] font-medium">Products</div>
            {products.length === 0 && <p className="text-[13px] text-ink3">No products yet. Connect the database and run <span className="font-mono">npm run db:seed</span>, or add one above.</p>}
            <div className="space-y-2">
              {products.map((p) => (
                <div key={p.id} className="flex items-center justify-between rounded-xl border border-line bg-surface2 px-4 py-3">
                  <div>
                    <div className="font-medium">{p.name} {!p.active && <span className="ml-1 font-mono text-[11px] text-ink3">(hidden)</span>}</div>
                    <div className="font-mono text-[12px] text-ink3">{formatUsdc(p.priceUsdc)} USDC · stock {p.inventory} · {p.edition}</div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => { setForm({ ...p }); setError(''); }} data-cursor className="grid h-9 w-9 place-items-center rounded-lg border border-line transition hover:border-lineStrong" aria-label="Edit"><Pencil size={15} /></button>
                    <button onClick={() => del(p.id)} data-cursor className="grid h-9 w-9 place-items-center rounded-lg border border-line text-[color:var(--warn)] transition hover:border-lineStrong" aria-label="Delete"><Trash2 size={15} /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Orders */}
          <div className="rounded-3xl border border-line bg-surface p-6 backdrop-blur">
            <div className="mb-4 font-display text-[1.2rem] font-medium">Orders</div>
            {orders.length === 0 && <p className="text-[13px] text-ink3">No orders yet.</p>}
            <div className="max-h-[460px] space-y-2 overflow-y-auto pr-1">
              {orders.map((o) => (
                <div key={o.id} className="rounded-xl border border-line bg-surface2 p-4">
                  <div className="flex items-center justify-between">
                    <div className="font-medium">{o.productName}</div>
                    <div className="font-mono text-[13px] font-semibold">{formatUsdc(o.amountUsdc)} USDC</div>
                  </div>
                  <div className="mt-1 font-mono text-[12px] text-ink3">{o.buyerEmail || 'guest'} · {o.orderRef}</div>
                  {o.shippingAddress && <div className="mt-1 text-[12px] text-ink2">{o.shippingAddress} · {o.phone}</div>}
                  {o.txHash && <div className="mt-1 truncate font-mono text-[11px] text-accent">tx {o.txHash}</div>}
                  <div className="mt-3 flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-2 rounded-full px-3 py-1 font-mono text-[11px] font-medium" style={{ color: STATUS_C[o.status], background: `color-mix(in srgb, ${STATUS_C[o.status]} 14%, transparent)` }}>
                      <span className="h-[6px] w-[6px] rounded-full" style={{ background: STATUS_C[o.status] }} />
                      {STATUS_LABEL[o.status] ?? o.status}
                    </span>
                    <div className="flex gap-1.5">
                      <button onClick={() => delOrder(o.id)} data-cursor className="inline-flex items-center gap-1 rounded-lg border border-line px-2.5 py-1.5 text-[12px] text-[color:var(--warn)] transition hover:border-lineStrong" aria-label="Delete order"><Trash2 size={13} /></button>
                      {o.status === 'AWAITING_PAYMENT' && (
                        <button onClick={() => setStatus(o.id, 'PAID')} data-cursor className="inline-flex items-center gap-1 rounded-lg border border-line px-2.5 py-1.5 text-[12px] transition hover:border-lineStrong"><Check size={13} /> Paid</button>
                      )}
                      {(o.status === 'PAID' || o.status === 'AWAITING_PAYMENT') && (
                        <button onClick={() => setStatus(o.id, 'SHIPPED')} data-cursor className="inline-flex items-center gap-1 rounded-lg border border-line px-2.5 py-1.5 text-[12px] transition hover:border-lineStrong"><Truck size={13} /> Shipped</button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Content block */}
        <div className="mt-8 rounded-3xl border border-line bg-surface p-6 backdrop-blur">
          <div className="mb-1 font-display text-[1.2rem] font-medium">Homepage banner</div>
          <p className="mb-4 text-[13px] text-ink3">Optional. Fill it and enable it to show a banner on the homepage; disable to hide it.</p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <input value={bannerState.title} onChange={(e) => setBannerState({ ...bannerState, title: e.target.value })} placeholder="Banner title" className={inputCls} />
            <input value={bannerState.body} onChange={(e) => setBannerState({ ...bannerState, body: e.target.value })} placeholder="Banner text" className={inputCls} />
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-4">
            <label className="flex items-center gap-2 text-[14px]">
              <input type="checkbox" checked={bannerState.enabled} onChange={(e) => setBannerState({ ...bannerState, enabled: e.target.checked })} /> Enabled
            </label>
            <button onClick={saveBanner} disabled={bannerSaving} data-cursor className="inline-flex items-center gap-2 rounded-full bg-brand px-5 py-2.5 font-semibold text-white shadow-glow transition hover:-translate-y-[1px] disabled:opacity-60">
              {bannerSaving && <Loader2 size={15} className="animate-spin" />} Save banner
            </button>
            {bannerMsg && (
              <span className={`inline-flex items-center gap-1.5 text-[13px] ${bannerMsg.ok ? 'text-[color:var(--ok)]' : 'text-[color:var(--warn)]'}`}>
                {bannerMsg.ok && <Check size={14} />} {bannerMsg.text}
              </span>
            )}
          </div>
        </div>

        {/* About page & creator */}
        <div className="mt-8 rounded-3xl border border-line bg-surface p-6 backdrop-blur">
          <div className="mb-1 font-display text-[1.2rem] font-medium">About page &amp; creator</div>
          <p className="mb-4 text-[13px] text-ink3">Shown on the public <span className="font-mono">/about</span> page and in the footer. Leave a field empty to hide it.</p>
          <div className="space-y-3">
            <input value={siteState.aboutTitle} onChange={(e) => setSiteState({ ...siteState, aboutTitle: e.target.value })} placeholder="About title (e.g. About Arc Souk)" className={inputCls} />
            <textarea value={siteState.aboutBody} onChange={(e) => setSiteState({ ...siteState, aboutBody: e.target.value })} rows={5} placeholder="About text — describe the project. Press Enter for a new paragraph." className={inputCls} />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <input value={siteState.creatorName} onChange={(e) => setSiteState({ ...siteState, creatorName: e.target.value })} placeholder="Creator name" className={inputCls} />
              <input value={siteState.creatorEmail} onChange={(e) => setSiteState({ ...siteState, creatorEmail: e.target.value })} placeholder="Creator email" className={inputCls} />
              <input value={siteState.creatorX} onChange={(e) => setSiteState({ ...siteState, creatorX: e.target.value })} placeholder="X / Twitter (handle or URL)" className={inputCls} />
              <input value={siteState.creatorTelegram} onChange={(e) => setSiteState({ ...siteState, creatorTelegram: e.target.value })} placeholder="Telegram (handle or URL)" className={inputCls} />
            </div>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-4">
            <button onClick={saveSettings} disabled={siteSaving} data-cursor className="inline-flex items-center gap-2 rounded-full bg-brand px-5 py-2.5 font-semibold text-white shadow-glow transition hover:-translate-y-[1px] disabled:opacity-60">
              {siteSaving && <Loader2 size={15} className="animate-spin" />} Save about &amp; creator
            </button>
            {siteMsg && (
              <span className={`inline-flex items-center gap-1.5 text-[13px] ${siteMsg.ok ? 'text-[color:var(--ok)]' : 'text-[color:var(--warn)]'}`}>
                {siteMsg.ok && <Check size={14} />} {siteMsg.text}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Product form modal */}
      {form && (
        <div className="fixed inset-0 z-[100] grid place-items-center bg-black/50 p-4 backdrop-blur-sm" onClick={() => setForm(null)}>
          <div className="max-h-[88vh] w-full max-w-[560px] overflow-auto rounded-3xl border border-line bg-bg p-6" onClick={(e) => e.stopPropagation()}>
            <div className="mb-5 flex items-center justify-between">
              <div className="font-display text-[1.4rem] font-semibold">{form.id ? 'Edit product' : 'New product'}</div>
              <button onClick={() => setForm(null)} className="grid h-9 w-9 place-items-center rounded-lg border border-line"><X size={16} /></button>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <input className={inputCls} placeholder="Name" value={form.name ?? ''} onChange={(e) => set({ name: e.target.value })} />
              <input className={inputCls} placeholder="slug-like-this" value={form.slug ?? ''} onChange={(e) => set({ slug: e.target.value })} />
              <input className={inputCls} placeholder="Category" value={form.category ?? ''} onChange={(e) => set({ category: e.target.value })} />
              <input className={inputCls} placeholder="Edition (e.g. 1 / 12)" value={form.edition ?? ''} onChange={(e) => set({ edition: e.target.value })} />
              <input className={inputCls} type="number" placeholder="Price (USDC)" value={form.priceUsdc ?? 0} onChange={(e) => set({ priceUsdc: Number(e.target.value) })} />
              <input className={inputCls} type="number" placeholder="Inventory" value={form.inventory ?? 0} onChange={(e) => set({ inventory: Number(e.target.value) })} />
              <select className={inputCls} value={form.tone ?? 'blue'} onChange={(e) => set({ tone: e.target.value })}>
                <option value="blue">Tone · blue</option>
                <option value="pink">Tone · pink</option>
                <option value="cyan">Tone · cyan</option>
              </select>
              <label className="flex items-center gap-2 px-1 text-[14px]">
                <input type="checkbox" checked={form.active ?? true} onChange={(e) => set({ active: e.target.checked })} /> Visible on store
              </label>
            </div>
            <textarea className={`${inputCls} mt-3`} rows={3} placeholder="Description" value={form.description ?? ''} onChange={(e) => set({ description: e.target.value })} />

            {/* Media */}
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-line px-4 py-2.5 text-[13px] transition hover:border-lineStrong">
                <Upload size={15} /> Add image
                <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0], 'image')} />
              </label>
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-line px-4 py-2.5 text-[13px] transition hover:border-lineStrong">
                <Upload size={15} /> Set video
                <input type="file" accept="video/*" className="hidden" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0], 'video')} />
              </label>
              {uploading && <Loader2 size={16} className="animate-spin text-accent" />}
            </div>
            {(form.images?.length ?? 0) > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {form.images!.map((url, i) => (
                  <div key={i} className="relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt="" className="h-16 w-16 rounded-lg border border-line object-cover" />
                    <button onClick={() => set({ images: form.images!.filter((_, j) => j !== i) })} className="absolute -right-1.5 -top-1.5 grid h-5 w-5 place-items-center rounded-full bg-bg text-[color:var(--warn)]"><X size={12} /></button>
                  </div>
                ))}
              </div>
            )}
            {form.video && <div className="mt-2 truncate font-mono text-[11px] text-accent">video: {form.video} <button className="text-[color:var(--warn)]" onClick={() => set({ video: null })}>remove</button></div>}

            {error && <p className="mt-4 text-[13px] text-[color:var(--warn)]">{error}</p>}
            <div className="mt-6 flex justify-end gap-2">
              <button onClick={() => setForm(null)} className="rounded-full border border-line px-5 py-2.5 font-medium transition hover:border-lineStrong">Cancel</button>
              <button onClick={save} disabled={saving} data-cursor className="inline-flex items-center gap-2 rounded-full bg-brand px-6 py-2.5 font-semibold text-white shadow-glow transition hover:-translate-y-[1px] disabled:opacity-60">
                {saving && <Loader2 size={15} className="animate-spin" />} {form.id ? 'Save changes' : 'Create product'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
