# Yieldmine: site plan

Rebuild of the Yieldmine demo (Monark DeFi family, `defi-lending`, Monark-branded) as a Next.js app.
Authoritative product description: https://www.monark.io/en/project/defi-lending.
This plan is kept in sync with what shipped; decisions taken while working unattended are marked **Decision**.

---

## 1. Product brief

**Target user.** Members of Monark's community who want to *understand* lending before they touch real money:
students in blockchain associations and university courses, developers who will build on (or audit) lending contracts,
ambassadors who run DeFi workshops, and partners evaluating Monark's teaching modules. They are curious, not speculators.

**Core job to be done.** "Put tokens in a lending pool, see what they earn and why, and get them back out, so I understand
how pooled lending really works (and could explain it to someone else)."

**Domain concepts** (from the project page, all shown in the demo):

| Concept | What it means for a lender | Where it lives in the demo |
|-|-|-|
| Lending pool / vault | Lenders' tokens pooled together; borrowers draw from it | Markets table, pool page |
| Pool share token (`ym-tUSDC`…) | Receipt for your slice of the pool; its exchange rate only goes up as interest arrives | Pool page, position ticker |
| Utilization | Borrowed ÷ supplied. The single number that drives rates | Rate curve, markets table |
| Utilization-based interest model (with a "kink") | Rates rise slowly until the optimal utilization, then steeply, to pull liquidity back in | Rate curve on pool page, playground |
| Supply APY vs borrow APR | Lenders earn borrowers' interest × utilization × (1 − reserve factor) | Pool stats, playground |
| Reserve factor | The protocol's slice of interest, kept as a safety buffer | Pool stats, playground |
| Available liquidity | What can leave the pool right now (supplied − borrowed) | Withdraw panel |
| Withdrawal queue | When liquidity is short, the rest of your withdrawal waits in line and is paid as borrowers repay | Withdraw flow, dashboard |
| Earnings history / position analytics | What you earned, when, and at which rate | Dashboard chart and activity |
| Governance parameters | Reserve factor, curve slopes, kink; set by the community | Read-only on pool page; editable in the playground |

**What the Lovable version got wrong or left out.**
- It was a generic "earn yield" landing page on a blue-purple gradient with invented TVL/user counts and "audited, secure,
  high yield" claims: hype, no teaching, and off-brand for Monark.
- Nothing explained *where the yield comes from*. APY was a static badge; utilization was a progress bar with no consequence.
- No interest-rate model, no share tokens, no live interest calculator, no withdrawal queue, no earnings history:
  every concept the project page lists was missing.
- "Connect wallet" was a boolean flip; deposits/withdrawals had no pending, confirmed or failed states, no token approval step.
- Real mainnet token names (USDC, ETH, WBTC), no bilingual support, no disclaimers, no accessibility work.

## 2. Value proposition

> **For Monark's students and builders, Yieldmine is a testnet lending pool that shows its working: supply test tokens,
> watch the utilization curve set your rate and your share tokens grow, and withdraw through a real queue, so you understand
> DeFi lending before any real money is at stake.**

Supporting benefits (outcomes):
1. **You can explain where the yield comes from.** Every rate on screen traces back to how much of the pool is borrowed.
2. **You see your deposit's effect before you sign.** Preview how your supply moves the pool's rate and what you would earn.
3. **You're never surprised when you withdraw.** You know what can leave now, what waits in the queue, and why.

## 3. Hero

- **Headline (EN):** "Lend to a shared pool. See why it pays." (9 words)
- **Headline (FR):** « Prêtez à un pool commun. Voyez ce qui le fait rapporter. »
- **Subheadline (EN):** "Supply test tokens and watch borrowers' demand set your rate." (10 words, simplification pass)
- **Primary CTA:** "Launch the demo" → `/{locale}/app`. **Secondary:** "How rates work" → `/{locale}/how-it-works`.
- **Hero visual:** a live product fragment built in code (not a screenshot, not a stock photo): the tUSDC pool's
  kinked interest-rate curve with the pool's current point, and beneath it a position card whose value ticks up every second
  (8,000 tUSDC supplied → growing). It is the product's key idea in one glance: demand sets the rate, the rate grows your balance.
  **Why:** the audience learns by seeing mechanics; a photo would only say "people", which the page shows later.

## 4. Page map

All routes live under `/en/…` and `/fr/…`; `/` redirects to the visitor's preferred language (fallback English).

