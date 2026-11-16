// Перевірка екранів: npm run verify (після check). Збірку робить `npm run build` у складі verify.
import { mkdirSync, rmSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { chromium, type Page } from 'playwright'
import { preview } from 'vite'
import { ROLES, WIDTHS, type VerifyRole, type VerifyRoute } from './verify-config.ts'

const OUT = join(process.cwd(), 'artifacts', 'screens')
const slug = (p: string) =>
  p === '/' ? 'home' : p.replace(/^\/|\/$/g, '').replace(/[^a-z0-9]+/gi, '-')

interface Result {
  role: string
  path: string
  problems: string[]
}

async function checkRoute(
  base: string,
  role: VerifyRole,
  route: VerifyRoute,
  browser: Awaited<ReturnType<typeof chromium.launch>>,
): Promise<Result> {
  const problems: string[] = []
  const origin = new URL(base).origin
  for (const width of WIDTHS) {
    const ctx = await browser.newContext({ viewport: { width, height: 900 }, locale: 'uk-UA' })
    const page = await ctx.newPage()
    const tag = `${width}px`
    const external = new Set<string>()
    page.on('request', (r) => {
      const u = r.url()
      if (/^(data|blob|about):/.test(u)) return
      if (new URL(u).origin !== origin) external.add(u)
    })
    page.on('console', (m) => {
      if (m.type() === 'error') problems.push(`[${tag}] консоль: ${m.text()}`)
    })
    page.on('pageerror', (e) => problems.push(`[${tag}] помилка сторінки: ${e.message}`))
    try {
      if (role.setup) {
        await page.goto(origin + '/', { waitUntil: 'load' })
        await role.setup(page)
      }
      await page.goto(origin + route.path, { waitUntil: 'networkidle' })
      await page.waitForSelector(route.ready ?? '[data-ready="true"]', { timeout: 10_000 })
      await page.evaluate(() => document.fonts.ready)
      problems.push(...(await checkPage(page, tag, width)))
      const dir = join(OUT, role.id, slug(route.path))
      mkdirSync(dir, { recursive: true })
      await page.screenshot({ path: join(dir, `${width}.png`), fullPage: true })
    } catch (e) {
      problems.push(`[${tag}] не готово: ${(e as Error).message.split('\n')[0]}`)
    }
    for (const u of external) problems.push(`[${tag}] зовнішній запит: ${u}`)
    await ctx.close()
  }
  return { role: role.id, path: route.path, problems }
}

async function checkPage(page: Page, tag: string, width: number): Promise<string[]> {
  const out: string[] = []
  const info = await page.evaluate(() => {
    const errors = [...document.querySelectorAll('[role="alert"], [data-error-card]')].filter(
      (e) => e.closest('[data-demo]') === null,
    )
    return {
      text: document.body.innerText,
      errorCards: errors.length,
      scrollW: document.documentElement.scrollWidth,
      innerW: window.innerWidth,
      lang: document.documentElement.lang,
    }
  })
  if (info.errorCards) out.push(`[${tag}] картки помилок: ${info.errorCards}`)
  if (info.text.includes('—')) out.push(`[${tag}] довге тире у видимому тексті`)
  if (/підприємств/i.test(info.text)) out.push(`[${tag}] слово «підприємство» у видимому тексті`)
  if (/рейтинг/i.test(info.text)) out.push(`[${tag}] слово «рейтинг» у видимому тексті`)
  if (info.lang !== 'uk') out.push(`[${tag}] lang=${info.lang}`)
  if (width === 360 && info.scrollW > info.innerW)
    out.push(`[${tag}] горизонтальна прокрутка (${info.scrollW} > ${info.innerW})`)
  return out
}

async function main() {
  if (!existsSync(join(process.cwd(), 'dist'))) {
    console.error('Немає dist/. Запустіть npm run build (або npm run verify).')
    process.exit(1)
  }
  rmSync(OUT, { recursive: true, force: true })
  const server = await preview({ preview: { port: 4179, strictPort: true, host: '127.0.0.1' } })
  const base = server.resolvedUrls?.local[0] ?? 'http://127.0.0.1:4179/'
  const browser = await chromium.launch()
  const results: Result[] = []
  try {
    for (const role of ROLES)
      for (const route of role.routes) results.push(await checkRoute(base, role, route, browser))
  } finally {
    await browser.close()
    await new Promise<void>((r) => server.httpServer.close(() => r()))
  }

  const rows = results.map((r) => [r.role, r.path, r.problems.length ? 'FAIL' : 'ready'])
  const w = [
    Math.max(4, ...rows.map((r) => r[0]!.length)),
    Math.max(6, ...rows.map((r) => r[1]!.length)),
  ]
  console.log(`${'роль'.padEnd(w[0]!)}  ${'екран'.padEnd(w[1]!)}  результат`)
  for (const r of rows) console.log(`${r[0]!.padEnd(w[0]!)}  ${r[1]!.padEnd(w[1]!)}  ${r[2]}`)
  const failed = results.filter((r) => r.problems.length)
  for (const r of failed) {
    console.log(`\n${r.role} ${r.path}:`)
    for (const p of r.problems) console.log(`  - ${p}`)
  }
  console.log(`\nСкріншоти: ${OUT}`)
  process.exit(failed.length ? 1 : 0)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
