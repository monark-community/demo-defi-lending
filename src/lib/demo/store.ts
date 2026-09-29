"use client"

import { useSyncExternalStore } from "react"

import * as ops from "./ops"
import { createSeed } from "./seed"
import type { DemoSettings, DemoState, TokenSymbol, TxSummary, WalletState } from "./types"

/**
 * The demo's single source of truth: a tiny external store persisted to
 * localStorage (every access in try/catch). Swapping to a real chain means
 * replacing this module and chain.ts; the UI only uses the hooks and actions.
 */

const STORAGE_KEY = "yieldmine-demo-v1"

let state: DemoState | null = null
let storageOk = true
const listeners = new Set<() => void>()

function emit() {
  for (const l of listeners) l()
}

function persist() {
  if (!state) return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    storageOk = true
  } catch {
    storageOk = false
  }
}

function load(): DemoState | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as DemoState
    if (parsed?.version !== 1 || !parsed.pools?.tUSDC || !Array.isArray(parsed.positions)) return null
    // A reload never resumes a half-finished connection.
    if (parsed.wallet.status === "connecting") parsed.wallet.status = "disconnected"
    return parsed
  } catch {
    storageOk = false
    return null
  }
}

function fresh(): DemoState {
  const seed = createSeed()
  return { ...seed, clock: { base: seed.clock.base, anchor: Date.now() } }
}

/** Load saved state, or seed the example story. Idempotent. */
export function initDemo() {
  if (state) return
  state = load() ?? fresh()
  persist()
  emit()
}

export function resetDemo() {
  const connected = state?.wallet.status === "connected"
  state = fresh()
  if (connected) state.wallet.status = "connected"
  persist()
  emit()
}

export function update(fn: (s: DemoState) => DemoState) {
  if (!state) return
  state = fn(state)
  persist()
  emit()
}

export function setWallet(patch: Partial<WalletState>) {
  update((s) => ({ ...s, wallet: { ...s.wallet, ...patch } }))
}

export function setSettings(patch: Partial<DemoSettings>) {
  update((s) => ({ ...s, settings: { ...s.settings, ...patch } }))
}

export function getDemo() {
  return state
}

/** Current time on the demo clock (ms). */
export function demoNow(): number {
  return state ? ops.simNow(state) : Date.now()
}

const meta = (hash: string) => ({ at: new Date(demoNow()).toISOString(), hash })

/* Actions: each applies a confirmed transaction to the state. */

export const actions = {
  approve(symbol: TokenSymbol, hash: string) {
    update((s) => ops.approve(s, symbol, meta(hash), demoNow()))
  },
  supply(symbol: TokenSymbol, amount: number, hash: string) {
    update((s) => ops.supply(s, symbol, amount, meta(hash), demoNow()).state)
  },
  withdraw(symbol: TokenSymbol, amount: number, hash: string, all = false) {
    let result = { instant: 0, queued: 0 }
    update((s) => {
      const r = ops.withdraw(s, symbol, amount, meta(hash), demoNow(), all)
      result = { instant: r.instant, queued: r.queued }
      return r.state
    })
    return result
  },
  cancelQueued(symbol: TokenSymbol, entryId: string, hash: string) {
    update((s) => ops.cancelQueued(s, symbol, entryId, meta(hash), demoNow()).state)
  },
  faucet(hash: string) {
    update((s) => ops.faucet(s, meta(hash), demoNow()))
  },
  skip(days: number): ops.SkipReport | null {
    let report: ops.SkipReport | null = null
    update((s) => {
      const r = ops.skipDays(s, days)
      report = r.report
      return r.state
    })
    return report
  },
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

/** Current demo state, or null until it has loaded on the client. */
export function useDemo(): DemoState | null {
  return useSyncExternalStore(subscribe, () => state, () => null)
}

export function useStorageOk(): boolean {
  return useSyncExternalStore(subscribe, () => storageOk, () => true)
}

/* ---------------------------------------------------------------------------
 * A one-second ticker so balances visibly grow. Stops when nobody listens.
 * ------------------------------------------------------------------------ */

let tick = 0
let timer: ReturnType<typeof setInterval> | null = null
const tickListeners = new Set<() => void>()

function subscribeTick(l: () => void) {
  tickListeners.add(l)
  if (!timer) {
    tick = Date.now()
    timer = setInterval(() => {
      tick = Date.now()
      for (const x of tickListeners) x()
    }, 1000)
  }
  return () => {
    tickListeners.delete(l)
    if (!tickListeners.size && timer) {
      clearInterval(timer)
      timer = null
    }
  }
}

/** Demo-clock time, refreshed every second (and whenever the state changes). */
export function useNow(): number {
  const real = useSyncExternalStore(subscribeTick, () => tick || Date.now(), () => 0)
  const demo = useDemo()
  return demo && real ? ops.simNow(demo, real) : 0
}

/* ---------------------------------------------------------------------------
 * Simulated wallet prompt: a promise resolved by the WalletPrompt dialog.
 * ------------------------------------------------------------------------ */

export interface PromptRequest {
  summary: TxSummary
  resolve: (approved: boolean) => void
}

let prompt: PromptRequest | null = null
const promptListeners = new Set<() => void>()

export function requestSignature(summary: TxSummary): Promise<boolean> {
  return new Promise((resolve) => {
    prompt?.resolve(false)
    prompt = {
      summary,
      resolve: (ok) => {
        prompt = null
        for (const l of promptListeners) l()
        resolve(ok)
      },
    }
    for (const l of promptListeners) l()
  })
}

export function usePrompt(): PromptRequest | null {
  return useSyncExternalStore(
    (l) => {
      promptListeners.add(l)
      return () => promptListeners.delete(l)
    },
    () => prompt,
    () => null
  )
}
