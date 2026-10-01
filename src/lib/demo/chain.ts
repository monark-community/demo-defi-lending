"use client"

import { useCallback, useRef, useState } from "react"

import { randomHash } from "./ids"
import { getDemo, requestSignature, setSettings } from "./store"
import type { TxError, TxState, TxSummary } from "./types"

/**
 * Simulated chain. A transaction is: wallet prompt (sign or reject) ->
 * pending with a hash for a realistic block time -> confirmed or reverted.
 * "Fail the next transaction" in the demo controls forces one revert.
 */

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

export function blockTime(): number {
  const slow = getDemo()?.settings.slow
  const [min, max] = slow ? [3000, 6000] : [1200, 2400]
  return Math.round(min + Math.random() * (max - min))
}

async function mine(): Promise<"confirmed" | "reverted"> {
  await sleep(blockTime())
  const demo = getDemo()
  if (demo?.settings.failNext) {
    setSettings({ failNext: false })
    return "reverted"
  }
  return "confirmed"
}

/** Estimated network fee shown in the wallet prompt (simulated, in tETH). */
export function estimateFee(): string {
  return (0.00031 + Math.random() * 0.00022).toFixed(5)
}

export interface TxResult {
  ok: boolean
  error?: TxError
  hash?: string
}

/**
 * One transaction's lifecycle for a component. `apply` runs only on
 * confirmation and receives the transaction hash.
 */
export function useTx() {
  const [state, setState] = useState<TxState>({ phase: "idle" })
  const busy = useRef(false)

  const run = useCallback(
    async (summary: TxSummary, apply: (hash: string) => void, options: { onPending?: (hash: string) => void } = {}): Promise<TxResult> => {
      if (busy.current) return { ok: false }
      busy.current = true
      try {
        setState({ phase: "signing" })
        const ok = await requestSignature(summary)
        if (!ok) {
          setState({ phase: "failed", error: "rejected" })
          return { ok: false, error: "rejected" }
        }
        const hash = randomHash()
        setState({ phase: "pending", hash })
        options.onPending?.(hash)
        const outcome = await mine()
        if (outcome === "reverted") {
          setState({ phase: "failed", hash, error: "reverted" })
          return { ok: false, error: "reverted", hash }
        }
        apply(hash)
        setState({ phase: "confirmed", hash })
        return { ok: true, hash }
      } finally {
        busy.current = false
      }
    },
    []
  )

  const reset = useCallback(() => setState({ phase: "idle" }), [])

  return { state, run, reset, busy: state.phase === "signing" || state.phase === "pending" }
}
