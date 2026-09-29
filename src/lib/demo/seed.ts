import { seededAddress, seededHash } from "./ids"
import { borrowRate, supplyRate } from "./rates"
import { TOKEN_LIST } from "./tokens"
import type { Activity, DemoState, Pool, PoolPoint, Position, RateModel, TokenSymbol } from "./types"

/** The moment the seeded story ends and the demo clock starts. */
export const SEED_NOW = "2026-09-29T14:00:00.000Z"
export const DAY_MS = 24 * 3600 * 1000
const HISTORY_DAYS = 90

export const YOU_ADDRESS = seededAddress("camille-roy-wallet")
export const YOU_NAME = "Camille Roy"

/** Small deterministic PRNG so every visitor sees the same seeded history. */
export function rng(seed: string) {
  let h = 2166136261
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619)
  return () => {
    h += 0x6d2b79f5
    let t = h
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

interface PoolSeed {
  symbol: TokenSymbol
  supplied: number
  borrowed: number
  reserves: number
  index: number
  model: RateModel
  target: number
  /** Utilization 90 days ago; the history walks from here to today. */
  startU: number
  lenders: number
}

const POOLS: PoolSeed[] = [
  {
    symbol: "tUSDC",
    supplied: 48_264,
    borrowed: 38_128.6,
    reserves: 482.1,
    index: 1.0412,
    model: { base: 0.005, slope1: 0.06, slope2: 0.75, kink: 0.85, reserveFactor: 0.1 },
    target: 0.8,
    startU: 0.66,
    lenders: 128,
  },
  {
    symbol: "tDAI",
    supplied: 21_149,
    borrowed: 14_804.3,
    reserves: 215.4,
    index: 1.0268,
    model: { base: 0.005, slope1: 0.05, slope2: 0.75, kink: 0.85, reserveFactor: 0.1 },
    target: 0.72,
    startU: 0.61,
    lenders: 74,
  },
  {
    symbol: "tETH",
    supplied: 18.426,
    borrowed: 9.213,
    reserves: 0.1284,
    index: 1.0079,
    model: { base: 0, slope1: 0.035, slope2: 0.8, kink: 0.8, reserveFactor: 0.15 },
    target: 0.52,
    startU: 0.44,
    lenders: 96,
  },
  {
    symbol: "tWBTC",
    supplied: 1.9284,
    borrowed: 0.5786,
    reserves: 0.0082,
    index: 1.0041,
    model: { base: 0, slope1: 0.04, slope2: 1, kink: 0.45, reserveFactor: 0.2 },
    target: 0.32,
    startU: 0.24,
    lenders: 31,
  },
  {
    symbol: "tLINK",
    supplied: 42_380,
    borrowed: 40_640,
    reserves: 1_120,
    index: 1.0935,
    model: { base: 0, slope1: 0.07, slope2: 0.3, kink: 0.8, reserveFactor: 0.2 },
    target: 0.84,
    startU: 0.71,
    lenders: 19,
  },
]

function buildHistory(p: PoolSeed): PoolPoint[] {
  const rand = rng(`history:${p.symbol}`)
  const current = p.borrowed / p.supplied
  const us: number[] = []
  let wobble = 0
  for (let k = HISTORY_DAYS - 1; k >= 0; k--) {
    const progress = 1 - k / (HISTORY_DAYS - 1)
    wobble = wobble * 0.7 + (rand() - 0.5) * 0.035
    const u = k === 0 ? current : p.startU + (current - p.startU) * progress ** 1.4 + wobble
    us.push(Math.min(Math.max(u, 0.05), 0.99))
  }
  // Walk the index backwards from today so the history ends exactly at p.index.
  const points: PoolPoint[] = new Array(HISTORY_DAYS)
  let index = p.index
  for (let i = HISTORY_DAYS - 1; i >= 0; i--) {
    const u = us[i]!
    const supplyApy = supplyRate(u, p.model)
    points[i] = {
      t: new Date(Date.parse(SEED_NOW) - (HISTORY_DAYS - 1 - i) * DAY_MS).toISOString(),
      utilization: u,
      supplyApy,
      borrowApr: borrowRate(u, p.model),
      index,
    }
    index = index / (1 + supplyApy / 365)
  }
  return points
}

/** The seeded pools, keyed by symbol. */
function seedPools(): Record<TokenSymbol, Pool> {
  const out = {} as Record<TokenSymbol, Pool>
  for (const p of POOLS) {
    out[p.symbol] = {
      symbol: p.symbol,
      supplied: p.supplied,
      borrowed: p.borrowed,
      reserves: p.reserves,
      index: p.index,
      model: p.model,
      targetUtilization: p.target,
      lenders: p.lenders,
      lastAccrued: SEED_NOW,
      history: buildHistory(p),
      queue: [],
    }
  }
  return out
}

const indexOn = (pool: Pool, iso: string) => {
  const t = Date.parse(iso)
  let best = pool.history[0]!
  for (const pt of pool.history) if (Date.parse(pt.t) <= t) best = pt
  return best.index
}

/** Your seeded story: a faucet top-up, three pools supplied over the summer, one partial withdrawal. */
export function createSeed(): DemoState {
  const pools = seedPools()
  const events: Omit<Activity, "id" | "hash" | "sharesDelta">[] = [
    { kind: "faucet", symbol: "tUSDC", amount: 13_200, at: "2026-07-08T13:02:00.000Z" },
    { kind: "approve", symbol: "tUSDC", amount: 0, at: "2026-07-08T13:40:00.000Z" },
    { kind: "supply", symbol: "tUSDC", amount: 8_000, at: "2026-07-08T13:41:00.000Z" },
    { kind: "approve", symbol: "tETH", amount: 0, at: "2026-08-04T19:12:00.000Z" },
    { kind: "supply", symbol: "tETH", amount: 1.5, at: "2026-08-04T19:13:00.000Z" },
    { kind: "approve", symbol: "tLINK", amount: 0, at: "2026-09-01T16:25:00.000Z" },
    { kind: "supply", symbol: "tLINK", amount: 2_400, at: "2026-09-01T16:26:00.000Z" },
    { kind: "withdraw", symbol: "tUSDC", amount: 1_000, at: "2026-09-10T10:05:00.000Z" },
  ]

  const activity: Activity[] = []
  const shares: Partial<Record<TokenSymbol, { shares: number; since: string }>> = {}
  events.forEach((e, i) => {
    const pool = pools[e.symbol]
    let sharesDelta = 0
    if (e.kind === "supply") sharesDelta = e.amount / indexOn(pool, e.at)
    if (e.kind === "withdraw") sharesDelta = -e.amount / indexOn(pool, e.at)
    if (sharesDelta !== 0) {
      const cur = shares[e.symbol]
      shares[e.symbol] = { shares: (cur?.shares ?? 0) + sharesDelta, since: cur?.since ?? e.at }
    }
    activity.unshift({ ...e, id: `seed-${i}`, hash: seededHash(`seed-${i}`), sharesDelta })
  })

  const positions: Position[] = TOKEN_LIST.flatMap((symbol) => {
    const s = shares[symbol]
    return s && s.shares > 0 ? [{ symbol, shares: s.shares, since: s.since }] : []
  })

  return {
    version: 1,
    wallet: {
      status: "disconnected",
      address: YOU_ADDRESS,
      name: YOU_NAME,
      lastError: null,
      balances: { tUSDC: 6_200, tDAI: 2_500, tETH: 2.4, tWBTC: 0.08, tLINK: 180 },
      allowances: { tUSDC: true, tDAI: false, tETH: true, tWBTC: false, tLINK: true },
    },
    pools,
    positions,
    activity,
    clock: { base: SEED_NOW, anchor: 0 },
    settings: { slow: false, failNext: false },
  }
}