| Route | Purpose | Sections, in order |
|-|-|-|
| `/` (home) | Explain the idea in 30 seconds and send people into the demo | Hero (live curve + ticker, mesh butterfly) · "Where the yield comes from" line-art flow with 4 step titles · "Three things to watch" (rate curve, share token, withdrawal queue, each a mini visual + one line) · Who it's for (3 photos) · FAQ (4) · closing CTA. Five sections after the hero (Restraint rule). |
| `/app` | The working product: your lending dashboard + markets | One compact app bar (network, demo date, demo controls incl. time travel and reset; no disclaimer) · connect gate (when disconnected) · summary tiles (supplied, earned, blended APY, queued) · earnings chart · your positions (live tickers) · withdrawal queue (if any; explanation in an info popover) · markets table (5 pools) · activity log (5 rows + "Show all"; hash in the date tooltip) |
| `/app/pool/[symbol]` (tUSDC, tDAI, tETH, tWBTC, tLINK) | One pool: understand it and act on it | Pool header (token, utilization state with an info popover, 6 stats) · rate curve (how-to-read in an info popover) with live "your deposit moves the rate" preview · Supply / Withdraw panel (approval step with a "Why approve?" popover, preview, tx states; sticky right column on desktop, right after the curve on phones) and this pool's queue card · 90-day supply APY and utilization charts (two small multiples, never a dual axis) · share-token exchange rate · pool parameters (governance, folded in a disclosure) |
| `/how-it-works` | **Extra page, justified:** Yieldmine's reason to exist is teaching (project page: "an excellent way to teach lending mechanics"). The home page can't hold an interactive rate model | One-line intro · rate-model playground (sliders: utilization, optimal utilization, slopes, reserve factor) · share tokens explained · withdrawal queue explained · glossary (folded) · how Yieldmine fits the Monark DeFi family · CTA |
| `/credits` | Photo credits required by the asset rules (linked from the footer) | Photos · type & icons · brand |
| `/pricing` | Internal strategy review only. **Never linked**, not in the sitemap, `noindex, nofollow` | Model, costs, partner note, reasoning |
| 404 | Localized not-found with the vertical Monark logo | |

**Header** (standard Monark shell, brand guidelines §2 and §10): butterfly mark 28px + "Yieldmine" (Nunito Sans 800, 18px) on one line, no "by Monark" ·
links left after the brand: Overview, How it works, Demo · right: Demo chip (primary 8% light / 15% dark) → EN/FR pill → 36px theme toggle →
primary action ("Launch demo" on marketing pages, the `connect-wallet` control inside the app). Below `lg`: brand + menu button; the sheet holds the rest.
Marketing pages have exactly one top bar: this header.

**Footer** (standard three bands): product line (11 words) + links (Overview, How it works, Demo, Credits) and the
"Part of the Monark DeFi demos" row (Fluidswap, BorrowX, VaultLend) · "Yieldmine is built by Monark", Monark logo, tagline, project page, GitHub repo, socials ·
© Monark · Open source, "Demo · simulated data", photo credits link. The testnet disclaimer is **not** in the footer: it appears once per transaction, in the wallet prompt.

## 5. Feature highlights

| Feature | User benefit | Where | Proven by flow |
|-|-|-|-|
| Rate curve with live preview | See how your deposit changes utilization and the rate before signing | Home hero, pool page, how-it-works | Flow 2 |
| Share tokens that grow | Understand that your balance grows through the exchange rate, not new tokens | Pool page, dashboard tickers | Flows 2, 3 |
| Time travel + earnings history | Watch a month of yield accrue in one click and read it on a chart | Demo controls, dashboard chart | Flow 3 |
| Withdrawal queue | Know what leaves now, what waits and when it arrives | Pool page withdraw panel, dashboard queue card | Flow 4 |
| Rate-model playground | Change the curve like a governance vote would, and see who earns what | How-it-works | Flow 5 |
| Token approval step | Learn the real two-signature first deposit (approve, then supply) | Supply panel | Flow 2 |

## 6. Key flows

Every transaction goes through the simulated wallet prompt (confirm / reject) → **pending** (hash, 1.2–2.4 s, 3–6 s on "slow network")
→ **confirmed**, or **failed** ("You rejected the request in your wallet" or "The transaction failed on the network", forced via
"Fail the next transaction" in demo controls), each with retry.

1. **Connect the demo wallet.** Open `/app` → connect gate → "Connect demo wallet" → wallet prompt asks to sign in (no fee) →
   confirm: dashboard loads with the seeded positions. *Reject:* gate shows "You declined the sign-in. Connect again when ready." and the button stays available.
