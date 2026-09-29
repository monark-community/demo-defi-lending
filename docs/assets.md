# Assets

## Photography

All photos come from Unsplash under the free [Unsplash License](https://unsplash.com/license) (none are Unsplash+).
Each was downloaded at 2000px on its long edge (JPEG, quality 72) and is served with `next/image`.
Photographers are credited on `/credits` (linked from the footer), and the list is mirrored in `src/lib/photos.ts`.

| File | Unsplash page | Photographer | Used on |
|-|-|-|-|
| `public/images/lecture.jpg` | https://unsplash.com/photos/TB5HpfJf7mA | [Vitaly Gariev](https://unsplash.com/@silverkblack) | Home, "Built for people learning DeFi together": Students; `/credits` |
| `public/images/devs.jpg` | https://unsplash.com/photos/QckxruozjRg | [Annie Spratt](https://unsplash.com/@anniespratt) | Home, same section: Developers; `/credits` |
| `public/images/study.jpg` | https://unsplash.com/photos/omeaHbEFlN4 | [Alexis Brown](https://unsplash.com/@alexisrbrown) | Home, same section: Workshop hosts; `/credits` |

## Brand files (Monark)

Copied from `lovable-migration/brand-refs/` and the monark.io website repo, unmodified:

| File | Use |
|-|-|
| `public/brand/monark-mark.svg` | Header pairing, wallet prompt, connect gate, OG image; also `src/app/icon.svg` (favicon) |
| `public/brand/monark-horizontal-{light,dark}.svg` | Footer Monark band |
| `public/brand/monark-vertical-{light,dark}.svg` | 404 page |
| `public/brand/monark-mesh.svg` | Home hero, once, cropped at low opacity |
| `public/brand/socials/*.svg` | Footer social links (recoloured through a CSS mask) |

## Drawn in code

- `src/components/diagrams/rate-curve.tsx`: the kinked interest-rate curve (hero, pool page, playground, home card).
- `src/components/diagrams/yield-flow.tsx`: lenders → pool → borrowers, interest back, reserve slice.
- `src/components/diagrams/queue-bar.tsx`: a withdrawal split into "leaves now" and the hatched queued part.
- Share-token exchange-rate line (home card and `/how-it-works`), token monograms (`token-mark.tsx`).
- `src/app/[locale]/opengraph-image.tsx`: per-locale Open Graph image with the pairing, headline and the supply curve.

Icons: [Lucide](https://lucide.dev) via `lucide-react`. Charts: `recharts` (earnings and 90-day pool history).
