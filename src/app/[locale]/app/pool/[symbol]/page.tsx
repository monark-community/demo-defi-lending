import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { PoolView } from "@/components/demo/pool-view"
import { isLocale, locales } from "@/i18n/config"
import { getDictionary, t } from "@/i18n"
import { isTokenSymbol, TOKEN_LIST } from "@/lib/demo/tokens"
import { pageMetadata } from "@/lib/metadata"

export function generateStaticParams() {
  return locales.flatMap((locale) => TOKEN_LIST.map((symbol) => ({ locale, symbol })))
}

export const dynamicParams = false

export async function generateMetadata({ params }: PageProps<"/[locale]/app/pool/[symbol]">): Promise<Metadata> {
  const { locale, symbol } = await params
  if (!isLocale(locale) || !isTokenSymbol(symbol)) return {}
  const m = getDictionary(locale).meta.pages.pool
  return pageMetadata(locale, `/app/pool/${symbol}`, t(m.title, { token: symbol }), t(m.description, { token: symbol }))
}

export default async function PoolPage({ params }: PageProps<"/[locale]/app/pool/[symbol]">) {
  const { locale, symbol } = await params
  if (!isLocale(locale) || !isTokenSymbol(symbol)) notFound()
  return <PoolView symbol={symbol} />
}
