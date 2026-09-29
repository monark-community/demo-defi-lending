import { ArrowRightIcon, LightbulbIcon, ListOrderedIcon, ScanEyeIcon } from "lucide-react"
import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"

import { QueueBar } from "@/components/diagrams/queue-bar"
import { RateCurve } from "@/components/diagrams/rate-curve"
import { YieldFlow } from "@/components/diagrams/yield-flow"
import { HeroLive } from "@/components/home/hero-live"
import { SectionDivider } from "@/components/site/section-divider"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"
import { href, isLocale } from "@/i18n/config"
import { getDictionary } from "@/i18n"
import { seedFacts } from "@/lib/demo/facts"
import { formatNumber, formatPercent } from "@/lib/format"
import { pageMetadata } from "@/lib/metadata"

import devsImg from "../../../public/images/devs.jpg"
import lectureImg from "../../../public/images/lecture.jpg"
import studyImg from "../../../public/images/study.jpg"

export async function generateMetadata({ params }: PageProps<"/[locale]">): Promise<Metadata> {
  const { locale } = await params
  if (!isLocale(locale)) return {}
  return pageMetadata(locale, "/", null, getDictionary(locale).meta.description)
}

const BENEFIT_ICONS = [LightbulbIcon, ScanEyeIcon, ListOrderedIcon]
const PHOTOS = [lectureImg, devsImg, studyImg]

