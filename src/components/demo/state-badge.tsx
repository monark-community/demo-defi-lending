import { CircleAlertIcon, CircleCheckIcon, CircleDotIcon } from "lucide-react"

import type { UtilizationState } from "@/lib/demo/types"
import { cn } from "@/lib/utils"

const STYLES: Record<UtilizationState, { cls: string; Icon: typeof CircleCheckIcon }> = {
  comfortable: { cls: "border-success/40 text-success", Icon: CircleCheckIcon },
  busy: { cls: "border-warning/50 text-warning", Icon: CircleDotIcon },
  tight: { cls: "border-destructive/50 text-destructive", Icon: CircleAlertIcon },
}

/** Pool liquidity state: green / amber / red, always with a text label (DeFi family convention). */
export function StateBadge({ state, label, title, className }: { state: UtilizationState; label: string; title?: string; className?: string }) {
  const { cls, Icon } = STYLES[state]
  return (
    <span title={title} className={cn("inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-bold", cls, className)}>
      <Icon className="size-3.5" aria-hidden="true" />
      {label}
    </span>
  )
}
