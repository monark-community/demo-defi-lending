import type { Pool, RateModel, UtilizationState } from "./types"

/**
 * The utilization-based interest model every pool uses. Borrow rates climb
 * gently up to the optimal utilization (the "kink"), then steeply, which pulls
 * lenders in and borrowers out when liquidity gets scarce. Lenders earn the
 * borrowers' interest, spread over everything supplied, minus the reserve.
 */

export function borrowRate(u: number, m: RateModel): number {
  const x = Math.min(Math.max(u, 0), 1)
  if (x <= m.kink) return m.base + (m.slope1 * x) / m.kink
  return m.base + m.slope1 + (m.slope2 * (x - m.kink)) / (1 - m.kink)
}

export function supplyRate(u: number, m: RateModel): number {
  const x = Math.min(Math.max(u, 0), 1)
  return borrowRate(x, m) * x * (1 - m.reserveFactor)
}

export function utilization(borrowed: number, supplied: number): number {
  return supplied > 0 ? Math.min(borrowed / supplied, 1) : 0
}

export const poolUtilization = (p: Pick<Pool, "borrowed" | "supplied">) => utilization(p.borrowed, p.supplied)

/** Tokens that can leave the pool right now. */
export const available = (p: Pick<Pool, "borrowed" | "supplied">) => Math.max(p.supplied - p.borrowed, 0)

export function utilizationState(u: number, m: RateModel): UtilizationState {
  if (u > m.kink) return "tight"
  if (u > m.kink - 0.15) return "busy"
  return "comfortable"
}

const YEAR_MS = 365 * 24 * 3600 * 1000

/**
 * Accrue interest from `pool.lastAccrued` to `toMs` at the current rates.
 * Pure: returns a new pool. Rates only change when balances do, so this is
 * exact between two events.
 */
export function accrue(pool: Pool, toMs: number): Pool {
  const from = Date.parse(pool.lastAccrued)
  const dt = (toMs - from) / YEAR_MS
  if (!(dt > 0)) return pool
  const u = poolUtilization(pool)
  const b = borrowRate(u, pool.model)
  const s = supplyRate(u, pool.model)
  const interest = pool.borrowed * b * dt
  return {
    ...pool,
    borrowed: pool.borrowed + interest,
    supplied: pool.supplied * (1 + s * dt),
    reserves: pool.reserves + interest * pool.model.reserveFactor,
    index: pool.index * (1 + s * dt),
    lastAccrued: new Date(toMs).toISOString(),
  }
}
