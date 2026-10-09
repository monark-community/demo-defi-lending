import Link from "next/link"

import { MONARK_SOCIALS, SiteFooter as MonarkSiteFooter } from "@/components/ui/site-footer"
import { DEFI_FAMILY, href, REPO_URL, type Locale } from "@/i18n/config"
import type { Dictionary } from "@/i18n"

/** Standard Monark three-band footer (brand guidelines §10), from @monark/ui's site-footer. */
export function SiteFooter({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const c = dict.common
  const f = c.footer

  return (
    <MonarkSiteFooter
      product={c.product}
      description={f.product}
      links={[
        { href: href(locale), label: c.nav.overview },
        { href: href(locale, "/how-it-works"), label: c.nav.how },
        { href: href(locale, "/app"), label: c.nav.demo },
        { href: href(locale, "/credits"), label: c.nav.credits },
      ]}
      resources={[
        { href: `https://www.monark.io/${locale}/project/defi-lending`, label: f.projectPage },
        { href: REPO_URL, label: f.repo },
      ]}
      socials={MONARK_SOCIALS.map((s) => ({ ...s, label: f.social[s.key as keyof typeof f.social] }))}
      copyright={`© ${new Date().getFullYear()} ${f.legal}`}
      demoNotice={c.demoBadge}
      legalLinks={[{ href: href(locale, "/credits"), label: f.photos }]}
      LinkComponent={Link}
      labels={{ productNav: f.productNav, builtBy: f.builtBy, monarkHome: f.monarkHome, tagline: f.tagline, socials: f.socialLabel }}
    >
      {/* The Monark DeFi family row: Yieldmine's siblings. */}
      <nav aria-label={f.family} className="flex flex-col gap-3 rounded-2xl border border-dashed p-4 sm:flex-row sm:items-center sm:gap-6">
        <p className="eyebrow shrink-0 text-muted-foreground">{f.family}</p>
        <ul className="flex flex-wrap gap-x-6 gap-y-2">
          {DEFI_FAMILY.map((s) => (
            <li key={s.key}>
              <a href={s.url} className="group inline-flex min-h-11 flex-col justify-center text-sm md:min-h-0">
                <span className="font-bold text-foreground underline-offset-4 group-hover:underline">{s.name}</span>
                <span className="text-xs text-muted-foreground">{f.familyItems[s.key]}</span>
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </MonarkSiteFooter>
  )
}
