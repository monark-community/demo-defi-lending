import { earnings, netContributed } from "./ops"
import { poolUtilization, supplyRate } from "./rates"
import { createSeed, SEED_NOW } from "./seed"

/**
 * Facts from the seeded story for the marketing pages (server-side, static):
 * the tUSDC pool and the example position, so the copy and diagrams show the
 * same numbers the demo starts with.
 */
export function seedFacts() {
  const s = createSeed()
  const now = Date.parse(SEED_NOW)
  const pool = s.pools.tUSDC
  const e = earnings(s, now).perPool.find((p) => p.symbol === "tUSDC")!
  const first = s.activity.filter((a) => a.symbol === "tUSDC" && a.kind === "supply").at(-1)!
  const firstIndex = first.amount / first.sharesDelta
  return {
    model: pool.model,
    utilization: poolUtilization(pool),
    apy: supplyRate(poolUtilization(pool), pool.model),
    value: e.value,
    contributed: netContributed(s, "tUSDC"),
    shares: e.shares,
    index: pool.index,
    indexHistory: pool.history.map((p) => ({ t: p.t, index: p.index })),
    firstSupply: { at: first.at, amount: first.amount, index: firstIndex, shares: first.sharesDelta },
    now: SEED_NOW,
  }
}
