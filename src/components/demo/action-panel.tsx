"use client"

import { CheckCircle2Icon, CheckIcon } from "lucide-react"
import { useEffect, useId, useState } from "react"

import { QueueBar } from "@/components/diagrams/queue-bar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { t } from "@/i18n/t"
import { useTx } from "@/lib/demo/chain"
import { planWithdrawal } from "@/lib/demo/ops"
import { accrue, available, poolUtilization, supplyRate, utilization } from "@/lib/demo/rates"
import { actions, demoNow, getDemo, useDemo, useNow } from "@/lib/demo/store"
import { parseAmount, shareSymbol, TOKENS } from "@/lib/demo/tokens"
import type { TokenSymbol } from "@/lib/demo/types"
import { formatAmount, formatPercent, formatToken } from "@/lib/format"
import { cn } from "@/lib/utils"

import { useAppCopy } from "./app-provider"
import { Disclaimer } from "./disclaimer"
import { TxFeedback } from "./tx-feedback"

type Mode = "supply" | "withdraw"
type Preview = { u: number; kind: Mode } | null

/** Supply / withdraw panel for one pool: validation, preview, approval step, transaction states. */
export function ActionPanel({ symbol, onPreview }: { symbol: TokenSymbol; onPreview: (p: Preview) => void }) {
  const { app } = useAppCopy()
  const [mode, setMode] = useState<Mode>("supply")
  return (
    <section aria-label={`${app.panel.supply} / ${app.panel.withdraw} · ${symbol}`} className="rounded-3xl border-2 border-foreground/80 bg-card p-4 sm:p-6 dark:border-border">
      <Tabs
        value={mode}
        onValueChange={(v) => {
          setMode(v as Mode)
          onPreview(null)
        }}
      >
        <TabsList className="w-full">
          <TabsTrigger value="supply">{app.panel.supply}</TabsTrigger>
          <TabsTrigger value="withdraw">{app.panel.withdraw}</TabsTrigger>
        </TabsList>
        <TabsContent value="supply" className="mt-5">
          <SupplyForm symbol={symbol} onPreview={onPreview} />
        </TabsContent>
        <TabsContent value="withdraw" className="mt-5">
          <WithdrawForm symbol={symbol} onPreview={onPreview} />
        </TabsContent>
      </Tabs>
    </section>
  )
}

/** Shared amount field: parsing, validation messages, Max. */
function useAmount(symbol: TokenSymbol, limit: number, tooMuch: string) {
  const { app } = useAppCopy()
  const e = app.panel.errors
  const [raw, setRaw] = useState("")
  const [max, setMax] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const parsed = raw.trim() ? parseAmount(raw, symbol) : null
  const amount = max ? limit : (parsed ?? 0)
  let error: string | null = null
  if (!raw.trim()) error = e.empty
  else if (parsed === null && !max) error = e.invalid
  else if (amount <= 0) error = e.zero
  else if (amount > limit + 1e-9) error = tooMuch
  const visibleError = error && (submitted || (raw.trim() !== "" && error !== e.empty)) ? error : null
  return {
    raw,
    amount,
    error,
    visibleError,
    max,
    setRaw: (v: string) => {
      setRaw(v)
      setMax(false)
    },
    setMax: (display: string) => {
      setRaw(display)
      setMax(true)
    },
    submit: () => setSubmitted(true),
    clear: () => {
      setRaw("")
      setMax(false)
      setSubmitted(false)
    },
  }
}

function AmountField({
  id,
  symbol,
  field,
  balanceLine,
  onMax,
  disabled,
}: {
  id: string
  symbol: TokenSymbol
  field: ReturnType<typeof useAmount>
  balanceLine: string
  onMax: () => void
  disabled?: boolean
}) {
  const { app } = useAppCopy()
  const errId = `${id}-err`
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <Label htmlFor={id} className="text-sm font-bold">
          {app.panel.amount}
        </Label>
        <span className="text-xs text-muted-foreground">{balanceLine}</span>
      </div>
      <div className="relative mt-2">
        <Input
          id={id}
          inputMode="decimal"
          autoComplete="off"
          placeholder="0"
          value={field.raw}
          disabled={disabled}
          onChange={(ev) => field.setRaw(ev.target.value)}
          aria-invalid={field.visibleError ? true : undefined}
          aria-describedby={field.visibleError ? errId : undefined}
          className="h-14 rounded-2xl pr-32 font-mono text-2xl font-bold tabular-nums md:text-2xl"
        />
        <div className="absolute inset-y-0 right-2 flex items-center gap-2">
          <span className="text-sm font-bold text-muted-foreground">{symbol}</span>
          <Button type="button" size="xs" variant="outline" onClick={onMax} disabled={disabled}>
            {app.panel.max}
          </Button>
        </div>
      </div>
      <p id={errId} role={field.visibleError ? "alert" : undefined} className="mt-1.5 min-h-5 text-sm font-semibold text-destructive">
        {field.visibleError}
      </p>
    </div>
  )
}

