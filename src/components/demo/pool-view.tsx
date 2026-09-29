"use client"

import { ArrowLeftIcon, ArrowRightIcon, ChevronDownIcon } from "lucide-react"
import Link from "next/link"
import { useState } from "react"

import { RateCurve } from "@/components/diagrams/rate-curve"
import { InfoTip } from "@/components/ui/info-tip"
import { href } from "@/i18n/config"
import { t } from "@/i18n/t"
import { accrue, available, borrowRate, poolUtilization, supplyRate, utilizationState } from "@/lib/demo/rates"
import { useDemo, useNow } from "@/lib/demo/store"
import { shareSymbol, TOKENS } from "@/lib/demo/tokens"
import type { RateModel, TokenSymbol } from "@/lib/demo/types"
import { formatCompact, formatNumber, formatPercent, formatShortDate, formatToken } from "@/lib/format"

import { Amount } from "./amount"
import { useAppCopy } from "./app-provider"
import { ActionPanel } from "./action-panel"
import { QueueList } from "./dashboard"
import { SeriesChart } from "./series-chart"
import { StateBadge } from "./state-badge"
import { TokenMark } from "./token-mark"

export function PoolView({ symbol }: { symbol: TokenSymbol }) {
  const demo = useDemo()
  const now = useNow()
  const { app, locale, states, stateHints, curve, howHref } = useAppCopy()
  const p = app.pool
  const [preview, setPreview] = useState<{ u: number; kind: "supply" | "withdraw" } | null>(null)
  if (!demo || !now) return null

  const pool = accrue(demo.pools[symbol], now)
  const u = poolUtilization(pool)
  const apy = supplyRate(u, pool.model)
  const state = utilizationState(u, pool.model)
  const position = demo.positions.find((x) => x.symbol === symbol)
  const pct = (f: number) => formatPercent(f, locale)
  const pct0 = (f: number) => formatPercent(f, locale, 0)
  const history = pool.history.slice(-90)

  const stats = [
    { label: p.stats.supplyApy, value: pct(apy), strong: true },
    { label: p.stats.borrowApr, value: pct(borrowRate(u, pool.model)) },
    { label: p.stats.utilization, value: pct(u) },
    { label: p.stats.available, value: `${formatCompact(pool.queue.length ? 0 : available(pool), locale)} ${symbol}` },
    { label: p.stats.supplied, value: `${formatCompact(pool.supplied, locale)} ${symbol}` },
    { label: p.stats.borrowed, value: `${formatCompact(pool.borrowed, locale)} ${symbol}` },
  ]

  return (
    <div className="flex flex-col gap-8">
      <div>
        <Link
          href={href(locale, "/app")}
          className="inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground"
        >
          <ArrowLeftIcon className="size-4" aria-hidden="true" />
          {p.back}
        </Link>
        <header className="mt-2 flex flex-wrap items-center gap-4">
          <TokenMark symbol={symbol} className="size-12 text-sm" />
          <div className="min-w-0">
            <h1 className="text-3xl font-extrabold tracking-display sm:text-4xl">{t(p.title, { token: symbol })}</h1>
            <p className="text-sm text-muted-foreground">{TOKENS[symbol].name}</p>
          </div>
          <div className="flex items-center gap-0.5 sm:ml-auto">
            <StateBadge state={state} label={states[state]} />
            <InfoTip label={p.stateInfo}>{stateHints[state]}</InfoTip>
          </div>
        </header>
      </div>

      <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border bg-border sm:grid-cols-3 lg:grid-cols-6">
        {stats.map((s) => (
          <div key={s.label} className="bg-card p-4">
            <dt className="text-xs font-semibold text-muted-foreground">{s.label}</dt>
            <dd className={s.strong ? "mt-1 font-mono text-xl font-bold text-primary-ink tabular-nums" : "mt-1 font-mono text-lg font-bold tabular-nums"}>
              {s.value}
            </dd>
          </div>
        ))}
      </dl>

      {/* One grid so phones get curve → panel → history, while desktops keep the panel in a sticky right column. */}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] lg:items-start">
        <section aria-labelledby="curve-title" className="min-w-0 rounded-3xl border bg-card p-4 sm:p-6 lg:col-start-1">
          <div className="flex items-center gap-1">
            <h2 id="curve-title" className="text-lg font-bold">
              {p.curveTitle}
            </h2>
            <InfoTip label={p.curveInfo}>{p.curveBody}</InfoTip>
          </div>
          <RateCurve
            className="mt-4"
            model={pool.model}
            utilization={u}
            preview={preview?.u ?? null}
            labels={{
              x: curve.x,
              borrow: curve.borrow,
              supply: curve.supply,
              optimal: t(curve.optimal, { value: pct0(pool.model.kink) }),
              now: curve.now,
              after: preview?.kind === "withdraw" ? curve.afterWithdraw : curve.after,
            }}
            formatPct={pct0}
            formatRate={pct}
            ariaLabel={`${t(curve.label, { token: symbol })}. ${curve.now}: ${p.stats.utilization} ${pct(u)}, ${p.stats.supplyApy} ${pct(apy)}${
              preview
                ? `. ${preview.kind === "withdraw" ? curve.afterWithdraw : curve.after}: ${pct(preview.u)}, ${pct(supplyRate(preview.u, pool.model))}`
                : ""
            }`}
          />
        </section>

        <div className="flex min-w-0 flex-col gap-6 lg:sticky lg:top-24 lg:col-start-2 lg:row-span-3 lg:row-start-1">
          <ActionPanel symbol={symbol} onPreview={setPreview} />
          <QueueList demo={demo} now={now} only={symbol} />
        </div>

        <section aria-labelledby="history-title" className="min-w-0 rounded-3xl border bg-card p-4 sm:p-6 lg:col-start-1">
          <h2 id="history-title" className="text-lg font-bold">
            {p.historyTitle}
          </h2>
          <div className="mt-4 grid gap-6 sm:grid-cols-2">
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground">{p.stats.supplyApy}</h3>
              <SeriesChart
                height={160}
                data={history.map((h) => ({ t: Date.parse(h.t), v: h.supplyApy }))}
                seriesName={p.stats.supplyApy}
                ariaLabel={t(p.historyLabel, { token: symbol })}
                formatX={(ts) => formatShortDate(ts, locale)}
                formatY={(v) => formatPercent(v, locale, 1)}
                formatTooltip={pct}
              />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground">{p.stats.utilization}</h3>
              <SeriesChart
                height={160}
                color="var(--chart-3)"
                data={history.map((h) => ({ t: Date.parse(h.t), v: h.utilization }))}
                seriesName={p.stats.utilization}
                ariaLabel={t(p.historyLabel, { token: symbol })}
                formatX={(ts) => formatShortDate(ts, locale)}
                formatY={pct0}
                formatTooltip={pct}
                yDomain={[0, 1]}
              />
            </div>
          </div>
        </section>

        <div className="grid min-w-0 gap-6 sm:grid-cols-2 lg:col-start-1">
          <section aria-labelledby="share-title" className="rounded-3xl border bg-card p-4 sm:p-6">
            <h2 id="share-title" className="text-lg font-bold">
              {p.share.title}
            </h2>
            <p className="mt-3 text-sm text-muted-foreground">{t(p.share.rate, { share: shareSymbol(symbol) })}</p>
            <p className="font-mono text-2xl font-bold tabular-nums">
              {formatNumber(pool.index, locale, 8)} <span className="font-sans text-sm text-muted-foreground">{symbol}</span>
            </p>
            {position ? (
              <p className="mt-3 text-sm">
                {p.share.yours} <Amount value={position.shares} symbol={symbol} locale={locale} label={shareSymbol(symbol)} className="inline-flex font-bold" />{" "}
                {p.share.worth} <span className="font-mono font-bold tabular-nums">{formatToken(position.shares * pool.index, symbol, locale, 6)}</span>
              </p>
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">{t(p.share.none, { share: shareSymbol(symbol) })}</p>
            )}
          </section>
          {/* Governance mechanics: folded until asked for. */}
          <section aria-labelledby="params-title" className="self-start rounded-3xl border bg-card px-4 py-2 sm:px-6 sm:py-3">
            <details className="group">
              <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 [&::-webkit-details-marker]:hidden">
                <h2 id="params-title" className="text-lg font-bold">
                  {p.params.title}
                </h2>
                <ChevronDownIcon className="size-5 shrink-0 text-muted-foreground transition-transform duration-200 group-open:rotate-180" aria-hidden="true" />
              </summary>
              <ParamList model={pool.model} />
              <Link href={howHref} className="mt-1 mb-1 inline-flex min-h-11 items-center gap-1.5 text-sm font-bold text-primary-ink underline underline-offset-4">
                {p.params.playground}
                <ArrowRightIcon className="size-4" aria-hidden="true" />
              </Link>
            </details>
          </section>
        </div>
      </div>
    </div>
  )
}

function ParamList({ model }: { model: RateModel }) {
  const { locale } = useAppCopy()
  const { app } = useAppCopy()
  const copy = app.params
  const rows = [
    [copy.base, model.base],
    [copy.slope1, model.slope1],
    [copy.slope2, model.slope2],
    [copy.kink, model.kink],
    [copy.reserve, model.reserveFactor],
  ] as const
  return (
    <dl className="mt-3 flex flex-col divide-y text-sm">
      {rows.map(([label, v]) => (
        <div key={label} className="flex justify-between gap-3 py-1.5">
          <dt className="text-muted-foreground">{label}</dt>
          <dd className="font-mono font-semibold tabular-nums">{formatPercent(v, locale)}</dd>
        </div>
      ))}
    </dl>
  )
}