2. **First supply to a new pool (tDAI).** Markets → tDAI → Supply tab → type 1,500 (validation: empty, zero, more than your
   wallet balance) → preview shows share tokens you'll receive, new utilization, new supply APY, projected 30-day and 1-year
   earnings, and the ghost point sliding on the curve → step 1 "Allow Yieldmine to use your tDAI" (approval tx: pending → confirmed)
   → step 2 "Supply 1,500 tDAI" (pending → confirmed) → curve point animates to its new position, position appears on the dashboard.
   *Failed:* either step can be rejected or reverted; the stepper shows which step failed and retries only that step.
3. **Watch it earn.** Dashboard → position values tick every second → Demo controls → "Skip ahead 30 days" → borrowers
   borrow and repay day by day, interest accrues, the earnings chart extends by 30 days, a toast reports what you earned
   ("+ $41.20 earned over 30 days"). *Empty state:* with no positions, the chart and positions show "Nothing supplied yet".
4. **Withdraw from a tight pool (tLINK).** Pool page shows tLINK at 95.9% utilization ("Tight" in amber) → Withdraw tab →
   "Max" → the panel explains "1,740 tLINK can leave now; about 690 tLINK will join the withdrawal queue" → confirm → instant part
   paid (confirmed), queue card appears with position #1 and the amount waiting → "Skip ahead 1 day" → borrowers repay →
   queue fills, toast "Your queued 690.65 tLINK withdrawal was paid". Alternative: "Cancel queued withdrawal" (tx) returns the
   shares to your position. *Failed:* as above; nothing moves on failure.
5. **Play with the rate model.** How it works → sliders for utilization, optimal utilization, base rate, slopes, reserve factor →
   borrow APR, supply APY and the reserve's cut update live with the curve; presets "Stablecoin pool", "Volatile asset";
   "Reset to tUSDC". No transaction; it's the governance lever made tangible.

Plus: **Reset demo** (demo controls, with confirmation), **Get test tokens** (faucet tx), slow network toggle.

## 7. Content (EN and FR)

Tone: the Monark voice: open, practical, optimistic, never hype; explain each term the first time; "you"; sentence case;
buttons start with a verb. French written natively (Québec-friendly register, "pool" and "wallet/portefeuille" kept as French speakers use them).
The complete strings live in `src/i18n/dictionaries/en.ts` and `fr.ts`; the key copy is below.

### Home

