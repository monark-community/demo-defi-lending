import { TokenAmount } from "@/components/ui/token-amount"
import { intlLocale, type Locale } from "@/i18n/config"
import { TOKENS, usdValue } from "@/lib/demo/tokens"
import type { TokenSymbol } from "@/lib/demo/types"
import { AMOUNT_DECIMALS, toUnits } from "@/lib/format"

/** Token amounts always go through the registry TokenAmount component (DeFi family convention). */
export function Amount({
  value,
  symbol,
  locale,
  digits,
  usd = false,
  showSymbol = true,
  label,
  className,
}: {
  value: number
  symbol: TokenSymbol
  locale: Locale
  digits?: number
  usd?: boolean
  showSymbol?: boolean
  /** Symbol text override, e.g. a share token "ym-tUSDC". */
  label?: string
  className?: string
}) {
  return (
    <TokenAmount
      value={toUnits(value)}
      decimals={AMOUNT_DECIMALS}
      fractionDigits={digits ?? TOKENS[symbol].digits}
      symbol={showSymbol ? (label ?? symbol) : undefined}
      locale={intlLocale[locale]}
      usdValue={usd ? usdValue(value, symbol) : undefined}
      className={className}
    />
  )
}
