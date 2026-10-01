import type { Token, TokenSymbol } from "./types"

/** Testnet tokens and reference prices shared with the Monark DeFi demos. */
export const TOKENS: Record<TokenSymbol, Token> = {
  tUSDC: { symbol: "tUSDC", name: "Test USD Coin", usd: 1, digits: 2 },
  tDAI: { symbol: "tDAI", name: "Test Dai", usd: 1, digits: 2 },
  tETH: { symbol: "tETH", name: "Test Ether", usd: 3200, digits: 4 },
  tWBTC: { symbol: "tWBTC", name: "Test Wrapped Bitcoin", usd: 64000, digits: 5 },
  tLINK: { symbol: "tLINK", name: "Test Chainlink", usd: 14.5, digits: 2 },
}

export const TOKEN_LIST: TokenSymbol[] = ["tUSDC", "tDAI", "tETH", "tWBTC", "tLINK"]

export const NETWORK_NAME = "Sepolia testnet"

export function isTokenSymbol(value: string): value is TokenSymbol {
  return (TOKEN_LIST as string[]).includes(value)
}

/** Pool share token name, e.g. ym-tUSDC. */
export const shareSymbol = (symbol: TokenSymbol) => `ym-${symbol}`

export const usdValue = (amount: number, symbol: TokenSymbol) => amount * TOKENS[symbol].usd

/**
 * Parse a user-typed amount ("1 250,5", "1250.50"). Returns null if it isn't a
 * number, or if it has more fraction digits than the token shows.
 */
export function parseAmount(input: string, symbol: TokenSymbol): number | null {
  const cleaned = input.replace(/[\s  _]/g, "").replace(",", ".")
  if (!/^\d+(\.\d*)?$|^\.\d+$/.test(cleaned)) return null
  const frac = cleaned.split(".")[1] ?? ""
  if (frac.length > Math.max(TOKENS[symbol].digits, 6)) return null
  return Number(cleaned)
}

/** Round down to what the UI can show, so "Max" never exceeds a balance by float dust. */
export function floorTo(amount: number, symbol: TokenSymbol): number {
  const f = 10 ** Math.max(TOKENS[symbol].digits, 6)
  return Math.floor(amount * f + 1e-7) / f
}
