"use client"

import {
  ArrowDownToLineIcon,
  ArrowRightIcon,
  ArrowUpFromLineIcon,
  BadgeCheckIcon,
  CircleSlashIcon,
  DropletIcon,
  HourglassIcon,
  InboxIcon,
  ListOrderedIcon,
  WalletIcon,
} from "lucide-react"
import Link from "next/link"
import { useMemo, useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { InfoTip } from "@/components/ui/info-tip"
import { href } from "@/i18n/config"
import { t } from "@/i18n/t"
import { useTx } from "@/lib/demo/chain"
import { earnings, earningsSeries, yourQueued } from "@/lib/demo/ops"
import { accrue, available, poolUtilization, supplyRate, utilizationState } from "@/lib/demo/rates"
import { actions, useDemo, useNow } from "@/lib/demo/store"
import { shareSymbol, TOKEN_LIST, TOKENS } from "@/lib/demo/tokens"
import type { ActivityKind, DemoState, TokenSymbol } from "@/lib/demo/types"
import { formatCompact, formatDateTime, formatPercent, formatShortDate, formatToken, formatUsd } from "@/lib/format"
import { cn } from "@/lib/utils"

import { Amount } from "./amount"
import { useAppCopy } from "./app-provider"
import { SeriesChart } from "./series-chart"
import { StateBadge } from "./state-badge"
import { TokenMark } from "./token-mark"
import { TxFeedback } from "./tx-feedback"

export function Dashboard() {
  const demo = useDemo()
  const now = useNow()
  const { app, locale } = useAppCopy()
  const d = app.dashboard
  if (!demo || !now) return null
  const e = earnings(demo, now)

  return (
    <div className="flex flex-col gap-10">
      <h1 className="text-3xl font-extrabold tracking-display sm:text-4xl">{d.title}</h1>

      <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Tile label={d.tiles.supplied} value={formatUsd(e.valueUsd, locale)} />
        <Tile label={d.tiles.earned} value={`+${formatUsd(e.earnedUsd, locale)}`} accent />
        <Tile label={d.tiles.apy} value={formatPercent(e.blendedApy, locale)} />
        <Tile label={d.tiles.queued} value={formatUsd(e.queuedUsd, locale)} />
      </dl>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <div className="flex min-w-0 flex-col gap-6">
          <EarningsCard demo={demo} now={now} earnedUsd={e.earnedUsd} />
          <Positions perPool={e.perPool} />
        </div>
        <div className="flex min-w-0 flex-col gap-6">
          <QueueList demo={demo} now={now} />
          <WalletCard demo={demo} />
        </div>
      </div>

      <Markets demo={demo} now={now} />
      <ActivityLog demo={demo} />
    </div>
  )
}

function Tile({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-2xl border bg-card p-4">
      <dt className="text-xs font-semibold text-muted-foreground">{label}</dt>
      <dd className={cn("mt-1 font-mono text-xl font-bold tabular-nums sm:text-2xl", accent && "text-success")}>{value}</dd>
    </div>
  )
}

function Card({ title, id, children, action, className }: { title: string; id: string; children: React.ReactNode; action?: React.ReactNode; className?: string }) {
  return (
    <section aria-labelledby={id} className={cn("rounded-3xl border bg-card p-4 sm:p-6", className)}>
      <div className="flex items-center justify-between gap-3">
        <h2 id={id} className="text-lg font-bold">
          {title}
        </h2>
        {action}
      </div>
      <div className="mt-4">{children}</div>
    </section>
  )
}

function EarningsCard({ demo, now, earnedUsd }: { demo: DemoState; now: number; earnedUsd: number }) {
  const { app, locale } = useAppCopy()
  const c = app.dashboard.chart
  const series = useMemo(() => earningsSeries(demo), [demo])
  const data = [...series.map((p) => ({ t: Date.parse(p.t), v: p.earned })), { t: now, v: Math.max(earnedUsd, 0) }]
  return (
    <Card title={c.title} id="earnings-title">
      {demo.activity.some((a) => a.kind === "supply") ? (
        <SeriesChart
          data={data}
          seriesName={c.earned}
          ariaLabel={`${c.label}: ${formatUsd(earnedUsd, locale)}`}
          formatX={(ts) => formatShortDate(ts, locale)}
          formatY={(v) => formatUsd(v, locale, true)}
          formatTooltip={(v) => formatUsd(v, locale)}
        />
      ) : (
        <Empty icon={InboxIcon} text={c.empty} />
      )}
    </Card>
  )
}

function Empty({ icon: Icon, text }: { icon: typeof InboxIcon; text: string }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
      <Icon className="size-6" aria-hidden="true" />
      <p className="max-w-[40ch]">{text}</p>
    </div>
  )
}

