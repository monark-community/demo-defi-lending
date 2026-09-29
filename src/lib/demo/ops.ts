import { randomHash, randomId } from "./ids"
import { accrue, available, borrowRate, poolUtilization, supplyRate } from "./rates"
import { DAY_MS, rng } from "./seed"
import { TOKEN_LIST, usdValue } from "./tokens"
import type { Activity, DemoState, Pool, PoolPoint, TokenSymbol } from "./types"

/**
 * Pure state transitions. They mirror what the lending contract does on a
 * confirmed transaction; the store calls them, the UI never mutates state.
 * Every transition first accrues interest up to "now" on the demo clock.
 */

export interface Meta {
  at: string
  hash: string
}

export function simNow(s: Pick<DemoState, "clock">, realNow = Date.now()): number {
  return Date.parse(s.clock.base) + Math.max(realNow - s.clock.anchor, 0)
}

export function accrueAll(s: DemoState, toMs: number): DemoState {
  const pools = { ...s.pools }
  for (const k of TOKEN_LIST) pools[k] = accrue(pools[k], toMs)
  return { ...s, pools }
}

const log = (s: DemoState, a: Omit<Activity, "id">): DemoState => ({ ...s, activity: [{ id: randomId("act"), ...a }, ...s.activity] })

function withShares(s: DemoState, symbol: TokenSymbol, delta: number, at: string): DemoState {
  const existing = s.positions.find((p) => p.symbol === symbol)
  let positions = s.positions
  if (existing) {
    const shares = existing.shares + delta
    positions = shares > 1e-9 ? s.positions.map((p) => (p.symbol === symbol ? { ...p, shares } : p)) : s.positions.filter((p) => p.symbol !== symbol)
  } else if (delta > 0) {
    positions = [...s.positions, { symbol, shares: delta, since: at }]
  }
  return { ...s, positions }
}

const setBalance = (s: DemoState, symbol: TokenSymbol, delta: number): DemoState => ({
  ...s,
  wallet: { ...s.wallet, balances: { ...s.wallet.balances, [symbol]: Math.max(s.wallet.balances[symbol] + delta, 0) } },
})

/**
 * New liquidity pays the withdrawal queue first, oldest request first. Your
 * own requests are paid into your wallet and logged.
 */
function fillQueue(s: DemoState, symbol: TokenSymbol, at: string, paid: { symbol: TokenSymbol; amount: number }[]): DemoState {
  let pool = s.pools[symbol]
  let next = s
  const queue = [...pool.queue]
  while (queue.length) {
    const entry = queue[0]!
    const free = available(pool)
    if (free <= 1e-9) break
    const owed = entry.shares * pool.index
    const pay = Math.min(owed, free)
    const shares = pay / pool.index
    pool = { ...pool, supplied: pool.supplied - pay }
    if (pay >= owed - 1e-9) queue.shift()
    else queue[0] = { ...entry, shares: entry.shares - shares }
    if (entry.owner === "you") {
      next = setBalance(next, symbol, pay)
      next = log(next, { kind: "queue_paid", symbol, amount: pay, sharesDelta: -shares, at, hash: randomHash() })
      paid.push({ symbol, amount: pay })
    }
  }
  pool = { ...pool, queue }
  return { ...next, pools: { ...next.pools, [symbol]: pool } }
}

export function approve(s: DemoState, symbol: TokenSymbol, meta: Meta, now: number): DemoState {
  const next = accrueAll(s, now)
  return log(
    { ...next, wallet: { ...next.wallet, allowances: { ...next.wallet.allowances, [symbol]: true } } },
    { kind: "approve", symbol, amount: 0, sharesDelta: 0, ...meta }
  )
}

export function supply(s: DemoState, symbol: TokenSymbol, amount: number, meta: Meta, now: number) {
  let next = accrueAll(s, now)
  const pool = next.pools[symbol]
  const shares = amount / pool.index
  next = setBalance(next, symbol, -amount)
  next = { ...next, pools: { ...next.pools, [symbol]: { ...pool, supplied: pool.supplied + amount } } }
  next = withShares(next, symbol, shares, meta.at)
  next = log(next, { kind: "supply", symbol, amount, sharesDelta: shares, ...meta })
  const paid: { symbol: TokenSymbol; amount: number }[] = []
  next = fillQueue(next, symbol, meta.at, paid)
  return { state: next, shares }
}

