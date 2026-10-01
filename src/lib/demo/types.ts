/**
 * Domain types for the Yieldmine demo. The UI only knows these shapes and the
 * hooks/actions in this folder, so the simulated chain could be replaced by
 * wagmi/viem calls without touching components.
 *
 * Amounts are plain JavaScript numbers in whole tokens (1.5 = 1.5 tETH).
 * Interest accrues continuously, which bigint base units would make needlessly
 * heavy for a demo; display rounding hides float dust. Rates are fractions
 * (0.0432 = 4.32%).
 */

export type TokenSymbol = "tUSDC" | "tDAI" | "tETH" | "tWBTC" | "tLINK"

export interface Token {
  symbol: TokenSymbol
  /** Human name of the testnet asset. */
  name: string
  /** Reference price in USD shared by the Monark DeFi demos. */
  usd: number
  /** Fraction digits shown for amounts of this token. */
  digits: number
}

/** Utilization-based ("kinked") interest-rate model, as a governance vote would set it. */
export interface RateModel {
  /** Borrow rate at 0% utilization. */
  base: number
  /** Added borrow rate between 0% and the optimal utilization. */
  slope1: number
  /** Added borrow rate between the optimal utilization and 100%. */
  slope2: number
  /** Optimal utilization (the "kink"), 0..1. */
  kink: number
  /** Share of borrowers' interest kept by the protocol as a reserve. */
  reserveFactor: number
}

/** One daily snapshot of a pool, used for history charts and earnings. */
export interface PoolPoint {
  /** Simulated time of the snapshot (ISO). */
  t: string
  utilization: number
  supplyApy: number
  borrowApr: number
  /** Share-token exchange rate: underlying tokens per share. */
  index: number
}

export interface QueueEntry {
  id: string
  /** "you" for the demo wallet, otherwise another lender's label. */
  owner: "you" | string
  address: string
  /** Pool shares waiting to be redeemed (they keep earning until paid). */
  shares: number
  requestedAt: string
}

export interface Pool {
  symbol: TokenSymbol
  /** Underlying owed to lenders (grows with interest). */
  supplied: number
  /** Underlying currently lent out (grows with borrowers' interest). */
  borrowed: number
  /** Protocol reserve accumulated from the reserve factor. */
  reserves: number
  /** Share-token exchange rate. Only ever goes up. */
  index: number
  model: RateModel
  /** Utilization borrowers drift towards when time is skipped. */
  targetUtilization: number
  lenders: number
  /** Simulated time interest was last accrued to (ISO). */
  lastAccrued: string
  history: PoolPoint[]
  queue: QueueEntry[]
}

export interface Position {
  symbol: TokenSymbol
  shares: number
  since: string
}

export type ActivityKind = "supply" | "withdraw" | "queued" | "queue_paid" | "queue_cancelled" | "approve" | "faucet"

export interface Activity {
  id: string
  kind: ActivityKind
  symbol: TokenSymbol
  /** Underlying tokens moved (0 for approvals). */
  amount: number
  /** Change in the shares you own (supply +, withdraw/paid −). */
  sharesDelta: number
  at: string
  hash: string
}

export type WalletStatus = "disconnected" | "connecting" | "connected"

export interface WalletState {
  status: WalletStatus
  address: string
  name: string
  lastError: "rejected" | null
  balances: Record<TokenSymbol, number>
  /** Whether Yieldmine may move this token for you (ERC-20 approval). */
  allowances: Record<TokenSymbol, boolean>
}

export interface DemoSettings {
  slow: boolean
  failNext: boolean
}

/**
 * Simulated clock: at real time `anchor` (ms) it was `base` (ISO) in the demo.
 * It runs at real speed; "skip ahead" moves `base` forward.
 */
export interface DemoClock {
  base: string
  anchor: number
}

export interface DemoState {
  version: 1
  wallet: WalletState
  pools: Record<TokenSymbol, Pool>
  positions: Position[]
  activity: Activity[]
  clock: DemoClock
  settings: DemoSettings
}

/** Lifecycle of one simulated transaction, as the UI sees it. */
export type TxPhase = "idle" | "signing" | "pending" | "confirmed" | "failed"
export type TxError = "rejected" | "reverted"

export interface TxState {
  phase: TxPhase
  hash?: string
  error?: TxError
}

export interface TxSummary {
  /** Short title, e.g. "Supply 1,500 tDAI". */
  title: string
  rows?: { label: string; value: string }[]
  /** Transactions that move value show the testnet disclaimer. */
  movesValue: boolean
  /** Off-chain signature (sign-in): no network fee row. */
  noFee?: boolean
}

export type UtilizationState = "comfortable" | "busy" | "tight"