function Positions({ perPool }: { perPool: ReturnType<typeof earnings>["perPool"] }) {
  const { app, locale } = useAppCopy()
  const p = app.dashboard.positions
  const rows = perPool.filter((x) => x.shares > 1e-9)
  return (
    <Card title={p.title} id="positions-title">
      {rows.length === 0 ? (
        <Empty icon={InboxIcon} text={p.empty} />
      ) : (
        <ul className="flex flex-col divide-y">
          {rows.map((r) => {
            return (
              <li key={r.symbol} className="flex flex-wrap items-center gap-x-4 gap-y-3 py-4 first:pt-0 last:pb-0">
                <div className="flex min-w-0 flex-1 basis-48 items-center gap-3">
                  <TokenMark symbol={r.symbol} />
                  <div className="min-w-0">
                    <p className="font-bold">{r.symbol}</p>
                    <Amount value={r.shares} symbol={r.symbol} locale={locale} label={shareSymbol(r.symbol)} className="text-xs text-muted-foreground" />
                  </div>
                </div>
                <dl className="grid flex-1 basis-64 grid-cols-3 gap-3 text-sm">
                  <div>
                    <dt className="text-xs text-muted-foreground">{p.value}</dt>
                    <dd className="font-semibold">
                      <Amount value={r.value} symbol={r.symbol} locale={locale} showSymbol={false} />
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">{p.earned}</dt>
                    <dd className="font-mono font-semibold text-success tabular-nums">+{formatToken(Math.max(r.earned, 0), r.symbol, locale, 6).split(" ")[0]}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">{p.apy}</dt>
                    <dd className="font-mono font-semibold tabular-nums">{formatPercent(r.apy, locale)}</dd>
                  </div>
                </dl>
                <Button asChild variant="outline" size="sm" className="ml-auto">
                  <Link href={href(locale, `/app/pool/${r.symbol}`)} aria-label={`${p.manage} ${r.symbol}`}>
                    {p.manage}
                    <ArrowRightIcon aria-hidden="true" />
                  </Link>
                </Button>
              </li>
            )
          })}
        </ul>
      )}
    </Card>
  )
}