function PreviewList({ rows }: { rows: { label: string; value: string; strong?: boolean }[] }) {
  return (
    <dl className="divide-y rounded-2xl border bg-background text-sm">
      {rows.map((r) => (
        <div key={r.label} className="flex items-baseline justify-between gap-4 px-4 py-2.5">
          <dt className="text-muted-foreground">{r.label}</dt>
          <dd className={cn("text-right font-mono font-semibold tabular-nums", r.strong && "text-primary-ink")}>{r.value}</dd>
        </div>
      ))}
    </dl>
  )
}

function SupplyForm({ symbol, onPreview }: { symbol: TokenSymbol; onPreview: (p: Preview) => void }) {
  const demo = useDemo()!
  const now = useNow()
  const { app, locale, disclaimer } = useAppCopy()
  const pn = app.panel
  const id = useId()
  const balance = demo.wallet.balances[symbol]
  const approved = demo.wallet.allowances[symbol]
  const field = useAmount(symbol, balance, pn.errors.tooMuchWallet)
  const approveTx = useTx()
  const tx = useTx()
  const [done, setDone] = useState<{ amount: number } | null>(null)

  const pool = accrue(demo.pools[symbol], now || demoNow())
  const u = poolUtilization(pool)
  const valid = !field.error
  const amount = valid ? field.amount : 0
  const newU = utilization(pool.borrowed, pool.supplied + amount)
  const newApy = supplyRate(newU, pool.model)
  const busy = tx.busy || approveTx.busy

  useEffect(() => {
    onPreview(valid && amount > 0 ? { u: newU, kind: "supply" } : null)
  }, [valid, amount, newU, onPreview])

  const approve = () =>
    void approveTx
      .run(
        {
          title: t(app.summaries.approve, { token: symbol }),
          rows: [{ label: app.summaries.approveRow, value: t(app.summaries.approveValue, { token: symbol }) }],
          movesValue: false,
        },
        (hash) => actions.approve(symbol, hash)
      )


  const supply = () => {
    field.submit()
    if (field.error) return
    const value = field.max ? (getDemo()?.wallet.balances[symbol] ?? amount) : amount
    const shares = value / pool.index
    void tx
      .run(
        {
          title: t(app.summaries.supply, { amount: formatToken(value, symbol, locale) }),
          rows: [
            { label: app.summaries.rowPool, value: symbol },
            { label: app.summaries.rowReceive, value: `≈ ${formatAmount(shares, symbol, locale)} ${shareSymbol(symbol)}` },
          ],
          movesValue: true,
        },
        (hash) => actions.supply(symbol, value, hash)
      )
      .then((r) => {
        if (!r.ok) return
        setDone({ amount: value })
        onPreview(null)
        field.clear()
      })
  }

  if (done && tx.state.phase === "confirmed") {
    return (
      <div className="flex flex-col gap-4">
        <p className="flex items-start gap-2 font-bold">
          <CheckCircle2Icon className="mt-0.5 size-5 shrink-0 text-success" aria-hidden="true" />
          {pn.supplyConfirmed}
        </p>
        <TxFeedback state={tx.state} confirmedLabel={t(app.toasts.supplied, { amount: formatToken(done.amount, symbol, locale) })} />
        <Button
          variant="outline"
          className="self-start"
          onClick={() => {
            setDone(null)
            tx.reset()
            approveTx.reset()
          }}
        >
          {pn.another}
        </Button>
      </div>
    )
  }

  return (
    <form
      noValidate
      onSubmit={(ev) => {
        ev.preventDefault()
        if (approved) supply()
      }}
      className="flex flex-col gap-4"
    >
      {balance <= 0 ? <p className="rounded-2xl border border-dashed p-3 text-sm text-muted-foreground">{t(pn.noWallet, { token: symbol })}</p> : null}
      <AmountField
        id={`${id}-supply`}
        symbol={symbol}
        field={field}
        balanceLine={t(pn.walletBalance, { amount: formatToken(balance, symbol, locale) })}
        onMax={() => field.setMax(formatAmount(balance, symbol, locale).replace(/[\s  ]/g, "").replace(/,(?=\d{3})/g, ""))}
        disabled={busy}
      />

      <div>
        <p className="eyebrow text-muted-foreground">{pn.preview}</p>
        <div className="mt-2">
          <PreviewList
            rows={[
              { label: pn.receive, value: amount ? `${formatAmount(amount / pool.index, symbol, locale)} ${shareSymbol(symbol)}` : "—" },
              { label: pn.newUtil, value: `${formatPercent(u, locale)} → ${formatPercent(newU, locale)}` },
              { label: pn.newApy, value: amount ? formatPercent(newApy, locale) : formatPercent(supplyRate(u, pool.model), locale), strong: true },
              { label: pn.earn30, value: amount ? `+${formatToken((amount * newApy * 30) / 365, symbol, locale, TOKENS[symbol].digits + 2)}` : "—" },
              { label: pn.earn365, value: amount ? `+${formatToken(amount * newApy, symbol, locale)}` : "—" },
            ]}
          />
          <p className="mt-1.5 text-xs text-muted-foreground">{pn.atCurrent}</p>
        </div>
      </div>

      {!approved ? (
        <ol className="flex flex-col gap-3">
          <Step n={1} done={false} title={t(pn.approveStep, { token: symbol })} body={t(pn.approveWhy, { token: symbol })}>
            <Button type="button" onClick={approve} disabled={busy} className="self-start">
              {t(pn.approveButton, { token: symbol })}
            </Button>
            <TxFeedback state={approveTx.state} onRetry={approve} onDismiss={approveTx.reset} />
          </Step>
          <Step n={2} done={false} disabled title={t(pn.supplyStep, { amount: amount ? formatToken(amount, symbol, locale) : symbol })}>
            <Button type="button" variant="outline" disabled className="self-start">
              {pn.supplyButton}
            </Button>
          </Step>
        </ol>
      ) : (
        <div className="flex flex-col gap-3">
          {approveTx.state.phase === "confirmed" ? (
            <p className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
              <CheckIcon className="size-4 text-success" aria-hidden="true" />
              {t(pn.approveStep, { token: symbol })} · {pn.stepDone}
            </p>
          ) : null}
          <Button type="submit" size="lg" disabled={busy} className="w-full">
            {amount ? t(pn.supplyAmountButton, { amount: formatToken(amount, symbol, locale) }) : pn.supplyButton}
          </Button>
          <TxFeedback state={tx.state} onRetry={supply} onDismiss={tx.reset} />
        </div>
      )}
      <Disclaimer text={disclaimer} />
    </form>
  )
}

