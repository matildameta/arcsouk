# Arc Souk

A stunning, bilingual (English / العربية) online store for handmade art — gypsum & plaster sculptures — with crypto checkout in **USDC on the Circle Arc testnet**.

Built with Next.js 14 (App Router), TypeScript, Tailwind CSS, Framer Motion, next-intl, NextAuth, Prisma, and wagmi/viem.

---

## Features

- **Jaw-dropping UI** — light default + dark mode, an animated holographic 3D card, mesh-gradient background, custom cursor, scroll reveals, Framer Motion throughout.
- **Bilingual** — English + Arabic with full RTL, language switcher.
- **Auth** — Google, email + password, and email one-time code (NextAuth). Accounts persist in Postgres.
- **Shop** — product grid with filters, product detail with image **and** video gallery.
- **Admin** (restricted to `ADMIN_EMAILS`) — add / edit / delete products, upload images & video, set USDC price, manage inventory, view orders, update status, optional homepage content block.
- **Profile + Orders** — name, shipping address, phone, socials, wallet; “My Orders” with live status (awaiting payment / paid / shipped).
- **USDC payment on Circle Arc testnet** — connect wallet (wagmi/viem), auto-add the chain, transfer USDC, and verify the payment on-chain.

## Tech stack

Next.js 14 · TypeScript · Tailwind CSS · Framer Motion · next-intl · NextAuth (Auth.js) · Prisma + Postgres · wagmi + viem · Vercel Blob.

---

## 1. Local setup

```bash
npm install                  # installs deps + runs `prisma generate`
cp .env.example .env         # then fill in values (see the table below)
npm run db:push              # create the database tables
npm run db:seed              # (optional) load the starter collection
npm run dev
```

Open **http://localhost:3000** — you’ll be sent to `/en` (or `/ar`).

> The storefront (home / shop / product) renders even before you configure the database — it falls back to bundled sample data. Auth, admin, profile and payments need the env values below.

## 2. Environment variables

Everything is documented in [`.env.example`](./.env.example). Nothing is hardcoded; all secrets live in `.env` (git-ignored).

