// Visual check of every page and key flow with Playwright.
// Usage: pnpm build && pnpm start -p 3132   (in another terminal)
//        BASE_URL=http://localhost:3132 pnpm screenshots
// Output: docs/screenshots/<locale>-<width>-<theme>-<name>.png
import { mkdir } from "node:fs/promises"
import { fileURLToPath } from "node:url"
import { chromium } from "playwright"

const BASE = process.env.BASE_URL ?? "http://localhost:3000"
const OUT = fileURLToPath(new URL("../docs/screenshots/", import.meta.url))
const ONLY = process.env.ONLY // optional filter on the variant tag

const sizes = { 390: { width: 390, height: 844 }, 1440: { width: 1440, height: 900 } }
const variants = []
for (const w of [390, 1440]) for (const theme of ["light", "dark"]) variants.push({ locale: "en", w, theme })
for (const w of [390, 1440]) variants.push({ locale: "fr", w, theme: "light" })

const L = {
  en: { connect: "Connect demo wallet", confirm: "Confirm", reject: "Reject", title: "Your lending", controls: "Demo controls", menu: "Open menu" },
  fr: { connect: "Connecter le portefeuille de démo", confirm: "Confirmer", reject: "Refuser", title: "Vos prêts", controls: "Contrôles de démo", menu: "Ouvrir le menu" },
}

async function newPage(browser, { locale, w, theme }) {
  const context = await browser.newContext({ viewport: sizes[w], colorScheme: theme, locale: locale === "fr" ? "fr-CA" : "en-CA" })
  await context.addInitScript((t) => {
    try {
      window.localStorage.setItem("theme", t)
    } catch {}
  }, theme)
  return { context, page: await context.newPage() }
}

async function shot(page, v, name, fullPage = false) {
  if (fullPage) {
    // Load lazy images (footer logo, photos) before a full-page capture.
    await page.evaluate(async () => {
      for (let y = 0; y < document.body.scrollHeight; y += 600) {
        window.scrollTo(0, y)
        await new Promise((r) => setTimeout(r, 40))
      }
    })
    await page.evaluate(() => window.scrollTo(0, 0))
  }
  await page.waitForTimeout(300)
  await page.screenshot({ path: `${OUT}${v.locale}-${v.w}-${v.theme}-${name}.png`, fullPage })
  console.log("  ✓", name)
}

const dialog = (page) => page.getByRole("dialog")

async function confirmPrompt(page, v) {
  await dialog(page).getByRole("button", { name: L[v.locale].confirm }).click()
}

async function connect(page, v, capture) {
  await page.goto(`${BASE}/${v.locale}/app`, { waitUntil: "networkidle" })
  const btn = page.getByRole("main").getByRole("button", { name: L[v.locale].connect })
  await btn.waitFor()
  if (capture) await shot(page, v, "app-01-gate", true)
  await btn.click()
  await dialog(page).waitFor()
  if (capture) await shot(page, v, "flow1-connect-prompt")
  await confirmPrompt(page, v)
  await page.getByRole("heading", { level: 1, name: L[v.locale].title }).waitFor({ timeout: 10000 })
}

async function controls(page, v) {
  await page.getByRole("button", { name: L[v.locale].controls }).click()
  await dialog(page).waitFor()
}

async function marketing(page, v) {
  for (const [name, path] of [
    ["home", ""],
    ["how-it-works", "/how-it-works"],
    ["credits", "/credits"],
    ["pricing", "/pricing"],
    ["404", "/this-page-does-not-exist"],
  ]) {
    await page.goto(`${BASE}/${v.locale}${path}`, { waitUntil: "networkidle" })
    await page.waitForTimeout(400)
    await shot(page, v, `page-${name}`, true)
  }
  // Flow 5: the rate playground on a tight market
  await page.goto(`${BASE}/${v.locale}/how-it-works`, { waitUntil: "networkidle" })
  await page.getByRole("button", { name: "Tight market" }).click()
  await page.getByRole("heading", { name: "The rate model, hands on" }).scrollIntoViewIfNeeded()
  await shot(page, v, "flow5-playground-tight")
  if (v.w < 768) {
    await page.goto(`${BASE}/${v.locale}`, { waitUntil: "networkidle" })
    await page.getByRole("button", { name: L[v.locale].menu }).click()
    await dialog(page).waitFor()
    await shot(page, v, "page-mobile-menu")
  }
}

