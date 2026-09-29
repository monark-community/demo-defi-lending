import { borrowRate, supplyRate } from "@/lib/demo/rates"
import type { RateModel } from "@/lib/demo/types"
import { cn } from "@/lib/utils"

export interface RateCurveLabels {
  x: string
  borrow: string
  supply: string
  /** e.g. "Optimal 85%" (already formatted). */
  optimal: string
  now: string
  after?: string
}

const W = 400
const H = 236
const L = 40
const R = 12
const T = 14
const B = 30

/**
 * The kinked interest-rate curve, drawn as flat line art: borrow APR (muted)
 * and supply APY (orange), the optimal-utilization bend, the pool's current
 * point and, optionally, where a pending transaction would move it.
 * Pure SVG with no hooks, so it renders on the server and animates on the client.
 */
export function RateCurve({
  model,
  utilization,
  preview,
  labels,
  formatPct,
  formatRate,
  ariaLabel,
  className,
  compact = false,
}: {
  model: RateModel
  utilization: number
  preview?: number | null
  labels: RateCurveLabels
  formatPct: (fraction: number) => string
  /** Formatter for the rate shown next to the dots (defaults to formatPct). */
  formatRate?: (fraction: number) => string
  ariaLabel: string
  className?: string
  compact?: boolean
}) {
  const top = Math.max(borrowRate(model.kink, model) * 2.6, borrowRate(utilization, model) * 1.25, 0.08)
  const yMax = Math.min(borrowRate(1, model), niceCeil(top))
  const x = (u: number) => L + u * (W - L - R)
  const y = (r: number) => T + (1 - r / yMax) * (H - T - B)
  const yDot = (r: number) => T + (1 - Math.min(r, yMax) / yMax) * (H - T - B)

  const steps = 80
  const pts = (fn: (u: number) => number) =>
    Array.from({ length: steps + 1 }, (_, i) => {
      const u = i / steps
      return `${x(u).toFixed(1)},${y(fn(u)).toFixed(1)}`
    }).join(" ")
  const borrowPts = pts((u) => borrowRate(u, model))
  const supplyPts = pts((u) => supplyRate(u, model))

  const cur = { x: x(utilization), y: yDot(supplyRate(utilization, model)) }
  const hasPreview = preview != null && Math.abs(preview - utilization) > 0.0005
  const nxt = hasPreview ? { x: x(preview), y: yDot(supplyRate(preview, model)) } : null
  const rate = formatRate ?? formatPct
  const halo = { stroke: "var(--card)", strokeWidth: 4, paintOrder: "stroke" as const, strokeLinejoin: "round" as const }
  const clipId = `clip-${Math.round(model.kink * 1000)}-${Math.round(model.slope2 * 1000)}`

  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={ariaLabel} className={cn("h-auto w-full overflow-visible", className)}>
      <defs>
        <clipPath id={clipId}>
          <rect x={L} y={T - 4} width={W - L - R + 2} height={H - T - B + 4} />
        </clipPath>
      </defs>

      {/* Grid and axes */}
      {[0, 0.5, 1].map((f) => (
        <g key={f}>
          <line x1={L} x2={W - R} y1={y(yMax * f)} y2={y(yMax * f)} stroke="var(--border)" strokeWidth={1} />
          <text x={L - 6} y={y(yMax * f) + 4} textAnchor="end" fontSize="10" fill="var(--muted-foreground)">
            {formatPct(yMax * f).replace(/[.,]00/, "")}
          </text>
        </g>
      ))}
      {[0, 0.25, 0.5, 0.75, 1].map((u) => (
        <text key={u} x={x(u)} y={H - B + 16} textAnchor={u === 0 ? "start" : u === 1 ? "end" : "middle"} fontSize="10" fill="var(--muted-foreground)">
          {formatPct(u).replace(/[.,]00/, "")}
        </text>
      ))}
      {!compact ? (
        <text x={W - R} y={H - 1} textAnchor="end" fontSize="10" fontWeight="700" fill="var(--muted-foreground)">
          {labels.x} →
        </text>
      ) : null}

      {/* The bend */}
      <line x1={x(model.kink)} x2={x(model.kink)} y1={T} y2={H - B} stroke="var(--muted-foreground)" strokeWidth={1} strokeDasharray="3 4" />
      <text x={x(model.kink) - 6} y={H - B - 8} textAnchor="end" fontSize="10" fontWeight="700" fill="var(--muted-foreground)" {...halo}>
        {labels.optimal}
      </text>

      <g clipPath={`url(#${clipId})`}>
        <polyline points={borrowPts} fill="none" stroke="var(--chart-3)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" strokeDasharray="1 5" />
        <polyline points={supplyPts} fill="none" stroke="var(--primary)" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
      </g>

      {/* Legend */}
      <g fontSize="10.5" fontWeight="700">
        <line x1={L + 8} x2={L + 26} y1={T + 8} y2={T + 8} stroke="var(--primary)" strokeWidth={2.5} strokeLinecap="round" />
        <text x={L + 32} y={T + 12} fill="var(--foreground)">
          {labels.supply}
        </text>
        <line x1={L + 8} x2={L + 26} y1={T + 26} y2={T + 26} stroke="var(--chart-3)" strokeWidth={2} strokeLinecap="round" strokeDasharray="1 5" />
        <text x={L + 32} y={T + 30} fill="var(--foreground)">
          {labels.borrow}
        </text>
      </g>

      {/* Where the pool is now */}
      <g style={{ transform: `translate(${cur.x}px, ${cur.y}px)`, transition: "transform 250ms ease-out" }}>
        <line x1={0} x2={0} y1={0} y2={H - B - cur.y} stroke="var(--primary)" strokeWidth={1} opacity={0.5} />
        <circle r={7} fill="var(--primary)" stroke="var(--card)" strokeWidth={3} />
      </g>
      <text
        x={cur.x < L + 120 ? cur.x + 12 : cur.x - 12}
        y={cur.y + (cur.y < T + 40 ? 18 : -12)}
        textAnchor={cur.x < L + 120 ? "start" : "end"}
        fontSize="11"
        fontWeight="800"
        fill="var(--foreground)"
        {...halo}
      >
        {labels.now} · {rate(supplyRate(utilization, model))}
      </text>

      {/* Where a pending transaction would move it */}
      {nxt ? (
        <g>
          <line x1={cur.x} y1={cur.y} x2={nxt.x} y2={nxt.y} stroke="var(--primary)" strokeWidth={1.5} strokeDasharray="4 4" />
          <circle cx={nxt.x} cy={nxt.y} r={6.5} fill="var(--card)" stroke="var(--primary)" strokeWidth={2.5} />
          {labels.after ? (
            <text
              x={nxt.x < L + 120 ? nxt.x + 12 : nxt.x - 12}
              y={nxt.y + 22}
              textAnchor={nxt.x < L + 120 ? "start" : "end"}
              fontSize="11"
              fontWeight="800"
              fill="var(--primary-ink)"
              {...halo}
            >
              {labels.after} · {rate(supplyRate(preview!, model))}
            </text>
          ) : null}
        </g>
      ) : null}
    </svg>
  )
}

function niceCeil(v: number): number {
  const steps = [0.02, 0.04, 0.05, 0.08, 0.1, 0.12, 0.16, 0.2, 0.3, 0.4, 0.5, 0.6, 0.8, 1, 1.2, 1.6, 2]
  return steps.find((s) => s >= v) ?? v
}
