/**
 * "Where the yield comes from": lenders → pool → borrowers on the left rail,
 * interest flowing back up on the right rail, with the reserve slice peeling off.
 * Flat 2px orange line art (brand guidelines §6), vertical so it stays legible on phones.
 */
export function YieldFlow({
  labels,
  ariaLabel,
}: {
  labels: { lenders: string; pool: string; borrowers: string; interest: string; reserve: string }
  ariaLabel: string
}) {
  const node = (y: number, text: string, strong = false) => (
    <g>
      <rect
        x={100}
        y={y}
        width={160}
        height={52}
        rx={26}
        fill={strong ? "var(--secondary)" : "var(--card)"}
        stroke={strong ? "var(--primary)" : "var(--foreground)"}
        strokeWidth={strong ? 2.5 : 1.5}
      />
      <text x={180} y={y + 32} textAnchor="middle" fontSize="16" fontWeight="800" fill="var(--foreground)">
        {text}
      </text>
    </g>
  )

  return (
    <svg viewBox="0 0 360 380" role="img" aria-label={ariaLabel} className="mx-auto h-auto w-full max-w-[22rem]">
      <defs>
        <marker id="yf-arrow" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M 1 1 L 8 5 L 1 9" fill="none" stroke="var(--primary)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </marker>
      </defs>

      {/* Supply and lend: down the left rail */}
      <path d="M 120 72 L 120 150" fill="none" stroke="var(--foreground)" strokeWidth={1.5} strokeLinecap="round" markerEnd="url(#yf-arrow)" opacity={0.7} />
      <path d="M 120 216 L 120 294" fill="none" stroke="var(--foreground)" strokeWidth={1.5} strokeLinecap="round" markerEnd="url(#yf-arrow)" opacity={0.7} />

      {/* Interest: back up the right rail, flowing */}
      <path d="M 240 294 L 240 216" fill="none" stroke="var(--primary)" strokeWidth={2} strokeLinecap="round" className="ym-flowing" />
      <path d="M 240 294 L 240 222" fill="none" stroke="none" markerEnd="url(#yf-arrow)" />
      <path d="M 240 150 L 240 72" fill="none" stroke="var(--primary)" strokeWidth={2} strokeLinecap="round" className="ym-flowing" />
      <path d="M 240 150 L 240 78" fill="none" stroke="none" markerEnd="url(#yf-arrow)" />
      <text x={252} y={290} fontSize="12" fontWeight="700" fill="var(--primary-ink)">
        {labels.interest}
      </text>
      <text x={252} y={115} fontSize="12" fontWeight="700" fill="var(--primary-ink)">
        {labels.interest}
      </text>

      {/* Reserve slice */}
      <path d="M 260 183 C 300 183, 318 183, 318 222" fill="none" stroke="var(--primary)" strokeWidth={1.5} strokeLinecap="round" strokeDasharray="2 5" />
      <circle cx={318} cy={234} r={10} fill="var(--card)" stroke="var(--primary)" strokeWidth={2} />
      <text x={318} y={236 + 30} textAnchor="middle" fontSize="11" fontWeight="700" fill="var(--muted-foreground)">
        {labels.reserve}
      </text>

      {node(20, labels.lenders)}
      {node(157, labels.pool, true)}
      {node(300, labels.borrowers)}

      {/* Step numbers, matching the list beside the diagram */}
      {[
        { n: 1, x: 70, y: 112 },
        { n: 2, x: 70, y: 258 },
        { n: 3, x: 290, y: 60 },
        { n: 4, x: 340, y: 204 },
      ].map((s) => (
        <g key={s.n}>
          <circle cx={s.x} cy={s.y} r={11} fill="var(--background)" stroke="var(--primary)" strokeWidth={1.5} />
          <text x={s.x} y={s.y + 4} textAnchor="middle" fontSize="11" fontWeight="800" fill="var(--foreground)">
            {s.n}
          </text>
        </g>
      ))}
    </svg>
  )
}