| Slot | English | Français |
|-|-|-|
| H1 | Lend to a shared pool. See why it pays. | Prêtez à un pool commun. Voyez ce qui le fait rapporter. |
| Sub | Supply test tokens and watch borrowers' demand set your rate. | Déposez des jetons de test : la demande des emprunteurs fixe votre taux, en direct. |
| CTAs | Launch the demo · How rates work | Lancer la démo · Comprendre les taux |
| Flow | Where the yield comes from · 1 You supply tokens · 2 Borrowers draw from it · 3 Interest flows back · 4 A reserve is kept | D'où vient le rendement · 1 Vous déposez des jetons · 2 Les emprunteurs y puisent · 3 Les intérêts reviennent · 4 Une réserve est conservée |
| Watch title | Three things to watch | Trois choses à observer |
| Watch items | **The curve.** Rates climb gently, then steeply past the optimal point. · **Your share tokens.** Same number of tokens, each worth a little more. · **The queue.** When a pool is lent out, the rest waits in line. | **La courbe.** Les taux montent doucement, puis en flèche après l'optimum. · **Vos jetons de parts.** Toujours le même nombre, chacun vaut un peu plus. · **La file d'attente.** Quand le pool est prêté, le reste attend son tour. |
| Who | Built for learning DeFi together · Students: See lending mechanics before a course project. · Developers: The behaviour your contracts must reproduce. · Workshop hosts: Run it live, skip a month, reset in one click. | Conçu pour apprendre la DeFi ensemble · Étudiants : Voir la mécanique du prêt avant un projet de cours. · Développeurs : Le comportement que vos contrats doivent reproduire. · Animateurs d'ateliers : En direct, avancez d'un mois, remettez à zéro en un clic. |
| FAQ (4, the site's only FAQ) | Is this real money? — No. Simulated testnet tokens: nothing leaves your browser and nothing has value. · Where does the yield come from? — Interest paid by borrowers, shared among lenders after the protocol's reserve slice. · Why can't I withdraw everything at once? — Only unlent tokens can leave. The rest waits in a queue, paid as borrowers repay. · How does it fit with the other Monark demos? — Yieldmine is the lender's view. BorrowX covers borrowing, VaultLend risk, Fluidswap swaps. | C'est de l'argent réel ? · D'où vient le rendement ? · Pourquoi ne puis-je pas tout retirer d'un coup ? · Quel lien avec les autres démos de Monark ? (answers in `fr.ts`) |
| Closing | Supply your first test tokens · Launch the demo | Déposez vos premiers jetons de test · Lancer la démo |

### App (selection)

| Slot | English | Français |
|-|-|-|
| Gate | Connect the demo wallet to start lending · You get a funded test wallet, already earning. | Connectez le portefeuille de démo pour commencer à prêter · Vous recevez un portefeuille de test garni, qui rapporte déjà. |
| Dashboard H1 | Your lending | Vos prêts |
| Tiles | Supplied · Earned so far · Blended APY · Waiting in queue | Déposé · Gagné jusqu'ici · APY moyen · En file d'attente |
| Markets | Markets · Pool · Supply APY · Utilization · Available · Your supply | Marchés · Pool · APY dépôt · Utilisation · Disponible · Votre dépôt |
| Utilization states | Comfortable (more than 10 points below optimal), Busy (within 10 points of optimal), Tight (above optimal) — always with text | Confortable, Achalandé, Serré |
| Supply button | Supply {amount} {token} | Déposer {amount} {token} |
| Approve step | Allow Yieldmine to use your {token} | Autoriser Yieldmine à utiliser vos {token} |
| Withdraw split | {now} can leave now · {queued} will join the withdrawal queue | {now} peuvent sortir maintenant · {queued} rejoindront la file de retrait |
| Pending / confirmed | Waiting for the network… · Confirmed | En attente du réseau… · Confirmé |
| Errors | Enter an amount · Enter more than zero · That's more than your wallet holds · That's more than you supplied · You rejected the request in your wallet · The transaction failed on the network; nothing moved | Entrez un montant · Entrez plus que zéro · C'est plus que ce que contient votre portefeuille · C'est plus que ce que vous avez déposé · Vous avez refusé la demande dans votre portefeuille · La transaction a échoué sur le réseau ; rien n'a bougé |
| Empty states | Nothing supplied yet. Pick a market below. · No activity yet. · Your wallet has no {token}. Get test tokens in Demo controls. | Rien de déposé pour l'instant. Choisissez un marché ci-dessous. · Aucune activité pour l'instant. · Votre portefeuille ne contient pas de {token}. Obtenez-en dans les contrôles de démo. |
| Demo controls | Skip ahead 1 day / 7 days / 30 days · Slow network · Fail the next transaction · Get test tokens · Reset demo | Avancer de 1 jour / 7 jours / 30 jours · Réseau lent · Faire échouer la prochaine transaction · Obtenir des jetons de test · Réinitialiser la démo |
| Storage error | Your browser isn't saving demo data, so a reload starts over. Everything else works. | Votre navigateur n'enregistre pas les données de démo : un rechargement repart de zéro. Tout le reste fonctionne. |
| 404 | This page isn't in the pool. · The link may be old or mistyped. · Back to home · Open the demo | Cette page n'est pas dans le pool. · Le lien est peut-être ancien ou mal saisi. · Retour à l'accueil · Ouvrir la démo |

## 8. Aesthetics (Monark-branded: colour, type, logo, header and footer fixed by the guidelines)

- **Layout and rhythm.** Home: asymmetric hero (copy left, live curve card right) → full-width secondary band for the yield
  flow diagram → "three things to watch" as three bordered cards with mini visuals → photo row → FAQ accordion → a compact
  closing band. The branded section divider (line with end circles) is used once, before the closing band.
  App: dense, calm, data-first; one thin app bar (network badge, demo date, demo controls) under the header; numbers in tabular monospace.
  Context on demand: info popovers (`src/components/ui/info-tip.tsx`) and folded disclosures instead of hint paragraphs.
- **Hero visual:** coded live rate curve + ticking position card (see §3).
- **Illustrations:** reuse the mesh butterfly (once, home hero, cropped top-right at ~10% opacity light / 16% dark, flat, no glow).
  New line-art drawn in JSX with flat orange 2px rounded strokes: the yield-flow diagram (lenders → pool → borrowers → back),
  the rate curve (reused across hero, pool page, playground), the share-token "same count, rising value" mini chart,
  and the withdrawal-queue diagram. No gradients anywhere.
- **Photography:** warm, natural-light shots of people learning together (lecture hall break, developers around a wooden table,
  study group at a picnic table). Used once, in "Who it's for", always paired with a line of copy.
- **Mesh butterfly:** yes, home hero only.
- **Signature moments:**
  1. **"Your deposit moves the rate."** Typing an amount on the pool page slides a ghost point down the curve to the post-deposit
     utilization and shows the new APY; on confirmation the pool's point glides there (250 ms ease-out).
  2. **The ticking share token.** Position values and the "1 ym-tUSDC = 1.0412… tUSDC" exchange rate update every second;
     "Skip ahead 30 days" rolls them forward and draws the new stretch of the earnings chart.
  3. **The queue filling.** The withdrawal-queue bar fills as simulated borrowers repay, your place moves to "Paid".
- Health colours follow the family convention: green = comfortable/safe, amber = busy/at risk, red = tight/critical, always with a label.

## 9. Assets

| File | Purpose / placement | Source |
|-|-|-|
| `public/images/lecture.jpg` | Who it's for: students | Unsplash, Vitaly Gariev (see `docs/assets.md`) |
| `public/images/devs.jpg` | Who it's for: developers | Unsplash, Annie Spratt |
| `public/images/study.jpg` | Who it's for: workshop hosts / study groups | Unsplash, Alexis Brown |
| `public/brand/*` | Monark mark, horizontal and vertical logos, mesh butterfly, social icons | Monark brand refs / website repo |
| `src/app/icon.svg` | Favicon: the Monark mark (products don't get their own logo) | Brand refs |
| `opengraph-image` | Generated per locale: pairing, headline, a drawn rate curve | Code |

Icons: `lucide-react` (1.75px stroke). Diagrams: rate curve, yield flow, share-token growth, withdrawal queue (all JSX/SVG).
Charts: `recharts` for the earnings and pool-history charts (justified: accessible tooltips, responsive, used only in the app).

## 10. Pricing strategy

**Decision: free, included in the Monark bundle.** Yieldmine runs on testnet with simulated funds; it is a teaching and
reference module whose value is adoption by students, courses and workshops. Charging would contradict its purpose and there is
no real value flow to take a fee from. A future mainnet version would need its own brand (per `repos-and-websites.md`), so
no protocol fee is modelled here. Universities and partners get the same module; hosted workshops are a partnership
conversation, not a price list. A designed `/pricing` page ("Free, part of Monark") exists for internal review only:
never linked, excluded from the sitemap, `noindex, nofollow`. No price is mentioned anywhere else.

## 11. Out of scope

- No real chain, wallet, signing, RPC or backend; no real tokens. A typed data layer (`src/lib/demo/`) makes a later wagmi/viem swap possible.
- No borrowing UI (that's BorrowX), no liquidations or risk dashboard (that's VaultLend), no swaps (Fluidswap).
- No real governance voting: parameters are read-only in the app; the playground shows their effect without a vote.
- No multi-account or multi-user state; one demo wallet per browser.
- No historical data beyond the seeded 90 days plus whatever time travel adds.
- Amounts use JavaScript numbers (not bigint) for continuous interest; display rounding hides float dust. **Decision**, fine for a demo.

## 12. Decisions taken while building

- **Community-sized pools.** The seeded pools hold tens of thousands of test tokens (tUSDC 48k, tDAI 21k, tLINK 42k, tETH 18, tWBTC 1.9),
  not millions: they're community testnet pools, and at that size a visitor's 1,500 tDAI visibly moves the curve (70.00% → 65.36%),
  which is the point of signature moment 1.
- **The "after" point is named in the legend**, not beside the dot, so it never collides with the "Now" label on steep curves.
- **Toasts only for events without inline feedback** (time skips, queue payouts, faucet, reset, cancelled queue entries). Supply,
  approval and withdrawal confirm inline in the panel, because a top-right toast would sit on that very panel. Toasts sit top-right
  under the header and app bar on desktop and just below the header on phones, where page titles leave room.
- **"Max" withdrawals** redeem the whole position at confirmation time, so no dust of shares is left behind while interest ticks.
- **Faucet from the demo controls** closes the controls dialog before the wallet prompt opens (two stacked Radix modals can freeze the page);
  its progress is reported by a single updating toast.
- **Demo date** is shown in the app bar so time travel is visible; the demo clock runs at real speed between skips.
- **Seeded wallet holder** is "Camille Roy", a name that reads naturally in English and French.
- **Simplification pass** (see `docs/simplification.md`): 43% fewer visible words site-wide, standard header/footer, the testnet
  disclaimer only in the wallet prompt for value-moving transactions, one FAQ (home), no feature or flow removed.