function Step({ n, done, disabled, title, body, children }: { n: number; done: boolean; disabled?: boolean; title: string; body?: string; children: React.ReactNode }) {
  return (
    <li className={cn("flex gap-3 rounded-2xl border p-4", disabled && "opacity-60")}>
      <span className={cn("flex size-7 shrink-0 items-center justify-center rounded-full border-[1.5px] text-sm font-extrabold", done ? "border-success text-success" : "border-primary")}>
        {done ? <CheckIcon className="size-4" aria-hidden="true" /> : n}
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <p className="font-bold">{title}</p>
        {body ? <p className="text-sm text-muted-foreground">{body}</p> : null}
        {children}
      </div>
    </li>
  )
}

function WithdrawForm({ symbol, onPreview }: { symbol: TokenSymbol; onPreview: (p: Preview) => void }) {
  const demo = useDemo()!
  const now = useNow()
  const { app, locale, disclaimer } = useAppCopy()
  const pn = app.panel
  const id = useId()
  const pool = accrue(demo.pools[symbol], now || demoNow())
  const position = demo.positions.find((p) => p.symbol === symbol)
  const holding = (position?.shares ?? 0) * pool.index
  const field = useAmount(symbol, holding, pn.errors.tooMuchPosition)
  const tx = useTx()
  const [done, setDone] = useState<{ instant: number; queued: number } | null>(null)

  const valid = !field.error
  const amount = valid ? field.amount : 0
  const plan = planWithdrawal(pool, amount)
  const u = poolUtilization(pool)
  const newU = utilization(pool.borrowed, pool.supplied - plan.instant)
  const ahead = pool.queue.reduce((a, q) => a + q.shares * pool.index, 0)

  useEffect(() => {
    onPreview(valid && plan.instant > 0 ? { u: newU, kind: "withdraw" } : null)
  }, [valid, plan.instant, newU, onPreview])

  const withdraw = () => {
    field.submit()
    if (field.error) return
    const d = getDemo()
    const live = d ? (d.positions.find((p) => p.symbol === symbol)?.shares ?? 0) * accrue(d.pools[symbol], demoNow()).index : amount
    const value = field.max ? live : Math.min(amount, live)
    const p = planWithdrawal(accrue(demo.pools[symbol], demoNow()), value)
    const rows = [{ label: app.summaries.rowPool, value: symbol }, { label: app.summaries.rowNow, value: formatToken(p.instant, symbol, locale) }]
    if (p.queued > 0) rows.push({ label: app.summaries.rowQueued, value: formatToken(p.queued, symbol, locale) })
    void tx
      .run({ title: t(app.summaries.withdraw, { amount: formatToken(value, symbol, locale) }), rows, movesValue: true }, (hash) => {
        // Confirmation is shown inline (and the queue card appears beside it),
        // so no toast here: it would sit on top of this very panel.
        setDone(actions.withdraw(symbol, value, hash, field.max))
      })
      .then((r) => {
        if (r.ok) {
          onPreview(null)
          field.clear()
        }
      })
  }

  if (done && tx.state.phase === "confirmed") {
    return (
      <div className="flex flex-col gap-4">
        <p className="flex items-start gap-2 font-bold">
          <CheckCircle2Icon className="mt-0.5 size-5 shrink-0 text-success" aria-hidden="true" />
          {done.queued > 0 ? pn.withdrawQueued : pn.withdrawConfirmed}
        </p>
        <TxFeedback state={tx.state} />
        <Button
          variant="outline"
          className="self-start"
          onClick={() => {
            setDone(null)
            tx.reset()
          }}
        >
          {pn.another}
        </Button>
      </div>
    )
  }

  if (holding <= 0) {
    return <p className="rounded-2xl border border-dashed p-4 text-sm text-muted-foreground">{t(pn.noPosition, { token: symbol })}</p>
  }

  const freeNow = pool.queue.length ? 0 : available(pool)

  return (
    <form
      noValidate
      onSubmit={(ev) => {
        ev.preventDefault()
        withdraw()
      }}
      className="flex flex-col gap-4"
    >
      <AmountField
        id={`${id}-withdraw`}
        symbol={symbol}
        field={field}
        balanceLine={t(pn.suppliedBalance, { amount: formatToken(holding, symbol, locale) })}
        onMax={() => field.setMax(formatAmount(holding, symbol, locale).replace(/[\s  ]/g, "").replace(/,(?=\d{3})/g, ""))}
        disabled={tx.busy}
      />

      {amount > 0 && plan.queued > 0 ? (
        <div className="flex flex-col gap-3 rounded-2xl border-2 border-dashed border-warning/60 p-4">
          <QueueBar ratio={plan.instant / amount} label={`${pn.leavesNow}: ${formatToken(plan.instant, symbol, locale)}. ${pn.joinsQueue}: ${formatToken(plan.queued, symbol, locale)}`} />
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <dt className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                <span className="size-2.5 rounded-full bg-primary" aria-hidden="true" />
                {pn.leavesNow}
              </dt>
              <dd className="font-mono font-bold tabular-nums">{formatToken(plan.instant, symbol, locale)}</dd>
            </div>
            <div>
              <dt className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                <span className="size-2.5 rounded-full border border-muted-foreground" aria-hidden="true" />
                {pn.joinsQueue}
              </dt>
              <dd className="font-mono font-bold tabular-nums">{formatToken(plan.queued, symbol, locale)}</dd>
            </div>
          </dl>
          <p className="text-sm text-muted-foreground">
            {t(pn.queueExplain, { available: formatToken(freeNow, symbol, locale) })} {ahead > 0 ? t(pn.queueAhead, { amount: formatToken(ahead, symbol, locale) }) : null}
          </p>
        </div>
      ) : null}

      <div>
        <p className="eyebrow text-muted-foreground">{pn.preview}</p>
        <div className="mt-2">
          <PreviewList
            rows={[
              { label: pn.leavesNow, value: amount ? formatToken(plan.instant, symbol, locale) : "—" },
              { label: pn.newUtil, value: `${formatPercent(u, locale)} → ${formatPercent(newU, locale)}` },
              { label: pn.newApy, value: formatPercent(supplyRate(newU, pool.model), locale), strong: true },
            ]}
          />
        </div>
      </div>

      <Button type="submit" size="lg" disabled={tx.busy} className="w-full">
        {amount ? t(pn.withdrawAmountButton, { amount: formatToken(amount, symbol, locale) }) : pn.withdrawButton}
      </Button>
      <TxFeedback state={tx.state} onRetry={withdraw} onDismiss={tx.reset} />
      <Disclaimer text={disclaimer} />
    </form>
  )
}
