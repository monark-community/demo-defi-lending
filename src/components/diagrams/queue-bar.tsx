import { cn } from "@/lib/utils"

/**
 * A withdrawal split in two: the solid part leaves now, the hatched part waits
 * in the queue. `filled` (0..1 of the queued part) shows the queue being paid.
 */
export function QueueBar({ ratio, filled = 0, className, label }: { ratio: number; filled?: number; className?: string; label?: string }) {
  const nowW = Math.max(0, Math.min(ratio, 1)) * 100
  const paidW = (100 - nowW) * Math.max(0, Math.min(filled, 1))
  return (
    <svg viewBox="0 0 100 12" preserveAspectRatio="none" role={label ? "img" : undefined} aria-label={label} aria-hidden={label ? undefined : true} className={cn("h-9 w-full overflow-hidden rounded-full border", className)}>
      <defs>
        <pattern id="ym-hatch" width="3" height="3" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="3" stroke="var(--muted-foreground)" strokeWidth="0.7" opacity="0.55" />
        </pattern>
      </defs>
      <rect x="0" y="0" width="100" height="12" fill="var(--background)" />
      <rect x={nowW} y="0" width={100 - nowW} height="12" fill="url(#ym-hatch)" />
      <rect x="0" y="0" width={nowW} height="12" fill="var(--primary)" />
      <rect x={nowW} y="0" width={paidW} height="12" fill="var(--primary)" opacity="0.55" style={{ transition: "width 400ms ease-out" }} />
      <line x1={nowW} x2={nowW} y1="0" y2="12" stroke="var(--foreground)" strokeWidth="0.6" strokeDasharray="1.5 1.5" vectorEffect="non-scaling-stroke" />
    </svg>
  )
}