/** Split a withdrawal into what can leave now and what must wait in the queue. */
export function planWithdrawal(pool: Pool, amount: number) {
  const free = pool.queue.length ? 0 : available(pool)
  const instant = Math.min(amount, free)
  return { instant, queued: Math.max(amount - instant, 0) }
}

export function withdraw(s: DemoState, symbol: TokenSymbol, amount: number, meta: Meta, now: number) {
  let next = accrueAll(s, now)
  let pool = next.pools[symbol]
  const { instant, queued } = planWithdrawal(pool, amount)
  if (instant > 0) {
    const shares = instant / pool.index
    pool = { ...pool, supplied: pool.supplied - instant }
    next = { ...next, pools: { ...next.pools, [symbol]: pool } }
    next = setBalance(next, symbol, instant)
    next = withShares(next, symbol, -shares, meta.at)
    next = log(next, { kind: "withdraw", symbol, amount: instant, sharesDelta: -shares, ...meta })
  }
  if (queued > 0) {
    const shares = queued / pool.index
    // Queued shares leave your position but stay yours (and keep earning) until paid.
    next = withShares(next, symbol, -shares, meta.at)
    const entry = { id: randomId("q"), owner: "you", address: next.wallet.address, shares, requestedAt: meta.at }
    pool = { ...pool, queue: [...pool.queue, entry] }
    next = { ...next, pools: { ...next.pools, [symbol]: pool } }
    next = log(next, { kind: "queued", symbol, amount: queued, sharesDelta: 0, ...meta })
  }
  return { state: next, instant, queued }
}

export function cancelQueued(s: DemoState, symbol: TokenSymbol, entryId: string, meta: Meta, now: number) {
  let next = accrueAll(s, now)
  const pool = next.pools[symbol]
  const entry = pool.queue.find((q) => q.id === entryId)
  if (!entry) return { state: next, amount: 0 }
  const amount = entry.shares * pool.index
  next = { ...next, pools: { ...next.pools, [symbol]: { ...pool, queue: pool.queue.filter((q) => q.id !== entryId) } } }
  next = withShares(next, symbol, entry.shares, meta.at)
  next = log(next, { kind: "queue_cancelled", symbol, amount, sharesDelta: 0, ...meta })
  return { state: next, amount }
}

export const FAUCET: Record<TokenSymbol, number> = { tUSDC: 5_000, tDAI: 5_000, tETH: 2, tWBTC: 0.1, tLINK: 300 }

export function faucet(s: DemoState, meta: Meta, now: number): DemoState {
  let next = accrueAll(s, now)
  for (const k of TOKEN_LIST) next = setBalance(next, k, FAUCET[k])
  return log(next, { kind: "faucet", symbol: "tUSDC", amount: 0, sharesDelta: 0, ...meta })
}

function snapshot(pool: Pool, at: string): PoolPoint {
  const u = poolUtilization(pool)
  return { t: at, utilization: u, supplyApy: supplyRate(u, pool.model), borrowApr: borrowRate(u, pool.model), index: pool.index }
}

export interface SkipReport {
  days: number
  earnedUsd: number
  paid: { symbol: TokenSymbol; amount: number }[]
}

/**
 * Skip ahead `days` on the demo clock. Each simulated day: interest accrues,
 * borrowers drift towards the pool's usual utilization (repaying when it's
 * high, borrowing when it's low; new borrows pause while a queue waits), a few
 * other lenders deposit, repaid liquidity pays the queue, and a history point
 * is recorded.
 */
