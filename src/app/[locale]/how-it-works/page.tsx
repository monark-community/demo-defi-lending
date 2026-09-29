import { ArrowRightIcon } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"

import { QueueBar } from "@/components/diagrams/queue-bar"
import { Playground } from "@/components/how/playground"
import { SectionDivider } from "@/components/site/section-divider"
import { Button } from "@/components/ui/button"
import { DEFI_FAMILY, href, isLocale } from "@/i18n/config"
import { getDictionary, t } from "@/i18n"
import { seedFacts } from "@/lib/demo/facts"
import { formatDate, formatNumber, formatToken } from "@/lib/format"
import { pageMetadata } from "@/lib/metadata"

export async function generateMetadata({ params }: PageProps<"/[locale]/how-it-works">): Promise<Metadata> {
  const { locale } = await params
  if (!isLocale(locale)) return {}
  const m = getDictionary(locale).meta.pages.how
  return pageMetadata(locale, "/how-it-works", m.title, m.description)
}

export default async function HowPage({ params }: PageProps<"/[locale]/how-it-works">) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()
  const dict = getDictionary(locale)
  const h = dict.how
  const f = seedFacts()
  const [s1, s2, s3] = h.shares.steps

  // Exchange-rate chart points (flat line art, no axes needed: it only goes up).
  const idx = f.indexHistory
  const lo = idx[0]!.index
  const hi = idx.at(-1)!.index
  const path = idx.map((p, i) => `${i ? "L" : "M"} ${(10 + (i / (idx.length - 1)) * 380).toFixed(1)} ${(130 - ((p.index - lo) / (hi - lo)) * 110).toFixed(1)}`).join(" ")
  const firstI = idx.findIndex((p) => Date.parse(p.t) >= Date.parse(f.firstSupply.at))
  const fx = 10 + (Math.max(firstI, 0) / (idx.length - 1)) * 380
  const fy = 130 - ((f.firstSupply.index - lo) / (hi - lo)) * 110

  return (
    <div className="flex flex-col">
      <section aria-labelledby="how-title" className="mx-auto w-full max-w-6xl px-4 pt-12 pb-10 sm:px-6 lg:pt-16">
        <p className="eyebrow text-primary-ink">{h.eyebrow}</p>
        <h1 id="how-title" className="mt-3 max-w-3xl text-4xl font-extrabold tracking-display sm:text-5xl">
          {h.title}
        </h1>
        <p className="mt-4 max-w-[62ch] text-lg text-muted-foreground">{h.intro}</p>
      </section>

      <section aria-labelledby="pg-title" className="mx-auto w-full max-w-6xl px-4 pb-16 sm:px-6">
        <h2 id="pg-title" className="text-2xl font-bold">
          {h.playground.title}
        </h2>
        <p className="mt-1 text-muted-foreground">{h.playground.body}</p>
        <div className="mt-6">
          <Playground locale={locale} copy={h.playground} curve={dict.common.curve} />
        </div>
      </section>

      <SectionDivider />

      <section aria-labelledby="shares-title" className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:items-center">
        <div>
          <h2 id="shares-title" className="text-3xl font-bold tracking-display">
            {h.shares.title}
          </h2>
          <p className="mt-4 text-muted-foreground">{h.shares.body}</p>
          <ol className="mt-6 flex flex-col gap-3">
            {[
              { label: t(s1!.label, { date: formatDate(f.firstSupply.at, locale) }), value: t(s1!.value, { amount: formatToken(f.firstSupply.amount, "tUSDC", locale), rate: formatNumber(f.firstSupply.index, locale, 4) }) },
              { label: s2!.label, value: t(s2!.value, { shares: `${formatNumber(f.firstSupply.shares, locale, 2)} ym-tUSDC` }) },
              {
                label: t(s3!.label, { today: formatDate(f.now, locale) }),
                value: t(s3!.value, { rate: formatNumber(f.index, locale, 4), amount: formatToken(f.firstSupply.shares * f.index, "tUSDC", locale) }),
              },
            ].map((row, i) => (
              <li key={row.label} className="flex gap-3 rounded-2xl border bg-card p-4">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full border-[1.5px] border-primary text-sm font-extrabold">{i + 1}</span>
                <span>
                  <span className="block text-xs font-bold text-muted-foreground">{row.label}</span>
                  <span className="block font-semibold">{row.value}</span>
                </span>
              </li>
            ))}
          </ol>
        </div>
        <figure className="rounded-3xl border bg-card p-4 sm:p-6">
          <svg viewBox="0 0 400 150" role="img" aria-label={h.shares.chartLabel} className="h-auto w-full">
            <line x1="10" x2="390" y1="130" y2="130" stroke="var(--border)" />
            <line x1="10" x2="390" y1="20" y2="20" stroke="var(--border)" strokeDasharray="3 5" />
            <path d={path} fill="none" stroke="var(--primary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx={fx} cy={fy} r="6" fill="var(--card)" stroke="var(--primary)" strokeWidth="2.5" />
            <circle cx="390" cy="20" r="6.5" fill="var(--primary)" stroke="var(--card)" strokeWidth="2.5" />
            <text x={fx + 10} y={fy + 16} fontSize="12" fontWeight="800" fill="var(--foreground)">
              {formatNumber(f.firstSupply.index, locale, 4)}
            </text>
            <text x="380" y="42" textAnchor="end" fontSize="12" fontWeight="800" fill="var(--foreground)">
              {formatNumber(f.index, locale, 4)}
            </text>
          </svg>
          <figcaption className="mt-2 text-sm text-muted-foreground">{h.shares.chartLabel}</figcaption>
        </figure>
      </section>

      <section aria-labelledby="queue-title" className="border-y bg-secondary/50">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:items-center">
          <div>
            <h2 id="queue-title" className="text-3xl font-bold tracking-display">
              {h.queue.title}
            </h2>
            <p className="mt-4 text-muted-foreground">{h.queue.body}</p>
          </div>
          <figure className="flex flex-col gap-5 rounded-3xl border bg-card p-5 sm:p-6">
            {[
              { label: h.queue.diagram.request, ratio: 0.72, filled: 0 },
              { label: h.queue.diagram.repay, ratio: 0.72, filled: 0.55 },
              { label: h.queue.diagram.paid, ratio: 0.72, filled: 1 },
            ].map((row, i) => (
              <div key={row.label}>
                <p className="mb-2 flex items-center gap-2 text-sm font-bold">
                  <span className="flex size-6 items-center justify-center rounded-full border-[1.5px] border-primary text-xs font-extrabold">{i + 1}</span>
                  {row.label}
                </p>
                <QueueBar ratio={row.ratio} filled={row.filled} />
              </div>
            ))}
            <figcaption className="flex flex-wrap gap-x-5 gap-y-1 text-xs font-semibold text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-full bg-primary" aria-hidden="true" />
                {h.queue.diagram.now}
              </span>
              <span className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-full border border-muted-foreground" aria-hidden="true" />
                {h.queue.diagram.queued}
              </span>
              <span className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-full bg-primary/55" aria-hidden="true" />
                {h.queue.diagram.paid}
              </span>
            </figcaption>
          </figure>
        </div>
      </section>

      <section aria-labelledby="glossary-title" className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
        <h2 id="glossary-title" className="text-3xl font-bold tracking-display">
          {h.glossary.title}
        </h2>
        <dl className="mt-8 grid gap-x-10 gap-y-6 sm:grid-cols-2">
          {h.glossary.items.map((g) => (
            <div key={g.term} className="border-l-2 border-primary pl-4">
              <dt className="font-bold">{g.term}</dt>
              <dd className="mt-1 text-muted-foreground">{g.def}</dd>
            </div>
          ))}
        </dl>
      </section>

      <SectionDivider />

      <section aria-labelledby="family-title" className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2">
        <div>
          <h2 id="family-title" className="text-2xl font-bold">
            {h.family.title}
          </h2>
          <p className="mt-3 text-muted-foreground">{h.family.body}</p>
          <ul className="mt-4 flex flex-col gap-2">
            {DEFI_FAMILY.map((s) => (
              <li key={s.key}>
                <a href={s.url} className="inline-flex min-h-11 items-center font-semibold text-primary-ink underline underline-offset-4">
                  {h.family.items[s.key]}
                </a>
              </li>
            ))}
          </ul>
        </div>
        <div className="flex flex-col items-start justify-center gap-4 rounded-3xl border bg-card p-6 sm:p-8">
          <h2 className="text-2xl font-bold">{h.cta.title}</h2>
          <p className="text-muted-foreground">{h.cta.body}</p>
          <Button asChild size="lg">
            <Link href={href(locale, "/app")}>
              {h.cta.button}
              <ArrowRightIcon aria-hidden="true" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  )
}