async function appFlows(page, v) {
  // Flow 1: connect, including the rejected state
  await page.goto(`${BASE}/${v.locale}/app`, { waitUntil: "networkidle" })
  const btn = page.getByRole("main").getByRole("button", { name: "Connect demo wallet" })
  await btn.waitFor()
  await shot(page, v, "app-01-gate", true)
  await btn.click()
  await dialog(page).waitFor()
  await shot(page, v, "flow1-connect-prompt")
  await dialog(page).getByRole("button", { name: "Reject" }).click()
  await page.getByText("You declined the sign-in request").waitFor()
  await shot(page, v, "flow1-connect-rejected")
  await btn.click()
  await confirmPrompt(page, v)
  await page.getByRole("heading", { level: 1, name: "Your lending" }).waitFor({ timeout: 10000 })
  await page.waitForTimeout(600)
  await shot(page, v, "app-02-dashboard", true)

  // Flow 2: first supply to tDAI (approval + supply, with one forced failure)
  await page.goto(`${BASE}/${v.locale}/app/pool/tDAI`, { waitUntil: "networkidle" })
  await page.getByRole("heading", { level: 1, name: "tDAI pool" }).waitFor()
  await shot(page, v, "flow2-pool-blank", true)
  const amount = page.getByLabel("Amount")
  await amount.fill("99999")
  await page.waitForTimeout(200)
  await page.getByText("That's more than your wallet holds").scrollIntoViewIfNeeded()
  await shot(page, v, "flow2-error-too-much")
  await amount.fill("1500")
  await page.waitForTimeout(300)
  if (v.w >= 768) await page.getByRole("heading", { name: "Interest-rate curve" }).scrollIntoViewIfNeeded()
  await shot(page, v, "flow2-preview")
  await controls(page, v)
  await page.getByLabel("Fail the next transaction").click()
  await page.keyboard.press("Escape")
  await page.getByRole("button", { name: "Approve tDAI" }).click()
  await dialog(page).waitFor()
  await shot(page, v, "flow2-approve-prompt")
  await confirmPrompt(page, v)
  await page.getByText("Waiting for the network…").first().waitFor()
  await page.getByText("Waiting for the network…").first().scrollIntoViewIfNeeded()
  await shot(page, v, "flow2-approve-pending")
  await page.getByText("The transaction failed on the network").waitFor({ timeout: 10000 })
  await page.getByText("The transaction failed on the network").scrollIntoViewIfNeeded()
  await shot(page, v, "flow2-approve-failed")
  await page.getByRole("button", { name: "Try again" }).click()
  await confirmPrompt(page, v)
  await page.getByRole("button", { name: /^Supply 1,500/ }).waitFor({ timeout: 10000 })
  await page.getByRole("button", { name: /^Supply 1,500/ }).click()
  await dialog(page).waitFor()
  await shot(page, v, "flow2-supply-prompt")
  await confirmPrompt(page, v)
  await page.getByText("Supplied. Your new shares are earning.").waitFor({ timeout: 10000 })
  await page.waitForTimeout(500)
  await page.getByText("Supplied. Your new shares are earning.").scrollIntoViewIfNeeded()
  await shot(page, v, "flow2-supply-confirmed")

  // Flow 4: withdraw everything from the tight tLINK pool
  await page.goto(`${BASE}/${v.locale}/app/pool/tLINK`, { waitUntil: "networkidle" })
  await page.getByRole("heading", { level: 1, name: "tLINK pool" }).waitFor()
  await page.getByRole("tab", { name: "Withdraw" }).click()
  await page.getByRole("button", { name: "Max" }).click()
  await page.waitForTimeout(300)
  await page.getByText("Joins the queue").first().scrollIntoViewIfNeeded()
  await shot(page, v, "flow4-withdraw-split")
  await page.getByRole("button", { name: /^Withdraw [0-9]/ }).click()
  await dialog(page).waitFor()
  await shot(page, v, "flow4-withdraw-prompt")
  await confirmPrompt(page, v)
  await page.getByText("Part paid now; the rest is in the queue.").waitFor({ timeout: 10000 })
  await page.waitForTimeout(400)
  await page.getByRole("heading", { name: "Withdrawal queue" }).scrollIntoViewIfNeeded()
  await shot(page, v, "flow4-queued")
  await controls(page, v)
  await dialog(page).getByRole("button", { name: "+1 day" }).click()
  await page.getByText(/queued .* withdrawal was paid/).first().waitFor({ timeout: 10000 })
  await page.waitForTimeout(400)
  await shot(page, v, "flow4-queue-paid")
  await page.waitForTimeout(4500)
  await page.goto(`${BASE}/${v.locale}/app`, { waitUntil: "networkidle" })
  await page.getByRole("heading", { level: 1, name: "Your lending" }).waitFor()
  await page.getByRole("heading", { name: "Activity" }).scrollIntoViewIfNeeded()
  await shot(page, v, "flow4-activity")
  // Flow 3: skip 30 days, watch earnings
  await page.goto(`${BASE}/${v.locale}/app`, { waitUntil: "networkidle" })
  await page.getByRole("heading", { level: 1, name: "Your lending" }).waitFor()
  await controls(page, v)
  await shot(page, v, "app-03-demo-controls")
  await dialog(page).getByRole("button", { name: "+30 days" }).click()
  await page.getByText("30 days later").waitFor()
  await page.waitForTimeout(500)
  await shot(page, v, "flow3-skipped-toast")
  await page.waitForTimeout(4500)
  await shot(page, v, "flow3-dashboard-after", true)

}

