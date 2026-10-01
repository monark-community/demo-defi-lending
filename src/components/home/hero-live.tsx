"use client"

import { useEffect, useState } from "react"

import { RateCurve } from "@/components/diagrams/rate-curve"
import { StateBadge } from "@/components/demo/state-badge"
import type { Locale } from "@/i18n/config"
import { formatAmount, formatPercent } from "@/lib/format"
import { utilizationState } from "@/lib/demo/rates"
import type { RateModel } from "@/lib/demo/types"

const YEAR_S = 365 * 24 * 3600

/** Home hero: the tUSDC pool's curve and a position whose balance visibly grows. */
export function HeroLive({
  locale,
  model,
  utilization,
  apy,
  value,
  contributed,
  copy,
  curve,
  states,
}: {
  locale: Locale
  model: RateModel
  utilization: number
  apy: number
  value: number
  contributed: number
  copy: { label: string; pool: string; utilization: string; supplyApy: string; position: string; supplied: string; earned: string; ticking: string }
  curve: { x: string; borrow: string; supply: string; optimal: string; now: string }
  states: Record<"comfortable" | "busy" | "tight", string>
}) {
  const [elapsed, setElapsed] = useState(0)
  useEffect(() => {
    const start = Date.now()
    const id = setInterval(() => setElapsed((Date.now() - start) / 1000), 1000)
    return () => clearInterval(id)
  }, [])
  const current = value * (1 + (apy * elapsed) / YEAR_S)
  const earned = current - contributed
  const pct = (f: number) => formatPercent(f, locale)
  const state = utilizationState(utilization, model)

  return (
    <figure aria-label={copy.label} className="relative rounded-3xl border bg-card p-4 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <p className="text-lg font-extrabold">{copy.pool}</p>
        <StateBadge state={state} label={states[state]} />
      </div>
      <dl className="mt-3 grid grid-cols-2 gap-3">
        <div>
          <dt className="text-xs font-semibold text-muted-foreground">{copy.utilization}</dt>
          <dd className="font-mono text-xl font-bold tabular-nums">{pct(utilization)}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold text-muted-foreground">{copy.supplyApy}</dt>
          <dd className="font-mono text-xl font-bold text-primary-ink tabular-nums">{pct(apy)}</dd>
        </div>
      </dl>
      <RateCurve
        className="mt-3"
        model={model}
        utilization={utilization}
        labels={{ ...curve, optimal: curve.optimal.replace("{value}", formatPercent(model.kink, locale, 0)) }}
        formatPct={(f) => formatPercent(f, locale, 0)}
        formatRate={pct}
        ariaLabel={`${copy.pool}: ${copy.utilization} ${pct(utilization)}, ${copy.supplyApy} ${pct(apy)}`}
      />
      <div className="mt-4 rounded-2xl border bg-background p-4">
        <div className="flex items-baseline justify-between gap-3">
          <p className="eyebrow text-muted-foreground">{copy.position}</p>
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-success opacity-60 motion-reduce:hidden" />
              <span className="relative inline-flex size-2 rounded-full bg-success" />
            </span>
            {copy.ticking}
          </p>
        </div>
        <p className="mt-2 font-mono text-2xl font-bold tabular-nums sm:text-3xl" aria-live="off">
          {formatAmount(current, "tUSDC", locale, 6)} <span className="font-sans text-base text-muted-foreground">tUSDC</span>
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          <span className="font-mono font-bold text-success tabular-nums">+{formatAmount(earned, "tUSDC", locale, 6)}</span> {copy.earned} · {copy.supplied}
        </p>
      </div>
    </figure>
  )
}