export function skipDays(s: DemoState, days: number, realNow = Date.now()) {
  const start = simNow(s, realNow)
  const before = earnings(s, start).earnedUsd
  let next = accrueAll(s, start)
  const paid: SkipReport["paid"] = []
  for (let d = 1; d <= days; d++) {
    const t = start + d * DAY_MS
    const at = new Date(t).toISOString()
    next = accrueAll(next, t)
    for (const k of TOKEN_LIST) {
      const rand = rng(`${at}:${k}`)
      let pool = next.pools[k]
      const desired = pool.targetUtilization * pool.supplied
      let delta = (desired - pool.borrowed) * 0.32 + (rand() - 0.5) * 0.012 * pool.supplied
      if (pool.queue.length) delta = Math.min(delta, 0)
      delta = Math.min(delta, available(pool) * 0.9)
      const deposits = pool.supplied * rand() * 0.004
      pool = { ...pool, borrowed: Math.max(pool.borrowed + delta, 0), supplied: pool.supplied + deposits }
      next = { ...next, pools: { ...next.pools, [k]: pool } }
      next = fillQueue(next, k, at, paid)
      pool = next.pools[k]
      next = { ...next, pools: { ...next.pools, [k]: { ...pool, history: [...pool.history, snapshot(pool, at)].slice(-400) } } }
    }
  }
  const end = start + days * DAY_MS
  next = { ...next, clock: { base: new Date(end).toISOString(), anchor: realNow } }
  const after = earnings(next, end).earnedUsd
  return { state: next, report: { days, earnedUsd: after - before, paid } satisfies SkipReport }
}

/* ---------------------------------------------------------------------------
 * Selectors
 * ------------------------------------------------------------------------ */

export function yourQueued(pool: Pool) {
  return pool.queue.filter((q) => q.owner === "you")
}

/** Current value of what you own in a pool (position + your queued shares). */
export function holdingIn(s: DemoState, symbol: TokenSymbol, now: number) {
  const pool = accrue(s.pools[symbol], now)
  const pos = s.positions.find((p) => p.symbol === symbol)
  const queuedShares = yourQueued(pool).reduce((a, q) => a + q.shares, 0)
  return {
    pool,
    shares: pos?.shares ?? 0,
    value: (pos?.shares ?? 0) * pool.index,
    queuedShares,
    queuedValue: queuedShares * pool.index,
  }
}

/** Net tokens you put into a pool: supplies minus everything paid back out. */
export function netContributed(s: DemoState, symbol: TokenSymbol, until = Infinity) {
  let sum = 0
  for (const a of s.activity) {
    if (a.symbol !== symbol || Date.parse(a.at) > until) continue
    if (a.kind === "supply") sum += a.amount
    if (a.kind === "withdraw" || a.kind === "queue_paid") sum -= a.amount
  }
  return sum
}

export function earnings(s: DemoState, now: number) {
  let valueUsd = 0
  let earnedUsd = 0
  let queuedUsd = 0
  let weighted = 0
  const perPool = TOKEN_LIST.map((symbol) => {
    const h = holdingIn(s, symbol, now)
    const value = h.value + h.queuedValue
    const earned = value - netContributed(s, symbol)
    const apy = supplyRate(poolUtilization(h.pool), h.pool.model)
    valueUsd += usdValue(value, symbol)
    earnedUsd += usdValue(earned, symbol)
    queuedUsd += usdValue(h.queuedValue, symbol)
    weighted += usdValue(value, symbol) * apy
    return { symbol, ...h, earned, apy }
  })
  return { valueUsd, earnedUsd, queuedUsd, blendedApy: valueUsd > 0 ? weighted / valueUsd : 0, perPool }
}

/**
 * Daily series of total value and cumulative earnings (USD), rebuilt from the
 * pools' history and your activity, so it stays consistent after time skips.
 */
export function earningsSeries(s: DemoState) {
  const ref = s.pools.tUSDC.history
  const firstActivity = Math.min(...s.activity.map((a) => Date.parse(a.at)))
  return ref
    .filter((pt) => Date.parse(pt.t) >= firstActivity - DAY_MS)
    .map((pt) => {
      const t = Date.parse(pt.t)
      let value = 0
      let contributed = 0
      for (const symbol of TOKEN_LIST) {
        const hist = s.pools[symbol].history
        let index = hist[0]!.index
        for (const h of hist) if (Date.parse(h.t) <= t + 1000) index = h.index
        let shares = 0
        for (const a of s.activity) if (a.symbol === symbol && Date.parse(a.at) <= t) shares += a.sharesDelta
        value += usdValue(Math.max(shares, 0) * index, symbol)
        contributed += usdValue(netContributed(s, symbol, t), symbol)
      }
      return { t: pt.t, value, earned: Math.max(value - contributed, 0) }
    })
}