| Variable | What it is | Where to get it |
| --- | --- | --- |
| `DATABASE_URL` | Postgres connection string | [neon.tech](https://neon.tech) (free) or Vercel Postgres |
| `NEXTAUTH_URL` | App URL | `http://localhost:3000` locally |
| `NEXTAUTH_SECRET` | Session signing secret | `openssl rand -base64 32` |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Google OAuth | [Google Cloud Console](https://console.cloud.google.com) → Credentials. Redirect URI: `{APP_URL}/api/auth/callback/google` |
| `EMAIL_SERVER_*`, `EMAIL_FROM` | SMTP for login codes | any SMTP provider |
| `ADMIN_EMAILS` | Comma-separated admin emails | your email(s) |
| `BLOB_READ_WRITE_TOKEN` | Media uploads | Vercel → Storage → Blob |
| `NEXT_PUBLIC_ARC_RPC_URL` | Arc RPC | `https://rpc.testnet.arc.network` |
| `NEXT_PUBLIC_ARC_CHAIN_ID` | Arc chain id | `5042002` |
| `NEXT_PUBLIC_ARC_EXPLORER` | Explorer | `https://testnet.arcscan.app` |
| `NEXT_PUBLIC_USDC_ADDRESS` | USDC ERC-20 contract on Arc | from the [Arc docs](https://docs.arc.io) / faucet |
| `NEXT_PUBLIC_PAYMENT_ADDRESS` | Wallet that receives payments | your receiving wallet |
| `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` | (optional) WalletConnect | [cloud.walletconnect.com](https://cloud.walletconnect.com) |

**Tip:** without SMTP, the email login code is printed to your **terminal** so you can still test the flow. Without `BLOB_READ_WRITE_TOKEN`, image/video upload is disabled (everything else works).

## 3. Becoming an admin

Put your email in `ADMIN_EMAILS` (comma-separated for several). Sign in with that email; `/admin` then unlocks. Everyone else gets a 403.

---

## 4. USDC payments on Circle Arc

**Arc Testnet:** RPC `https://rpc.testnet.arc.network` · Chain id `5042002` · Explorer `https://testnet.arcscan.app` · faucet `https://faucet.circle.com` (select Arc Testnet).

> ⚠️ **Decimals:** On Arc the native gas token (USDC) uses 18 decimals, but the USDC **ERC-20** interface uses **6 decimals**. This app reads balances and transfers **only** through the ERC-20 interface (6 decimals) — see `src/lib/usdc.ts`.

### How we detect who paid — Option A vs Option B

**Option A — direct payment to one wallet (implemented).**
The buyer pays USDC straight to `NEXT_PUBLIC_PAYMENT_ADDRESS` from their connected wallet, *through our checkout*. Because the wallet hands us the transaction hash immediately, the server reads that exact transaction from the Arc RPC and confirms it contains a USDC `Transfer` of the right amount to our address, then marks the order paid.
- ➕ Simple, no contract to deploy, no gas to manage, reliable (we verify the real on-chain tx tied to the order).
- ➖ Relies on the buyer completing payment through the site so we capture the hash (a manual “I paid, here’s my tx” fallback can be added).

**Option B — escrow smart contract.**
You deploy a small contract; buyers pay the contract with an order id, and the contract records who paid how much. The site reads the contract.
- ➕ On-chain record keyed by order id; supports refunds/withdrawals patterns.
- ➖ More moving parts: write + audit + deploy the contract, manage gas, and maintain the address.

**We went with Option A** — the simplest, most reliable path for a web checkout, since the wallet gives us the tx hash and we verify it server-side. (If you later want Option B, the payment address field is already env-driven, so swapping in a contract address is a small change.)

### What to test (testnet only — never real funds)

1. Get test USDC from the faucet for your wallet.
2. Set `NEXT_PUBLIC_USDC_ADDRESS` and `NEXT_PUBLIC_PAYMENT_ADDRESS`.
3. Sign in, complete your profile (shipping address + phone), open a product, **Connect wallet** → **Pay with USDC**.
4. Approve in your wallet; watch status go pending → paid. Confirm the order shows in **Profile → My orders** and in **Admin → Orders** (with buyer, address, phone, tx hash). Mark it **Shipped** in admin and see it update on the buyer’s side.

No private keys are ever stored in the app or committed.

---

## 5. Deploy to Vercel

1. **Push to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Arc Souk"
   git branch -M main
   git remote add origin https://github.com/<you>/arc-souk.git
   git push -u origin main
   ```
   (`.env` is git-ignored — your secrets stay local.)

2. **Import to Vercel** — [vercel.com/new](https://vercel.com/new) → pick the repo → Framework: **Next.js** → Deploy.

3. **Add a database & blob store** — in the Vercel project: **Storage → Create → Postgres** (copy its `DATABASE_URL`) and **Storage → Create → Blob** (copy `BLOB_READ_WRITE_TOKEN`).

4. **Add env vars** — Project → **Settings → Environment Variables** → add every variable from the table above (use your Vercel domain for `NEXTAUTH_URL` and the Google redirect URI). Redeploy.

5. **Create the tables** — once `DATABASE_URL` is set, run `npm run db:push` locally pointed at the production DB, or add it to the build. Optionally `npm run db:seed`.

---

## Scripts

| Script | Description |
| --- | --- |
| `npm run dev` | Dev server |
| `npm run build` / `start` | Production build / run |
| `npm run db:push` | Sync the Prisma schema to the database |
| `npm run db:seed` | Load the starter collection |
| `npm run db:studio` | Prisma Studio (browse data) |
| `npm run lint` | Lint |

## Project structure

```
prisma/schema.prisma     # data model
src/
  app/[locale]/          # localized pages: home, shop, product, profile, admin, auth
  app/api/               # auth, admin, orders, profile, upload route handlers
  components/            # design system + site, admin, profile, shop, web3
  i18n/ · lib/           # next-intl config; prisma, auth, store, chains, usdc helpers
messages/                # en.json, ar.json
```

## Crypto safety

Payments run on the **Arc testnet only**. Test with faucet USDC before anything involving real value. No private keys are stored or committed.
