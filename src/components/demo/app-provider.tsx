"use client"

import { createContext, useContext, useEffect, useMemo, type ReactNode } from "react"

import { MonarkMark } from "@/components/ui/site-brand"
import { Toaster } from "@/components/ui/sonner"
import { WalletPrompt } from "@/components/ui/wallet-prompt"
import type { Dictionary } from "@/i18n"
import type { Locale } from "@/i18n/config"
import { estimateFee } from "@/lib/demo/chain"
import { initDemo, useDemo, usePrompt } from "@/lib/demo/store"
import { NETWORK_NAME } from "@/lib/demo/tokens"
import type { TxState } from "@/lib/demo/types"

export interface AppCopy {
  locale: Locale
  app: Dictionary["app"]
  states: Dictionary["common"]["states"]
  stateHints: Dictionary["common"]["stateHints"]
  curve: Dictionary["common"]["curve"]
  howHref: string
  disclaimer: string
}

const AppContext = createContext<AppCopy | null>(null)

export function useAppCopy(): AppCopy {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error("useAppCopy must be used inside <AppProvider>")
  return ctx
}

/** Props for the registry TxFeedback: one transaction's state plus its translated labels. */
export function txFeedbackProps(tx: Dictionary["app"]["tx"], state: TxState) {
  return {
    phase: state.phase,
    hash: state.hash,
    error: state.error,
    signingLabel: tx.signing,
    pendingLabel: tx.pending,
    pendingStatusLabel: tx.pending,
    confirmedLabel: tx.confirmed,
    failedLabel: tx.failed,
    reasons: { rejected: tx.rejected, reverted: tx.reverted },
    retryLabel: tx.retry,
    dismissLabel: tx.dismiss,
  }
}

export function AppProvider({ value, children }: { value: AppCopy; children: ReactNode }) {
  useEffect(() => {
    initDemo()
  }, [])

  return (
    <AppContext.Provider value={value}>
      {children}
      <DemoWalletPrompt copy={value} />
      <Toaster
        // Top-right, just under the sticky 64px header and the app bar: page
        // titles are left-aligned, so that corner is free, while the supply /
        // withdraw panel and the curve it animates sit lower down. On phones
        // sonner goes full width, just below the header.
        position="top-right"
        offset={{ top: 128, right: 24 }}
        mobileOffset={{ top: 72, left: 16, right: 16 }}
      />
    </AppContext.Provider>
  )
}

/** The simulated wallet's confirmation sheet, driven by the demo store. Closing it counts as a rejection. */
function DemoWalletPrompt({ copy }: { copy: AppCopy }) {
  const prompt = usePrompt()
  const demo = useDemo()
  const p = copy.app.prompt
  // A fresh fee estimate per request.
  const fee = useMemo(() => (prompt ? estimateFee() : ""), [prompt])
  const feeText = fee ? `${Number(fee).toLocaleString(copy.locale === "fr" ? "fr-CA" : "en-CA", { maximumFractionDigits: 5 })} tETH` : ""
  const movesValue = prompt?.summary.movesValue ?? false

  return (
    <WalletPrompt
      open={!!prompt}
      site={
        <>
          <MonarkMark />
          {p.site}
        </>
      }
      title={prompt?.summary.title ?? p.title}
      description={p.title}
      account={demo ? { name: demo.wallet.name, address: demo.wallet.address } : undefined}
      rows={prompt?.summary.rows}
      network={NETWORK_NAME}
      networkLabel={p.network}
      fee={prompt?.summary.noFee ? undefined : feeText}
      feeLabel={p.fee}
      disclaimer={movesValue ? copy.disclaimer : p.simulated}
      warning={movesValue}
      onConfirm={() => prompt?.resolve(true)}
      onReject={() => prompt?.resolve(false)}
      confirmLabel={p.confirm}
      rejectLabel={p.reject}
      closeLabel={copy.app.close}
    />
  )
}
