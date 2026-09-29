# Yieldmine by Monark

Yieldmine is Monark's testnet lending pool for learning: supply test tokens, watch borrowers' demand set your rate through a
utilization-based interest model, see your share tokens grow, and withdraw through a real withdrawal queue.
It is the **lender's view** of the Monark DeFi demos (alongside Fluidswap, BorrowX and VaultLend).

- Project page: https://www.monark.io/en/project/defi-lending
- Live site: https://yieldmine.monark.io

> Demo · simulated data. Testnet demo · not financial advice · no real funds. Nothing leaves your browser.

## Run it locally

Requirements: Node 22 and pnpm 10.

```sh
pnpm install
pnpm dev          # http://localhost:3000
```

Other scripts:

| Script | What it does |
|-|-|
| `pnpm build` / `pnpm start` | Production build and server (every page prerenders) |
| `pnpm lint` | ESLint (Next.js core-web-vitals + TypeScript rules) |
| `pnpm typecheck` | Generates route types, then `tsc --noEmit` (strict) |
| `pnpm screenshots` | Playwright walkthrough of every page and key flow into `docs/screenshots/` (needs a running server; set `BASE_URL`) |

No environment variables are needed. `NEXT_PUBLIC_SITE_URL` optionally overrides the canonical URL (default `https://yieldmine.monark.io`).

## What the demo does

1. **Connect the demo wallet** (sign-in prompt; reject it to see the failure state).
2. **Supply to a pool** (for example tDAI): the preview shows your share tokens, the new utilization and APY, and a ghost point on
   the rate curve; the first deposit of a token needs an approval transaction, then the supply transaction.
3. **Watch it earn**: balances tick every second; *Demo controls → Time travel* skips 1, 7 or 30 days, during which borrowers
   borrow and repay and interest accrues. The earnings chart and pool histories extend.
4. **Withdraw from a tight pool** (tLINK at ~96% utilization): what can leave now is paid, the rest joins the withdrawal queue and is
   paid as borrowers repay (skip a day), or can be cancelled.
5. **Play with the rate model** on `/how-it-works`: every governance parameter as a slider.

Demo controls also offer *Get test tokens*, *Slow network*, *Fail the next transaction* and *Reset demo*.

## How the simulation works

Everything lives in `src/lib/demo/`, a small typed layer the UI talks to only through hooks and actions, so it can later be swapped
for wagmi/viem:

| File | Role |
|-|-|
| `types.ts` | Domain types: pools, rate models, positions, queue entries, activity, wallet, transactions |
| `rates.ts` | The kinked interest model (`borrowRate`, `supplyRate`), utilization, continuous interest accrual |
| `seed.ts` | The seeded story: five pools with a deterministic 90-day history, and a wallet with three positions |
| `ops.ts` | Pure state transitions (approve, supply, withdraw with queue, cancel, faucet, skip days) and selectors (earnings, series) |
| `store.ts` | External store persisted to `localStorage` (every access in try/catch), demo clock, 1-second ticker, wallet-prompt bridge |
| `chain.ts` | Simulated transactions: wallet prompt → pending with a hash (1.2–2.4 s, 3–6 s on slow network) → confirmed or reverted |
| `wallet.ts` | Simulated wallet connection (sign-in message, reject or confirm) |

Tokens and reference prices are shared with the Monark DeFi demos: tETH $3,200, tWBTC $64,000, tUSDC $1.00, tDAI $1.00, tLINK $14.50.
Amounts are plain numbers (not bigint) because interest accrues continuously; display rounding hides float dust.

## Project structure

```
src/
  app/
    [locale]/            en and fr routes: home, how-it-works, app, app/pool/[symbol], credits, pricing (unlinked), 404
    icon.svg, robots.ts, sitemap.ts
  components/
    demo/                the app: dashboard, pool view, supply/withdraw panel, wallet prompt, demo controls…
    diagrams/            rate curve, yield flow, queue bar (SVG line art)
    home/, how/          home hero card, rate playground
    site/                standard Monark header, footer, locale switch, theme toggle
    ui/                  shadcn + @monark/ui registry components (token-amount, tx-status, wallet, connect-wallet, network-badge…)
  i18n/                  typed EN/FR dictionaries
  lib/demo/              simulated chain, wallet and lending pool
  proxy.ts               redirects / to the visitor's preferred language
docs/
  site-plan.md           product brief, page map, flows, copy, aesthetics, pricing: what shipped
  assets.md              photo credits and brand files
  screenshots/           Playwright captures (390px and 1440px, light and dark, EN and FR)
```

UI components come from the [Monark UI registry](https://ui.monark.io) (`@monark` in `components.json`), themed with the Monark
cream and espresso tokens from the brand guidelines.

## Deploy to Vercel

Import the repository in Vercel and keep the defaults (framework: Next.js, install `pnpm install`, build `pnpm build`).
No `vercel.json` and no environment variables are required. Node 22 is pinned in `package.json` `engines`.
