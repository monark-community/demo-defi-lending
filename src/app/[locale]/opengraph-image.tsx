import { readFile } from "node:fs/promises"
import { join } from "node:path"

import { ImageResponse } from "next/og"

import { isLocale, locales } from "@/i18n/config"
import { getDictionary } from "@/i18n"
import { supplyRate } from "@/lib/demo/rates"

export const alt = "Yieldmine by Monark"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }))
}

const MODEL = { base: 0.005, slope1: 0.06, slope2: 0.75, kink: 0.85, reserveFactor: 0.1 }

export default async function OpenGraphImage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params
  const locale = isLocale(raw) ? raw : "en"
  const d = getDictionary(locale)
  const mark = await readFile(join(process.cwd(), "public/brand/monark-mark.svg"), "utf8")
  const markSrc = `data:image/svg+xml;base64,${Buffer.from(mark).toString("base64")}`

  // The supply curve, drawn flat in orange: the product's signature image.
  const W = 440
  const H = 360
  const yMax = 0.16
  const pts = Array.from({ length: 81 }, (_, i) => {
    const u = i / 80
    return `${(u * W).toFixed(1)},${(H - (Math.min(supplyRate(u, MODEL), yMax) / yMax) * H).toFixed(1)}`
  }).join(" ")
  const u0 = 0.79
  const cx = u0 * W
  const cy = H - (supplyRate(u0, MODEL) / yMax) * H

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "#FFF9F3", color: "#15110E", padding: 72 }}>
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", width: 600 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={markSrc} width={64} height={64} alt="" />
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: 44, fontWeight: 800, lineHeight: 1 }}>Yieldmine</span>
              <span style={{ fontSize: 22, color: "#625952", marginTop: 6 }}>{d.common.byMonark}</span>
            </div>
          </div>
          <div style={{ fontSize: 60, fontWeight: 800, lineHeight: 1.08, letterSpacing: -1.5 }}>{d.meta.ogTagline}</div>
          <div style={{ fontSize: 22, color: "#625952" }}>{d.common.demoBadge}</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", marginLeft: 20 }}>
          <svg width={W + 20} height={H + 40} viewBox={`-10 -20 ${W + 20} ${H + 40}`}>
            <line x1={0} x2={W} y1={H} y2={H} stroke="#E9DFD7" strokeWidth={3} />
            <line x1={0.85 * W} x2={0.85 * W} y1={0} y2={H} stroke="#857F7A" strokeWidth={2} strokeDasharray="6 8" />
            <polyline points={pts} fill="none" stroke="#F88D10" strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" />
            <circle cx={cx} cy={cy} r={18} fill="#F88D10" stroke="#FFFEFC" strokeWidth={7} />
          </svg>
        </div>
      </div>
    ),
    size
  )
}
