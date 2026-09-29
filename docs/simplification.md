# Simplification pass

Owner feedback on the rebuilt demos: *"Simplify, reduce text quantity, revise flows so that context is only given when necessary. Two top bars on homepage is too busy; demo banners only on demo/app pages."* This pass applies the method from the TrustRate pilot (`address-review-system/docs/simplification.md`, §4 checklist). The binding rules are `monark-brand-guidelines.md` §8 "Restraint", §10 and §11. Yieldmine is Monark-branded, so the pass also brings the header and footer up to the current §2/§10 standard.

How the numbers are measured (both scripts are in `scripts/`, run against `pnpm start -p 3132`):

- `node scripts/wordcount.mjs`: words per page in English at 1440px. *Visible* is the `innerText` of `<main>`. It includes chart and diagram labels, and on `/app` pages the app bar and seeded data (amounts, dates, token names). *Total* walks every text node in `<main>` except SVG, so it can come out lower than *visible* on chart-heavy pages. Closed Radix accordions don't render their content, so FAQ answers aren't counted in either. *Chrome* is everything outside `<main>`: the header and footer.
- `node scripts/dictcount.mjs`: words of UI copy in `src/i18n/dictionaries/{en,fr}.ts`, per section.

## 1. Before

| Page | Visible in main | Total in main | Chrome |
|-|-:|-:|-:|
| Home | 502 | 459 | 100 |
| How it works | 526 | 506 | 100 |
| Credits | 120 | 120 | 100 |
| 404 | 31 | 31 | 100 |
| App: connect gate | 58 | 58 | 104 |
| App: dashboard | 333 | 395 | 106 |
| App: tDAI pool (supply, 1,500 typed) | 246 | 203 | 106 |
| App: tLINK pool (withdraw, Max) | 239 | 196 | 106 |
| **Total** | **2,055** | **1,968** | **822** |

Dictionary copy: **EN 2,472 words** (meta 122 · common 206 · home 631 · how 494 · app 769 · credits 93 · pricing 156); **FR 2,809**.

### Inventory

**Shell.** The header used the old "Yieldmine · by Monark" pairing. Its links were pushed to the right, and it switched to the mobile layout below `md`. There was no Demo chip; an "App demo" badge appeared only inside the app. The footer's legal band repeated the testnet line on every page, and its Monark band had no "built by Monark" line. The footer product line was 25 words.

**Home** (hero plus 6 sections):
- Hero: an eyebrow, a 29-word subline, and the testnet disclaimer under the buttons.
- "Where the yield comes from": eyebrow, 30-word intro and 4 steps of 12–15 words.
- "Lending you can actually follow": 3 benefits of 15 words each, restating the next section.
- Divider.
- "Three things to watch": eyebrow, 3 cards of 17–22 words and a link to the playground.
- "Who it's for": card lines of 13–15 words.
- FAQ: 6 questions, two of them mechanics (ym-tokens, why rates move).
- Divider, then the closing section with a body line.

**How it works:**
- Intro: eyebrow and a 30-word intro.
- Playground: a body line, slider hints of up to 8 words, and explanation lines of about 20 words.
- Shares: a 35-word body.
- Queue: a 60-word body.
- Glossary: 8 open terms, 3 of which repeat the slider hints.
- The DeFi family section with a 20-word body, then a CTA with a body line.
- Two dividers.

**App:**
- App bar: network, demo date, the testnet disclaimer and Demo controls.
- Connect gate: body line plus 3 feature bullets.
- Dashboard: intro paragraph; hints under 3 tiles; a "skip ahead" hint under the chart; a "Since {date}" line on each position; a markets intro; activity rows showing the transaction hash.
- Queue card: a 20-word body, a tip and the testnet disclaimer.
- Pool page: the state explanation printed under the badge; 8 stats; a curve intro line; a parameters intro line.
- Supply and withdraw panel: the testnet disclaimer in both forms; the approval "why" printed in step 1; an 8-word "at today's rate…" note.
- Demo controls: hints of 8–15 words and a 15-word reset confirmation.
- Cancel toast with a description that repeated the card.

The disclaimer appeared **four times** around one supply: in the app bar, the panel, the wallet prompt and the footer.

## 2. What changed

No feature or flow was removed. All five flows in the site plan still work end to end, and the screenshot script walks them all.

### Shell (brand standard §2, §10)

- **Header:** rebuilt from Splitflow's reference components (`brand.tsx`, `demo-chip.tsx`, `header.tsx`, `nav-links.tsx`, `mobile-menu.tsx`, `theme.tsx`, copied as is).
  - Left: the butterfly mark (28px) and "Yieldmine" (Nunito Sans 800, 18px) on one line, with no "by Monark". Its accessible label is "Yieldmine, by Monark: home".
  - Links sit left, right after the brand, muted, with the active one in foreground.
  - Right: Demo chip (`bg-primary/8`, `dark:bg-primary/15`, `primary-ink`), then EN/FR pill, then the 36px theme toggle, then the primary action ("Launch demo", or the wallet inside the app).
  - Below `lg`: the brand and a menu button only. The sheet holds the links, the Demo chip, EN/FR, the theme toggle and the action.
  - Removed `pairing.tsx` and `app-demo-badge.tsx`.
- **Footer:**
  - The Monark band now opens with "Yieldmine is built by Monark" / « Yieldmine est conçu par Monark ».
  - The legal band keeps "Demo · simulated data" and drops the testnet line.
  - The product line went from 25 to 11 words.
  - The "Part of the Monark DeFi demos" row stays (family convention).
- **Marketing pages:** one top bar only, the header. The hero's disclaimer line is gone.