export default async function HomePage({ params }: PageProps<"/[locale]">) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()
  const dict = getDictionary(locale)
  const h = dict.home
  const c = dict.common
  const facts = seedFacts()
  const curveLabels = { x: c.curve.x, borrow: c.curve.borrow, supply: c.curve.supply, optimal: c.curve.optimal, now: c.curve.now }

  // Mini share-token chart: the exchange rate over the seeded 90 days.
  const idx = facts.indexHistory
  const lo = idx[0]!.index
  const hi = idx.at(-1)!.index
  const sharePath = idx
    .map((p, i) => `${i === 0 ? "M" : "L"} ${(8 + (i / (idx.length - 1)) * 224).toFixed(1)} ${(92 - ((p.index - lo) / (hi - lo)) * 70).toFixed(1)}`)
    .join(" ")

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden" aria-labelledby="hero-title">
        <Image
          src="/brand/monark-mesh.svg"
          alt=""
          width={569}
          height={571}
          unoptimized
          priority
          aria-hidden="true"
          className="pointer-events-none absolute -top-28 -left-40 w-[30rem] max-w-none opacity-[0.08] select-none sm:-left-24 lg:-top-24 lg:-left-32 lg:w-[40rem] dark:opacity-[0.14]"
        />
        <div className="relative mx-auto grid max-w-6xl gap-12 px-4 pt-12 pb-16 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.95fr)] lg:items-center lg:gap-14 lg:pt-20 lg:pb-24">
          <div>
            <p className="eyebrow text-primary-ink">{h.eyebrow}</p>
            <h1 id="hero-title" className="mt-4 text-[2.25rem] leading-[1.08] font-extrabold tracking-display sm:text-5xl lg:text-[3.75rem]">
              {h.title}
            </h1>
            <p className="mt-5 max-w-[34rem] text-lg text-muted-foreground sm:text-xl">{h.sub}</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button asChild size="lg">
                <Link href={href(locale, "/app")}>
                  {h.ctaPrimary}
                  <ArrowRightIcon aria-hidden="true" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href={href(locale, "/how-it-works")}>{h.ctaSecondary}</Link>
              </Button>
            </div>
            <p className="mt-6 text-xs text-muted-foreground">{c.disclaimer}</p>
          </div>
          <HeroLive
            locale={locale}
            model={facts.model}
            utilization={facts.utilization}
            apy={facts.apy}
            value={facts.value}
            contributed={facts.contributed}
            copy={h.hero}
            curve={curveLabels}
            states={c.states}
          />
        </div>
      </section>

      {/* Where the yield comes from */}
      <section aria-labelledby="flow-title" className="border-y bg-secondary/50">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)] lg:items-center lg:gap-16 lg:py-20">
          <div>
            <p className="eyebrow text-primary-ink">{h.flow.eyebrow}</p>
            <h2 id="flow-title" className="mt-3 text-3xl font-bold tracking-display sm:text-[2rem]">
              {h.flow.title}
            </h2>
            <p className="mt-4 max-w-[60ch] text-muted-foreground">{h.flow.body}</p>
            <ol className="mt-8 grid gap-5 sm:grid-cols-2">
              {h.flow.steps.map((step, i) => (
                <li key={step.title} className="flex gap-3">
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-full border-[1.5px] border-primary text-sm font-extrabold">{i + 1}</span>
                  <div>
                    <h3 className="font-bold">{step.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{step.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
          <YieldFlow labels={h.flow.labels} ariaLabel={`${h.flow.title}: ${h.flow.steps.map((s) => s.title).join(", ")}`} />
        </div>
      </section>

      {/* Benefits */}
      <section aria-labelledby="benefits-title" className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 lg:py-20">
        <h2 id="benefits-title" className="max-w-2xl text-3xl font-bold tracking-display sm:text-[2rem]">
          {h.benefits.title}
        </h2>
        <ul className="mt-10 grid gap-8 md:grid-cols-3 md:gap-10">
          {h.benefits.items.map((item, i) => {
            const Icon = BENEFIT_ICONS[i] ?? LightbulbIcon
            return (
              <li key={item.title}>
                <Icon className="size-7 text-primary" strokeWidth={1.75} aria-hidden="true" />
                <h3 className="mt-4 text-xl font-bold">{item.title}</h3>
                <p className="mt-2 text-muted-foreground">{item.body}</p>
              </li>
            )
          })}
        </ul>
      </section>

      <SectionDivider />

      {/* Three things to watch */}
      <section aria-labelledby="watch-title" className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 lg:py-20">
        <p className="eyebrow text-primary-ink">{h.watch.eyebrow}</p>
        <h2 id="watch-title" className="mt-3 text-3xl font-bold tracking-display sm:text-[2rem]">
          {h.watch.title}
        </h2>
        <ul className="mt-10 grid gap-4 md:grid-cols-3">
          <li className="flex flex-col rounded-3xl border bg-card p-6">
            <div className="rounded-2xl border bg-background p-2">
              <RateCurve
                compact
                model={facts.model}
                utilization={facts.utilization}
                labels={{ ...curveLabels, optimal: c.curve.optimal.replace("{value}", formatPercent(facts.model.kink, locale, 0)) }}
                formatPct={(f) => formatPercent(f, locale, 0)}
                formatRate={(f) => formatPercent(f, locale)}
                ariaLabel={c.curve.label.replace("{token}", "tUSDC")}
              />
            </div>
            <h3 className="mt-5 text-xl font-bold">{h.watch.items[0]!.title}</h3>
            <p className="mt-2 text-muted-foreground">{h.watch.items[0]!.body}</p>
          </li>
          <li className="flex flex-col rounded-3xl border bg-card p-6">
            <div className="rounded-2xl border bg-background p-4">
              <p className="text-sm text-muted-foreground">
                {h.watch.shareRate}{" "}
                <span className="font-mono font-bold text-foreground tabular-nums">{formatNumber(facts.index, locale, 4)} tUSDC</span>
              </p>
              <svg viewBox="0 0 240 100" className="mt-2 h-auto w-full" aria-hidden="true">
                <line x1="8" x2="232" y1="92" y2="92" stroke="var(--border)" />
                <path d={sharePath} fill="none" stroke="var(--primary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="232" cy="22" r="5" fill="var(--primary)" stroke="var(--card)" strokeWidth="2" />
              </svg>
            </div>
            <h3 className="mt-5 text-xl font-bold">{h.watch.items[1]!.title}</h3>
            <p className="mt-2 text-muted-foreground">{h.watch.items[1]!.body}</p>
          </li>
          <li className="flex flex-col rounded-3xl border bg-card p-6">
            <div className="flex flex-col gap-3 rounded-2xl border bg-background p-4">
              <QueueBar ratio={0.72} />
              <div className="flex justify-between gap-2 text-xs font-bold">
                <span className="flex items-center gap-1.5">
                  <span className="size-2.5 rounded-full bg-primary" aria-hidden="true" />
                  {h.watch.queueNow} · {formatNumber(1740, locale)} tLINK
                </span>
                <span className="text-right text-muted-foreground">{h.watch.queueWait}</span>
              </div>
            </div>
            <h3 className="mt-5 text-xl font-bold">{h.watch.items[2]!.title}</h3>
            <p className="mt-2 text-muted-foreground">{h.watch.items[2]!.body}</p>
          </li>
        </ul>
        <Link href={href(locale, "/how-it-works")} className="mt-8 inline-flex min-h-11 items-center gap-1.5 font-bold text-primary-ink underline underline-offset-4">
          {h.watch.link}
          <ArrowRightIcon className="size-4" aria-hidden="true" />
        </Link>
      </section>

      {/* Who it's for */}
      <section aria-labelledby="who-title" className="border-t bg-secondary/40">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-20">
          <h2 id="who-title" className="max-w-2xl text-3xl font-bold tracking-display sm:text-[2rem]">
            {h.who.title}
          </h2>
          <ul className="mt-10 grid gap-6 md:grid-cols-3">
            {h.who.items.map((item, i) => (
              <li key={item.title}>
                <div className="relative aspect-[4/3] overflow-hidden rounded-3xl border">
                  <Image src={PHOTOS[i]!} alt={item.alt} fill sizes="(min-width: 768px) 30vw, 100vw" placeholder="blur" className="object-cover" />
                </div>
                <h3 className="mt-4 text-xl font-bold">{item.title}</h3>
                <p className="mt-1 text-muted-foreground">{item.body}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* FAQ */}
      <section aria-labelledby="faq-title" className="mx-auto w-full max-w-3xl px-4 py-16 sm:px-6 lg:py-20">
        <h2 id="faq-title" className="text-3xl font-bold tracking-display sm:text-[2rem]">
          {h.faq.title}
        </h2>
        <Accordion type="single" collapsible className="mt-8 rounded-3xl border bg-card px-5">
          {h.faq.items.map((item, i) => (
            <AccordionItem key={item.q} value={`q${i}`}>
              <AccordionTrigger className="py-5 text-base font-bold">{item.q}</AccordionTrigger>
              <AccordionContent className="text-base text-muted-foreground">{item.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>

      <SectionDivider />

      {/* Closing */}
      <section aria-labelledby="closing-title" className="mx-auto flex w-full max-w-6xl flex-col items-start gap-6 px-4 py-16 sm:px-6 md:flex-row md:items-center md:justify-between lg:py-20">
        <div>
          <h2 id="closing-title" className="text-3xl font-bold tracking-display sm:text-[2rem]">
            {h.closing.title}
          </h2>
          <p className="mt-2 text-muted-foreground">{h.closing.body}</p>
        </div>
        <Button asChild size="lg" className="shrink-0">
          <Link href={href(locale, "/app")}>
            {h.closing.cta}
            <ArrowRightIcon aria-hidden="true" />
          </Link>
        </Button>
      </section>
    </>
  )
}
