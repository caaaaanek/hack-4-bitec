// Перевірка контрасту пар «текст на фоні» і графічних об'єктів з src/styles/tokens.css.
// Текст: мінімум 4.5:1. Великі елементи й графічні об'єкти: мінімум 3:1. Код виходу 1 при провалі.
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const css = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), '../src/styles/tokens.css'),
  'utf8',
)
const tokens = {}
for (const m of css.matchAll(/--color-([a-z0-9-]+):\s*(#[0-9a-fA-F]{6})\s*;/g)) tokens[m[1]] = m[2]

const lum = (hex) => {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
  const [r, g, b] = c.map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}
const ratio = (a, b) => {
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

const TEXT = 4.5
const LARGE = 3
const pairs = []
const add = (fg, bg, min, kind) => pairs.push({ fg, bg, min, kind })

// Базові
for (const bg of ['bg', 'surface', 'surface-muted']) {
  add('text', bg, TEXT, 'текст')
  add('text-muted', bg, TEXT, 'текст')
  add('accent', bg, TEXT, 'текст (посилання)')
}
add('on-accent', 'accent', TEXT, 'текст')
add('on-accent', 'accent-hover', TEXT, 'текст')
add('on-accent', 'accent-active', TEXT, 'текст')
add('accent', 'accent-soft', TEXT, 'текст')
add('text', 'accent-soft', TEXT, 'текст')
add('border-strong', 'surface', LARGE, 'межа контролу')
add('border-strong', 'bg', LARGE, 'межа контролу')
add('focus', 'surface', LARGE, 'фокус')
add('focus', 'bg', LARGE, 'фокус')

// Зрілість
for (let i = 1; i <= 5; i++) {
  add(`maturity-${i}-text`, `maturity-${i}-bg`, TEXT, 'текст')
  add(`maturity-${i}-chart`, 'surface', LARGE, 'графік')
}
// Сусідні рівні зрілості на графіку мають відрізнятись
for (let i = 1; i < 5; i++)
  add(`maturity-${i}-chart`, `maturity-${i + 1}-chart`, 1.2, 'різниця рівнів')

// Семантика
for (const s of ['strength', 'attention', 'critical', 'neutral']) {
  add(`${s}-text`, `${s}-bg`, TEXT, 'текст')
  add(`${s}-solid`, 'surface', LARGE, 'графічний об’єкт')
}

// Статуси
for (const s of [
  'proposed',
  'accepted',
  'clarified',
  'rejected',
  'inprogress',
  'done',
  'confirmed',
  'notconfirmed',
  'overdue',
]) {
  add(`status-${s}-text`, `status-${s}-bg`, TEXT, 'текст')
}

// Джерела
for (const s of ['wg', 'os', 'experts', 'facts']) add(`source-${s}`, 'surface', LARGE, 'маркер')

let fail = 0
const rows = []
for (const p of pairs) {
  const fg = tokens[p.fg]
  const bg = tokens[p.bg]
  if (!fg || !bg) {
    rows.push([p.fg, p.bg, '?', p.min, p.kind, 'НЕМАЄ ТОКЕНА'])
    fail++
    continue
  }
  const r = ratio(fg, bg)
  const ok = r >= p.min
  if (!ok) fail++
  rows.push([p.fg, p.bg, r.toFixed(2), p.min, p.kind, ok ? 'ok' : 'FAIL'])
}

const head = ['перед', 'тло', 'контраст', 'мін', 'тип', 'результат']
const all = [head, ...rows.map((r) => r.map(String))]
const w = head.map((_, i) => Math.max(...all.map((r) => r[i].length)))
for (const [i, r] of all.entries()) {
  console.log(r.map((c, j) => c.padEnd(w[j])).join('  '))
  if (i === 0) console.log(w.map((n) => '-'.repeat(n)).join('  '))
}
console.log(`\nПар: ${rows.length}, провалів: ${fail}`)
process.exit(fail ? 1 : 0)