function WalletCard({ demo }: { demo: DemoState }) {
  const { app, locale } = useAppCopy()
  const w = app.dashboard.wallet
  const items = TOKEN_LIST.filter((s) => demo.wallet.balances[s] > 0)
  return (
    <Card title={w.title} id="wallet-title" action={<WalletIcon className="size-5 text-muted-foreground" aria-hidden="true" />}>
      {items.length === 0 ? (
        <Empty icon={WalletIcon} text={w.empty} />
      ) : (
        <ul className="flex flex-col gap-3">
          {items.map((s) => (
            <li key={s} className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-2.5">
                <TokenMark symbol={s} className="size-8" />
                <span className="font-semibold">{s}</span>
              </span>
              <Amount value={demo.wallet.balances[s]} symbol={s} locale={locale} usd showSymbol={false} className="items-end text-right" />
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}

export function QueueList({ demo, now, only }: { demo: DemoState; now: number; only?: TokenSymbol }) {
  const entries = TOKEN_LIST.filter((s) => !only || s === only).flatMap((symbol) => {
    const pool = accrue(demo.pools[symbol], now)
    return yourQueued(pool).map((entry) => {
      const pos = pool.queue.indexOf(entry)
      const ahead = pool.queue.slice(0, pos).reduce((a, q) => a + q.shares * pool.index, 0)
      return { symbol, entry, pos, ahead, amount: entry.shares * pool.index }
    })
  })
  if (!entries.length) return null
  return (
    <>
      {entries.map((x) => (
        <QueueCard key={x.entry.id} {...x} />
      ))}
    </>
  )
}

function QueueCard({ symbol, entry, pos, ahead, amount }: { symbol: TokenSymbol; entry: { id: string; requestedAt: string }; pos: number; ahead: number; amount: number }) {
  const { app, locale } = useAppCopy()
  const q = app.queue
  const tx = useTx()
  const cancel = () =>
    void tx
      .run(
        {
          title: app.summaries.cancel,
          rows: [
            { label: app.summaries.rowPool, value: symbol },
            { label: app.summaries.rowAmount, value: formatToken(amount, symbol, locale) },
          ],
          movesValue: true,
        },
        (hash) => actions.cancelQueued(symbol, entry.id, hash)
      )
      .then((r) => {
        if (r.ok) toast.success(app.toasts.cancelled)
      })

  return (
    <section aria-labelledby={`q-${entry.id}`} className="rounded-3xl border-2 border-dashed border-warning/60 bg-card p-4 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-1">
          <h2 id={`q-${entry.id}`} className="flex items-center gap-2 text-lg font-bold">
            <HourglassIcon className="size-5 text-warning" aria-hidden="true" />
            {q.title}
          </h2>
          <InfoTip label={q.info}>
            <p>{q.body}</p>
            <p className="mt-2 text-muted-foreground">{q.tip}</p>
          </InfoTip>
        </div>
        <span className="rounded-full border px-2.5 py-0.5 text-xs font-bold">{t(q.position, { n: pos + 1 })}</span>
      </div>
      <p className="mt-3 font-mono text-2xl font-bold tabular-nums">{formatToken(amount, symbol, locale)}</p>
      <p className="mt-1 text-xs text-muted-foreground">
        {t(q.requested, { date: formatDateTime(entry.requestedAt, locale) })}
        {ahead > 0 ? <> · {t(q.ahead, { amount: formatToken(ahead, symbol, locale) })}</> : null}
      </p>
      <div className="mt-4 flex flex-col gap-3">
        <Button variant="outline" size="sm" onClick={cancel} disabled={tx.busy} className="self-start">
          <CircleSlashIcon aria-hidden="true" />
          {q.cancelLong}
        </Button>
        <TxFeedback state={tx.state} onRetry={cancel} onDismiss={tx.reset} />
      </div>
    </section>
  )
}

function Markets({ demo, now }: { demo: DemoState; now: number }) {
  const { app, locale, states, stateHints } = useAppCopy()
  const m = app.markets
  const rows = TOKEN_LIST.map((symbol) => {
    const pool = accrue(demo.pools[symbol], now)
    const u = poolUtilization(pool)
    const pos = demo.positions.find((p) => p.symbol === symbol)
    return {
      symbol,
      pool,
      u,
      apy: supplyRate(u, pool.model),
      state: utilizationState(u, pool.model),
      avail: pool.queue.length ? 0 : available(pool),
      yours: (pos?.shares ?? 0) * pool.index,
    }
  })

  return (
    <section aria-labelledby="markets-title">
      <h2 id="markets-title" className="text-2xl font-bold">
        {m.title}
      </h2>

      {/* Phones: one card per pool */}
      <ul className="mt-4 flex flex-col gap-3 md:hidden">
        {rows.map((r) => (
          <li key={r.symbol}>
            <Link href={href(locale, `/app/pool/${r.symbol}`)} className="block rounded-2xl border bg-card p-4 transition-colors hover:bg-muted/50">
              <div className="flex items-center gap-3">
                <TokenMark symbol={r.symbol} />
                <div className="min-w-0 flex-1">
                  <p className="font-bold">{r.symbol}</p>
                  <p className="truncate text-xs text-muted-foreground">{TOKENS[r.symbol].name}</p>
                </div>
                <div className="text-right">
                  <p className="font-mono text-lg font-bold text-primary-ink tabular-nums">{formatPercent(r.apy, locale)}</p>
                  <p className="text-xs text-muted-foreground">{m.apy}</p>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <UtilBar u={r.u} kink={r.pool.model.kink} />
                <span className="font-mono text-xs font-semibold tabular-nums">{formatPercent(r.u, locale)}</span>
                <StateBadge state={r.state} label={states[r.state]} />
              </div>
              <dl className="mt-3 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <dt className="text-muted-foreground">{m.available}</dt>
                  <dd className="font-mono font-semibold tabular-nums">{formatCompact(r.avail, locale)} {r.symbol}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">{m.yours}</dt>
                  <dd className="font-mono font-semibold tabular-nums">{r.yours > 0 ? formatToken(r.yours, r.symbol, locale) : m.none}</dd>
                </div>
              </dl>
            </Link>
          </li>
        ))}
      </ul>

      {/* Tablets and up: a table */}
      <div className="mt-4 hidden overflow-hidden rounded-3xl border bg-card md:block">
        <table className="w-full text-sm">
          <caption className="sr-only">{m.caption}</caption>
          <thead>
            <tr className="border-b text-left text-xs text-muted-foreground">
              <th scope="col" className="px-5 py-3 font-semibold">{m.pool}</th>
              <th scope="col" className="px-3 py-3 text-right font-semibold">{m.apy}</th>
              <th scope="col" className="px-3 py-3 font-semibold">{m.utilization}</th>
              <th scope="col" className="px-3 py-3 text-right font-semibold">{m.available}</th>
              <th scope="col" className="px-3 py-3 text-right font-semibold">{m.supplied}</th>
              <th scope="col" className="px-5 py-3 text-right font-semibold">{m.yours}</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {rows.map((r) => (
              <tr key={r.symbol} className="group relative transition-colors hover:bg-muted/50">
                <th scope="row" className="px-5 py-4 text-left font-normal">
                  <Link href={href(locale, `/app/pool/${r.symbol}`)} className="flex items-center gap-3 after:absolute after:inset-0" aria-label={t(m.open, { token: r.symbol })}>
                    <TokenMark symbol={r.symbol} />
                    <span>
                      <span className="block font-bold">{r.symbol}</span>
                      <span className="block text-xs text-muted-foreground">{TOKENS[r.symbol].name}</span>
                    </span>
                  </Link>
                </th>
                <td className="px-3 py-4 text-right font-mono text-base font-bold text-primary-ink tabular-nums">{formatPercent(r.apy, locale)}</td>
                <td className="px-3 py-4">
                  <div className="flex items-center gap-2">
                    <UtilBar u={r.u} kink={r.pool.model.kink} className="w-20" />
                    <span className="w-14 font-mono text-xs font-semibold tabular-nums">{formatPercent(r.u, locale)}</span>
                    <StateBadge state={r.state} label={states[r.state]} title={stateHints[r.state]} />
                  </div>
                </td>
                <td className="px-3 py-4 text-right font-mono tabular-nums">{formatCompact(r.avail, locale)}</td>
                <td className="px-3 py-4 text-right font-mono tabular-nums">
                  {formatCompact(r.pool.supplied, locale)}
                </td>
                <td className="px-5 py-4 text-right font-mono tabular-nums">{r.yours > 0 ? formatToken(r.yours, r.symbol, locale) : m.none}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

export function UtilBar({ u, kink, className }: { u: number; kink: number; className?: string }) {
  return (
    <span aria-hidden="true" className={cn("relative block h-2 flex-1 rounded-full bg-muted", className)}>
      <span className="absolute inset-y-0 left-0 rounded-full bg-foreground/70" style={{ width: `${Math.min(u, 1) * 100}%` }} />
      <span className="absolute -inset-y-1 w-0.5 rounded-full bg-primary" style={{ left: `${kink * 100}%` }} />
    </span>
  )
}

const KIND_ICONS: Record<ActivityKind, typeof InboxIcon> = {
  supply: ArrowDownToLineIcon,
  withdraw: ArrowUpFromLineIcon,
  queued: ListOrderedIcon,
  queue_paid: ArrowUpFromLineIcon,
  queue_cancelled: CircleSlashIcon,
  approve: BadgeCheckIcon,
  faucet: DropletIcon,
}

function ActivityLog({ demo }: { demo: DemoState }) {
  const { app, locale } = useAppCopy()
  const a = app.activity
  const [all, setAll] = useState(false)
  const items = all ? demo.activity : demo.activity.slice(0, 5)
  return (
    <Card title={a.title} id="activity-title">
      {demo.activity.length === 0 ? (
        <Empty icon={InboxIcon} text={a.empty} />
      ) : (
        <>
          <ol className="flex flex-col divide-y">
            {items.map((item) => {
              const Icon = KIND_ICONS[item.kind]
              const signed = item.kind === "supply" ? "−" : item.kind === "withdraw" || item.kind === "queue_paid" ? "+" : ""
              return (
                <li key={item.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-3 text-sm">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full border">
                    <Icon className="size-4 text-primary" aria-hidden="true" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold">
                      {a.kinds[item.kind]} {item.kind === "approve" ? item.symbol : null}
                    </span>
                    <span className="block text-xs text-muted-foreground" title={t(a.tx, { hash: item.hash })}>
                      {formatDateTime(item.at, locale)}
                    </span>
                  </span>
                  {item.amount > 0 ? (
                    <span className="font-mono font-semibold tabular-nums">
                      {signed}
                      {formatToken(item.amount, item.symbol, locale)}
                    </span>
                  ) : null}
                </li>
              )
            })}
          </ol>
          {demo.activity.length > 5 ? (
            <Button variant="link" className="mt-3" onClick={() => setAll((v) => !v)}>
              {all ? a.showLess : a.showAll}
            </Button>
          ) : null}
        </>
      )}
    </Card>
  )
}
