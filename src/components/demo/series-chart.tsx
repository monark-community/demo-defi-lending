"use client"

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

/**
 * One-series area chart (time on x, one measure on y): thin 2px line, light
 * fill, recessive grid, crosshair + tooltip. Used for earnings and pool history.
 * One series per chart, so no legend: the heading names it.
 */
export function SeriesChart({
  data,
  formatX,
  formatY,
  formatTooltip,
  seriesName,
  ariaLabel,
  height = 220,
  color = "var(--primary)",
  yDomain,
}: {
  data: { t: number; v: number }[]
  formatX: (t: number) => string
  formatY: (v: number) => string
  formatTooltip?: (v: number) => string
  seriesName: string
  ariaLabel: string
  height?: number
  color?: string
  yDomain?: [number | "auto" | "dataMin", number | "auto" | "dataMax"]
}) {
  return (
    <div role="img" aria-label={ariaLabel} style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <CartesianGrid vertical={false} stroke="var(--border)" />
          <XAxis
            dataKey="t"
            type="number"
            scale="time"
            domain={["dataMin", "dataMax"]}
            tickFormatter={formatX}
            tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
            tickLine={false}
            axisLine={{ stroke: "var(--border)" }}
            minTickGap={36}
          />
          <YAxis
            tickFormatter={formatY}
            tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            width={56}
            domain={yDomain ?? [0, "auto"]}
          />
          <Tooltip
            cursor={{ stroke: "var(--muted-foreground)", strokeDasharray: "3 3" }}
            contentStyle={{
              background: "var(--popover)",
              border: "1px solid var(--border)",
              borderRadius: 12,
              color: "var(--popover-foreground)",
              fontSize: 12,
            }}
            labelFormatter={(t) => formatX(Number(t))}
            formatter={(v) => [(formatTooltip ?? formatY)(Number(v)), seriesName]}
          />
          <Area
            type="monotone"
            dataKey="v"
            name={seriesName}
            stroke={color}
            strokeWidth={2}
            fill={color}
            fillOpacity={0.12}
            isAnimationActive={false}
            activeDot={{ r: 4, stroke: "var(--card)", strokeWidth: 2, fill: color }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