async function frenchFlow(page, v) {
  await page.goto(`${BASE}/fr`, { waitUntil: "networkidle" })
  await page.waitForTimeout(400)
  await shot(page, v, "page-home", true)
  await connect(page, v, true)
  await page.waitForTimeout(600)
  await shot(page, v, "app-02-dashboard", true)
  await page.goto(`${BASE}/fr/app/pool/tDAI`, { waitUntil: "networkidle" })
  await page.getByRole("heading", { level: 1, name: "Pool tDAI" }).waitFor()
  await page.getByLabel("Montant").fill("1500")
  await page.waitForTimeout(300)
  await shot(page, v, "flow2-preview", true)
  await page.goto(`${BASE}/fr/app/pool/tLINK`, { waitUntil: "networkidle" })
  await page.getByRole("tab", { name: "Retirer" }).click()
  await page.getByRole("button", { name: "Max" }).click()
  await page.waitForTimeout(300)
  await page.getByText("Rejoint la file").first().scrollIntoViewIfNeeded()
  await shot(page, v, "flow4-withdraw-split")
}

const browser = await chromium.launch()
await mkdir(OUT, { recursive: true })
for (const v of variants) {
  const tag = `${v.locale}-${v.w}-${v.theme}`
  if (ONLY && !tag.includes(ONLY)) continue
  console.log(tag)
  const { context, page } = await newPage(browser, v)
  page.on("pageerror", (e) => console.error("  pageerror:", e.message))
  try {
    if (v.locale === "fr") await frenchFlow(page, v)
    else {
      await marketing(page, v)
      await appFlows(page, v)
    }
  } catch (e) {
    console.error("  ✗", tag, e.message)
    await page.screenshot({ path: `${OUT}_error-${tag}.png` }).catch(() => {})
    process.exitCode = 1
  }
  await context.close()
}
await browser.close()
