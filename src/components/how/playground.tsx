"use client"

import { RotateCcwIcon } from "lucide-react"
import { useId, useState } from "react"

import { RateCurve } from "@/components/diagrams/rate-curve"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import type { Dictionary } from "@/i18n"
import type { Locale } from "@/i18n/config"
import { t } from "@/i18n/t"
import { borrowRate, supplyRate } from "@/lib/demo/rates"
import type { RateModel } from "@/lib/demo/types"
import { formatNumber, formatPercent } from "@/lib/format"
import { cn } from "@/lib/utils"

type Params = RateModel & { u: number }

const PRESETS: Record<"stable" | "volatile" | "tight", Params> = {
  stable: { base: 0.005, slope1: 0.06, slope2: 0.75, kink: 0.85, reserveFactor: 0.1, u: 0.79 },
  volatile: { base: 0, slope1: 0.04, slope2: 1, kink: 0.45, reserveFactor: 0.2, u: 0.3 },
  tight: { base: 0, slope1: 0.07, slope2: 0.3, kink: 0.8, reserveFactor: 0.2, u: 0.96 },
}

const EXAMPLE = 10_000

/** The rate model with every governance lever exposed (flow 5). */
export function Playground({ locale, copy, curve }: { locale: Locale; copy: Dictionary["how"]["playground"]; curve: Dictionary["common"]["curve"] }) {
  const [p, setP] = useState<Params>(PRESETS.stable)
  const [preset, setPreset] = useState<keyof typeof PRESETS | null>("stable")
  const pct = (f: number) => formatPercent(f, locale)
  const set = (k: keyof Params) => (v: number) => {
    setPreset(null)
    setP((prev) => ({ ...prev, [k]: v }))
  }
  const b = borrowRate(p.u, p)
  const s = supplyRate(p.u, p)
  const reserve = b * p.u * p.reserveFactor
  const above = p.u > p.kink

  const sliders: { param: keyof Params; label: string; hint: string; min: number; max: number; step: number }[] = [
    { param: "u", label: copy.utilization, hint: copy.utilizationHint, min: 0, max: 1, step: 0.005 },
    { param: "kink", label: copy.kink, hint: copy.kinkHint, min: 0.3, max: 0.95, step: 0.01 },
    { param: "base", label: copy.base, hint: copy.baseHint, min: 0, max: 0.05, step: 0.0025 },
    { param: "slope1", label: copy.slope1, hint: copy.slope1Hint, min: 0, max: 0.2, step: 0.005 },
    { param: "slope2", label: copy.slope2, hint: copy.slope2Hint, min: 0, max: 1.5, step: 0.05 },
    { param: "reserveFactor", label: copy.reserve, hint: copy.reserveHint, min: 0, max: 0.5, step: 0.01 },
  ]

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:items-start">
      <div className="flex min-w-0 flex-col gap-4 rounded-3xl border bg-card p-4 sm:p-6 lg:sticky lg:top-24">
        <RateCurve
          model={p}
          utilization={p.u}
          labels={{ x: curve.x, borrow: curve.borrow, supply: curve.supply, optimal: t(curve.optimal, { value: formatPercent(p.kink, locale, 0) }), now: copy.supplyApy }}
          formatPct={(f) => formatPercent(f, locale, 0)}
          formatRate={pct}
          ariaLabel={`${copy.title}: ${copy.utilization} ${pct(p.u)}, ${copy.borrowApr} ${pct(b)}, ${copy.supplyApy} ${pct(s)}`}
        />
        <div role="status" aria-live="polite" className="rounded-2xl border bg-background p-4">
          <p className="eyebrow text-muted-foreground">
            {copy.results} · {pct(p.u)}
          </p>
          <dl className="mt-3 grid grid-cols-3 gap-3">
            <Result label={copy.borrowApr} value={pct(b)} sub={t(copy.perYear, { amount: formatNumber(EXAMPLE * p.u, locale, 0) })} />
            <Result label={copy.supplyApy} value={pct(s)} sub={t(copy.perYear, { amount: formatNumber(EXAMPLE, locale, 0) })} strong />
            <Result label={copy.reserveCut} value={pct(p.reserveFactor)} sub={t(copy.reserveSub, { amount: formatNumber(EXAMPLE * reserve, locale, 0) })} />
          </dl>
          <p className="mt-3 text-sm text-muted-foreground">{above ? copy.explain.above : copy.explain.below}</p>
          <p className="mt-2 text-xs text-muted-foreground">{copy.example}</p>
        </div>
      </div>

      <div className="flex min-w-0 flex-col gap-5">
        <div>
          <p className="text-sm font-bold">{copy.presets}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {(Object.keys(PRESETS) as (keyof typeof PRESETS)[]).map((k) => (
              <Button
                key={k}
                size="sm"
                variant="outline"
                aria-pressed={preset === k}
                className={cn(preset === k && "border-foreground bg-secondary")}
                onClick={() => {
                  setP(PRESETS[k])
                  setPreset(k)
                }}
              >
                {copy.presetItems[k]}
              </Button>
            ))}
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setP(PRESETS.stable)
                setPreset("stable")
              }}
            >
              <RotateCcwIcon aria-hidden="true" />
              {copy.reset}
            </Button>
          </div>
        </div>
        {sliders.map((sl) => (
          <SliderRow key={sl.param} label={sl.label} hint={sl.hint} min={sl.min} max={sl.max} step={sl.step} value={p[sl.param]} onChange={set(sl.param)} format={pct} />
        ))}
      </div>
    </div>
  )
}

function Result({ label, value, sub, strong }: { label: string; value: string; sub: string; strong?: boolean }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs font-semibold text-muted-foreground">{label}</dt>
      <dd className={cn("font-mono text-lg font-bold tabular-nums sm:text-xl", strong && "text-primary-ink")}>{value}</dd>
      <dd className="truncate text-[0.7rem] text-muted-foreground">{sub}</dd>
    </div>
  )
}

function SliderRow({
  label,
  hint,
  min,
  max,
  step,
  value,
  onChange,
  format,
}: {
  label: string
  hint: string
  min: number
  max: number
  step: number
  value: number
  onChange: (v: number) => void
  format: (v: number) => string
}) {
  const id = useId()
  return (
    <div className="rounded-2xl border bg-card p-4">
      <div className="flex items-baseline justify-between gap-3">
        <p id={`${id}-l`} className="text-sm font-bold">
          {label}
        </p>
        <span className="font-mono text-sm font-bold tabular-nums">{format(value)}</span>
      </div>
      <p className="text-xs text-muted-foreground">{hint}</p>
      <Slider
        thumbLabel={label}
        className="mt-4"
        min={min}
        max={max}
        step={step}
        value={[value]}
        onValueChange={(v) => onChange(v[0] ?? value)}
      />
    </div>
  )
}
