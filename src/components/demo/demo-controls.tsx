"use client"

import { CalendarClockIcon, DropletIcon, FastForwardIcon, RotateCcwIcon, SlidersHorizontalIcon } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { t } from "@/i18n/t"
import { useTx } from "@/lib/demo/chain"
import { randomHash } from "@/lib/demo/ids"
import { actions, resetDemo, setSettings, useDemo, useNow } from "@/lib/demo/store"
import { formatDate, formatToken, formatUsd } from "@/lib/format"

import { useAppCopy } from "./app-provider"

export function daysLabel(n: number, days: { one: string; many: string }) {
  return n === 1 ? days.one : t(days.many, { n })
}

/** Skip ahead on the demo clock and report what happened in a toast. */
export function skipAhead(days: number, copy: ReturnType<typeof useAppCopy>) {
  const report = actions.skip(days)
  if (!report) return
  const { app, locale } = copy
  toast.success(t(app.toasts.skipped, { days: daysLabel(days, app.days) }), {
    description: t(app.toasts.earned, { amount: formatUsd(report.earnedUsd, locale) }),
  })
  for (const p of report.paid) {
    toast.success(t(app.toasts.queuePaid, { amount: formatToken(p.amount, p.symbol, locale) }))
  }
}

/** The demo date, shown in the app bar so time travel is visible. */
export function DemoDate() {
  const now = useNow()
  const { app, locale } = useAppCopy()
  if (!now) return null
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
      <CalendarClockIcon className="size-3.5" aria-hidden="true" />
      <span className="sr-only">{app.controls.clock}: </span>
      {formatDate(now, locale)}
    </span>
  )
}

/** Visible demo controls: time travel, test tokens, network speed, forced failure, and "Reset demo". */
export function DemoControls() {
  const demo = useDemo()
  const copy = useAppCopy()
  const { app } = copy
  const c = app.controls
  const [open, setOpen] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const faucetTx = useTx()
  if (!demo) return null

  const skip = (days: number) => {
    skipAhead(days, copy)
    setOpen(false)
  }

  // The wallet prompt is its own dialog, so close this one first (two stacked
  // Radix modals can leave the page unclickable).
  const getTokens = async () => {
    setOpen(false)
    const id = toast.loading(app.tx.signing)
    const res = await faucetTx.run({ title: app.summaries.faucet, movesValue: true }, (hash) => actions.faucet(hash || randomHash()), {
      onPending: () => toast.loading(app.tx.pending, { id }),
    })
    if (res.ok) toast.success(app.toasts.faucet, { id })
    else if (res.error) toast.error(app.tx.failed, { id, description: res.error === "rejected" ? app.tx.rejected : app.tx.reverted })
    else toast.dismiss(id)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o)
        if (!o) setConfirming(false)
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <SlidersHorizontalIcon aria-hidden="true" />
          {c.open}
          {demo.settings.failNext || demo.settings.slow ? <span className="size-2 rounded-full bg-warning" aria-hidden="true" /> : null}
        </Button>
      </DialogTrigger>
      <DialogContent closeLabel={app.close} className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-extrabold">{c.title}</DialogTitle>
          <DialogDescription className="sr-only">{c.timeHint}</DialogDescription>
        </DialogHeader>

        <section aria-labelledby="ctl-time" className="rounded-2xl border p-4">
          <h3 id="ctl-time" className="flex items-center gap-2 text-sm font-bold">
            <FastForwardIcon className="size-4 text-primary" aria-hidden="true" />
            {c.time}
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">{c.timeHint}</p>
          <div className="mt-3 grid grid-cols-3 gap-2">
            <Button variant="outline" size="sm" onClick={() => skip(1)}>
              {c.skip1}
            </Button>
            <Button variant="outline" size="sm" onClick={() => skip(7)}>
              {c.skip7}
            </Button>
            <Button variant="outline" size="sm" onClick={() => skip(30)}>
              {c.skip30}
            </Button>
          </div>
        </section>

        <div className="flex flex-col divide-y rounded-2xl border">
          <div className="flex items-start justify-between gap-4 p-4">
            <div className="contents">
              <div>
                <p className="text-sm font-bold">{c.faucet}</p>
                <p className="mt-1 text-xs text-muted-foreground">{c.faucetHint}</p>
              </div>
              <Button variant="outline" size="sm" className="shrink-0" onClick={() => void getTokens()} disabled={faucetTx.busy}>
                <DropletIcon aria-hidden="true" />
                {c.faucet}
              </Button>
            </div>
          </div>
          <div className="flex items-start justify-between gap-4 p-4">
            <div>
              <Label htmlFor="ctl-slow" className="text-sm font-bold">
                {c.slow}
              </Label>
              <p className="mt-1 text-xs text-muted-foreground">{c.slowHint}</p>
            </div>
            <Switch id="ctl-slow" checked={demo.settings.slow} onCheckedChange={(v) => setSettings({ slow: v })} />
          </div>
          <div className="flex items-start justify-between gap-4 p-4">
            <div>
              <Label htmlFor="ctl-fail" className="text-sm font-bold">
                {c.failNext}
              </Label>
              <p className="mt-1 text-xs text-muted-foreground">{c.failNextHint}</p>
            </div>
            <Switch id="ctl-fail" checked={demo.settings.failNext} onCheckedChange={(v) => setSettings({ failNext: v })} />
          </div>
        </div>

        <div className="rounded-2xl border p-4">
          {!confirming ? (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-muted-foreground">{c.resetHint}</p>
              <Button variant="destructive" size="sm" onClick={() => setConfirming(true)} className="shrink-0">
                <RotateCcwIcon aria-hidden="true" />
                {c.reset}
              </Button>
            </div>
          ) : (
            <div role="alertdialog" aria-labelledby="reset-q" className="flex flex-col gap-3">
              <p id="reset-q" className="font-bold">
                {c.resetConfirm}
              </p>
              <p className="text-xs text-muted-foreground">{c.resetConfirmBody}</p>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="destructive"
                  size="sm"
                  autoFocus
                  onClick={() => {
                    resetDemo()
                    setConfirming(false)
                    setOpen(false)
                    toast.success(c.resetDone)
                  }}
                >
                  {c.resetDo}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setConfirming(false)}>
                  {c.cancel}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
