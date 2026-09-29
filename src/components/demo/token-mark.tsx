import type { TokenSymbol } from "@/lib/demo/types"
import { cn } from "@/lib/utils"

/** A neutral monogram for a testnet token (no coin art, per the brand guidelines). */
export function TokenMark({ symbol, className }: { symbol: TokenSymbol; className?: string }) {
  const letters = symbol.slice(1, 2)
  return (
    <span
      aria-hidden="true"
      className={cn(
        "inline-flex size-9 shrink-0 items-center justify-center rounded-full border-[1.5px] border-foreground/70 bg-background text-xs font-extrabold tracking-tight",
        className
      )}
    >
      <span className="text-muted-foreground">t</span>
      {letters}
    </span>
  )
}
