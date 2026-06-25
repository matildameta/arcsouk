'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAccount } from 'wagmi';
import { signOut } from 'next-auth/react';
import { Twitter, MessageCircle, Wallet, User, Loader2, LogOut, Check } from 'lucide-react';
import { formatUsdc, shortAddress } from '@/lib/utils';
import { Reveal } from '@/components/site/reveal';

type Profile = {
  name: string;
  email: string;
  phone: string;
  shippingAddress: string;
  walletAddress: string;
  twitter: string;
  discord: string;
};
type Order = { id: string; orderRef: string; amountUsdc: number; status: string; productName: string };

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

export function ProfileForm({ profile, orders }: { profile: Profile; orders: Order[] }) {
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const [form, setForm] = useState(profile);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const set = (patch: Partial<Profile>) => setForm((f) => ({ ...f, ...patch }));

  async function save() {
    setSaving(true);
    setSaved(false);
    setError('');
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          phone: form.phone,
          shippingAddress: form.shippingAddress,
          walletAddress: form.walletAddress,
          twitter: form.twitter,
          discord: form.discord,
        }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || 'Save failed');
      setSaved(true);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  const inputCls = 'w-full rounded-xl border border-line bg-surface2 px-4 py-3 text-[14px] text-ink outline-none transition focus:border-accent';

  return (
    <div className="px-9 pb-32 pt-[140px]">
      <div className="mx-auto max-w-[1100px]">
        <Reveal>
          <div className="mb-4 font-mono text-xs uppercase tracking-[.2em] text-ink3">Your account</div>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <h1 className="font-display text-[clamp(2.2rem,4.5vw,3.4rem)] font-semibold tracking-[-.03em]">Profile &amp; orders</h1>
            <button onClick={() => signOut()} className="inline-flex items-center gap-2 rounded-full border border-line px-4 py-2.5 text-[13px] transition hover:border-lineStrong">
              <LogOut size={15} /> Sign out
            </button>
          </div>
        </Reveal>

        <div className="mt-10 grid grid-cols-1 gap-7 lg:grid-cols-[1.1fr_1fr]">
          <Reveal delay={0.06} className="h-full">
          <div className="h-full rounded-3xl border border-line bg-surface p-7 backdrop-blur">
            <div className="mb-7 flex items-center gap-4">
              <div className="grid h-14 w-14 place-items-center rounded-full bg-brand text-white">
                <User size={24} />
              </div>
              <div>
                <div className="font-display text-[1.3rem] font-medium">{form.name || 'Your name'}</div>
                <div className="text-[13px] text-ink3">{form.email}</div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1.5 block font-mono text-[11px] uppercase tracking-wide text-ink3">Full name</span>
                <input className={inputCls} value={form.name} onChange={(e) => set({ name: e.target.value })} />
              </label>
              <label className="block">
                <span className="mb-1.5 block font-mono text-[11px] uppercase tracking-wide text-ink3">Phone (for delivery)</span>
                <input className={inputCls} value={form.phone} onChange={(e) => set({ phone: e.target.value })} />
              </label>
            </div>
            <label className="mt-4 block">
              <span className="mb-1.5 block font-mono text-[11px] uppercase tracking-wide text-ink3">Shipping address</span>
              <input className={inputCls} value={form.shippingAddress} onChange={(e) => set({ shippingAddress: e.target.value })} placeholder="Street, city, country, postal code" />
            </label>

            <div className="mt-7 font-mono text-[11px] uppercase tracking-wide text-ink3">Connected accounts</div>
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="flex items-center gap-2 rounded-xl border border-line bg-surface2 px-3 py-2">
                <Twitter size={15} className="text-accent" />
                <input className="w-full bg-transparent text-[13px] outline-none" placeholder="@handle on X" value={form.twitter} onChange={(e) => set({ twitter: e.target.value })} />
              </div>
              <div className="flex items-center gap-2 rounded-xl border border-line bg-surface2 px-3 py-2">
                <MessageCircle size={15} className="text-accent" />
                <input className="w-full bg-transparent text-[13px] outline-none" placeholder="Discord username" value={form.discord} onChange={(e) => set({ discord: e.target.value })} />
              </div>
            </div>

            <div className="mt-7 font-mono text-[11px] uppercase tracking-wide text-ink3">Crypto wallet</div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <div className="flex flex-1 items-center gap-2 rounded-xl border border-line bg-surface2 px-3 py-2">
                <Wallet size={15} className="text-accent" />
                <input className="w-full bg-transparent font-mono text-[13px] outline-none" placeholder="0x…" value={form.walletAddress} onChange={(e) => set({ walletAddress: e.target.value })} />
              </div>
              {isConnected && address && (
                <button onClick={() => set({ walletAddress: address })} className="rounded-xl border border-line px-3 py-2 text-[12px] transition hover:border-lineStrong">
                  Use {shortAddress(address)}
                </button>
              )}
            </div>

            <div className="mt-8 flex items-center gap-3">
              <button onClick={save} disabled={saving} data-cursor className="inline-flex items-center gap-2 rounded-full bg-brand px-6 py-3 font-semibold text-white shadow-glow transition hover:-translate-y-[2px] disabled:opacity-60">
                {saving && <Loader2 size={15} className="animate-spin" />} Save profile
              </button>
              {saved && <span className="inline-flex items-center gap-1 text-[13px] text-[color:var(--ok)]"><Check size={15} /> Saved</span>}
              {error && <span className="text-[13px] text-[color:var(--warn)]">{error}</span>}
            </div>
          </div>
          </Reveal>

          <Reveal delay={0.12} className="h-full">
          <div className="h-full rounded-3xl border border-line bg-surface p-7 backdrop-blur">
            <div className="mb-5 font-display text-[1.3rem] font-medium">My orders</div>
            {orders.length === 0 ? (
              <p className="text-[13px] text-ink3">No orders yet — your purchases will appear here with live status.</p>
            ) : (
              <div className="max-h-[420px] space-y-3 overflow-y-auto pr-1">
                {orders.map((o) => (
                  <div key={o.id} className="rounded-2xl border border-line bg-surface2 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{o.productName}</div>
                        <div className="font-mono text-[12px] text-ink3">{o.orderRef}</div>
                      </div>
                      <div className="font-mono font-semibold">{formatUsdc(o.amountUsdc)} <span className="text-[11px] text-accent">USDC</span></div>
                    </div>
                    <div className="mt-3">
                      <span className="inline-flex items-center gap-2 rounded-full px-3 py-1 font-mono text-[12px] font-medium" style={{ color: STATUS_C[o.status], background: `color-mix(in srgb, ${STATUS_C[o.status]} 14%, transparent)` }}>
                        <span className="h-[7px] w-[7px] rounded-full" style={{ background: STATUS_C[o.status] }} />
                        {STATUS_LABEL[o.status] ?? o.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          </Reveal>
        </div>
      </div>
    </div>
  );
}
