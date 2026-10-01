import { intlLocale, type Locale } from "@/i18n/config"
import { TOKENS } from "@/lib/demo/tokens"
import type { TokenSymbol } from "@/lib/demo/types"

const nf = (locale: Locale, opts: Intl.NumberFormatOptions) => new Intl.NumberFormat(intlLocale[locale], opts)

/** "1,500.25" / "1 500,25" with the token's display precision. */
export function formatAmount(amount: number, symbol: TokenSymbol, locale: Locale, digits = TOKENS[symbol].digits): string {
  return nf(locale, { maximumFractionDigits: digits, minimumFractionDigits: 0 }).format(amount)
}

export function formatToken(amount: number, symbol: TokenSymbol, locale: Locale, digits?: number): string {
  return `${formatAmount(amount, symbol, locale, digits)} ${symbol}`
}

export function formatUsd(amount: number, locale: Locale, compact = false): string {
  return nf(locale, {
    style: "currency",
    currency: "USD",
    currencyDisplay: "narrowSymbol",
    ...(compact ? { notation: "compact", maximumFractionDigits: 1 } : { maximumFractionDigits: 2, minimumFractionDigits: 2 }),
  }).format(amount)
}

/** Rates and utilization: always two decimals (Monark DeFi family convention). */
export function formatPercent(fraction: number, locale: Locale, digits = 2): string {
  return nf(locale, { style: "percent", maximumFractionDigits: digits, minimumFractionDigits: digits }).format(fraction)
}

export function formatNumber(n: number, locale: Locale, digits = 2): string {
  return nf(locale, { maximumFractionDigits: digits }).format(n)
}

export function formatCompact(n: number, locale: Locale): string {
  return nf(locale, { notation: "compact", maximumFractionDigits: 2 }).format(n)
}

export function formatDate(iso: string | number, locale: Locale): string {
  return new Intl.DateTimeFormat(intlLocale[locale], { dateStyle: "medium", timeZone: "UTC" }).format(new Date(iso))
}

export function formatShortDate(iso: string | number, locale: Locale): string {
  return new Intl.DateTimeFormat(intlLocale[locale], { month: "short", day: "numeric", timeZone: "UTC" }).format(new Date(iso))
}

export function formatDateTime(iso: string | number, locale: Locale): string {
  return new Intl.DateTimeFormat(intlLocale[locale], { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" }).format(new Date(iso))
}

export function shortHash(hash: string, start = 8, end = 6): string {
  return hash.length > start + end + 1 ? `${hash.slice(0, start)}…${hash.slice(-end)}` : hash
}

/** Number of whole tokens → base-unit string for the registry TokenAmount component (8 decimals). */
export const AMOUNT_DECIMALS = 8
export function toUnits(amount: number): string {
  return BigInt(Math.round(Math.max(amount, 0) * 10 ** AMOUNT_DECIMALS)).toString()
}