### Home (hero plus 6 sections → hero plus 5)

- Hero: no eyebrow; subline 29 → 10 words; secondary CTA "See how rates work" → "How rates work".
- "Where the yield comes from": no eyebrow and no intro. The steps are titles only; the diagram already draws them.
- **Removed "Lending you can actually follow"**: its three benefits restated the "watch" cards and the hero.
- "Three things to watch": no eyebrow; cards 17–22 → 9–10 words, each keeping its visual; the link was dropped (the hero's secondary CTA goes to the same page).
- "Who it's for": heading 7 → 5 words; card lines → 6–10 words.
- FAQ: 6 → 4 questions, answers 12–15 words. "What are ym-tokens?" is the shares section on `/how-it-works`. "Why does my rate keep moving?" became the playground's one line there. This is the only FAQ on the site.
- Closing: heading and button. One divider instead of two.

### How it works

- No eyebrow; intro 30 → 10 words.
- Playground: one line (it now carries the "rates move with every…" answer from the FAQ). Slider hints are 3–6 words; the explanation is one line of 8–10 words.
- Shares 35 → 10 words; queue 60 → 18 words.
- **Glossary folded** behind a disclosure and cut from 8 terms to 6 (the pool and share-token terms are the sections above it).
- Family section: 7-word body; the CTA is heading and button. One divider left.

### App (`/app/...`)

- **App bar:** the testnet disclaimer is gone; it's a single compact bar with network, demo date and Demo controls.
- **Testnet line once per transaction:** only in the wallet prompt, for value-moving transactions. Removed from the supply form, the withdraw form, the queue card and the app bar.
- Connect gate: feature bullets removed; line 16 → 8 words; rejection 17 → 8 words.
- Dashboard:
  - Removed the intro paragraph, the tile hints, the chart hint, the "Since {date}" lines and the markets intro.
  - Activity shows 5 rows (was 6) plus "Show all". The transaction hash moved into the date's tooltip.
- Queue card: the body and the "skip a day" tip moved into an info popover next to the title (`src/components/ui/info-tip.tsx`, copied from the pilot).
- Pool page:
  - The state explanation is behind an info popover next to the badge.
  - 6 stats instead of 8 (lenders and reserves dropped; the reserve factor is in the parameters).
  - The curve's "how to read" line is behind an info popover.
  - **Pool parameters folded** behind a disclosure with the playground link.
- Supply panel: the approval "why" is behind an info popover on step 1; "at today's rate, if nothing else changes" → "At today's rate."
- Withdraw split: 20 → 11 words. The queue split, preview and queue card are otherwise unchanged (they carry flow 4).
- Demo controls: hints 8–15 → 4–6 words; reset confirmation 15 → 7 words.
- Toasts: the cancel toast lost its description (the card disappears and the position updates). The other toasts are for events with no inline feedback and stay.
- Empty states are one line plus the next action ("Nothing supplied yet. Pick a market below.", "Your wallet is empty. Get test tokens in Demo controls.").

### Credits and 404

- Credits: intro 22 → 9 words; removed "Used on the home page" under each photo; brand line 29 → 10 words.
- 404: body 20 → 7 words.

French was rewritten to the same brevity, and both dictionaries keep identical keys. Removed keys: `home.eyebrow`, `home.benefits`, `flow.eyebrow/body`, step bodies, `watch.eyebrow/link`, `closing.body`, `how.eyebrow`, `cta.body`, `gate.features`, `toasts.cancelledBody`, `dashboard.intro/tilesHint/skipHint`, `positions.since`, `markets.intro`, `pool.stats.lenders/reserves`, `params.body`, `credits.usedOn`. Added keys: `common.demoChip`, `footer.builtBy`, `queue.info`, `pool.stateInfo/curveInfo`, `panel.approveInfo`.

## 3. After

| Page | Visible before | Visible after | Change | Total before | Total after | Chrome before | Chrome after |
|-|-:|-:|-:|-:|-:|-:|-:|
| Home | 502 | 236 | −53% | 459 | 193 | 100 | 83 |
| How it works | 526 | 278 | −47% | 506 | 319 | 100 | 83 |
| Credits | 120 | 71 | −41% | 120 | 71 | 100 | 83 |
| 404 | 31 | 21 | −32% | 31 | 21 | 100 | 83 |
| App: connect gate | 58 | 27 | −53% | 58 | 27 | 104 | 84 |
| App: dashboard | 333 | 246 | −26% | 395 | 308 | 106 | 86 |
| App: tDAI pool (supply) | 246 | 153 | −38% | 203 | 133 | 106 | 86 |
| App: tLINK pool (withdraw) | 239 | 148 | −38% | 196 | 128 | 106 | 86 |
| **Total** | **2,055** | **1,180** | **−43%** | **1,968** | **1,200** | **822** | **674** |

Marketing pages alone (home, how it works, credits, 404): 1,179 → 606 visible words (−49%). What remains in the app is mostly data: amounts, token names, dates, table headers and chart axes.

Dictionary copy: **EN 2,472 → 1,706 (−31%)**, **FR 2,809 → 1,945 (−31%)**. Per section (EN): meta 122 → 122 · common 206 → 180 · home 631 → 274 · how 494 → 297 · app 769 → 622 · credits 93 → 54 · pricing 156 → 156 (internal, unlinked page, left as is).

### Screenshots

- Before: `docs/screenshots/before/en-1440-light-page-home.png`, `docs/screenshots/before/en-1440-light-flow2-preview.png`.
- After: the same names in `docs/screenshots/`, plus every other page and flow step (EN 390/1440 light and dark, FR 390/1440 light). File names are unchanged, so the project image didn't need re-rendering.
