import { HeartHandshake } from 'lucide-react'
import { Card, HiddenGroupState, MaturityBadge, MATURITY } from '@/components/ui'
import { fmt, fmtIndex, K_MIN_GROUP } from '@/lib/scoring/methodology'
import { useDemo } from '@/demo/demoContext'
import { getMyResults, type MyComponent } from '@/demo/me'

const VALUE_HINT = 'Значення компонента від 0 до 100: чим більше, тим системніше працює напрям.'

function Meter({ c }: { c: MyComponent }) {
  return (
    <li className="space-y-1.5">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <span className="text-card">{c.label}</span>
        <span className="flex items-center gap-2">
          <span className="tabular text-card">{fmt(c.value)} з 100</span>
          <MaturityBadge level={c.level} />
        </span>
      </div>
      <div
        role="meter"
        aria-label={`${c.label}: ${fmt(c.value)} з 100, рівень ${c.level} ${MATURITY[c.level].name}`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={c.value}
        className="h-3 overflow-hidden rounded-full bg-surface-muted"
      >
        <div
          data-maturity={c.level}
          className={`h-full rounded-full border-r-2 ${MATURITY[c.level].classes}`}
          style={{ width: `${c.value}%` }}
        />
      </div>
    </li>
  )
}

/** Екран учасника: лише узагальнені результати підрозділу, коли група не менша за k. */
export function Me() {
  const { unitId } = useDemo()
  const r = getMyResults(unitId)
  const { resolved } = r
  const text = r.components
    .map((c) => `${c.label}: ${fmt(c.value)} з 100, рівень ${c.level} (${MATURITY[c.level].name})`)
    .join('; ')

  return (
    <div data-ready="true" className="max-w-3xl space-y-4">
      <div>
        <h1 className="text-title">Мої результати</h1>
        <p className="mt-1 flex items-center gap-2 text-body-lg text-text-muted">
          <HeartHandshake aria-hidden className="size-5 shrink-0 text-accent" />
          Дякуємо, ось що ви допомогли побачити.
        </p>
      </div>

      {resolved.hidden ? (
        <section aria-labelledby="hidden-h" className="space-y-3">
          <h2 id="hidden-h" className="sr-only">
            {resolved.requested.name}: результати приховано
          </h2>
          <p className="m-0 text-card">{resolved.requested.name}</p>
          <HiddenGroupState parentName={resolved.unit.name} />
          <p className="m-0 text-body text-text-muted">
            Нижче дані підрозділу «{resolved.unit.name}». Це рівень вище, а не ваш підрозділ.
          </p>
        </section>
      ) : (
        <p className="m-0 text-body text-text-muted">
          {resolved.unit.name}: відповіли {resolved.responses} осіб (потрібно не менше {K_MIN_GROUP}
          ).
        </p>
      )}

      <Card as="section" aria-labelledby="level-h" className="space-y-4">
        <div>
          <h2 id="level-h" className="text-section">
            Рівень зрілості: {resolved.unit.name}
          </h2>
          <p className="mt-2 flex flex-wrap items-center gap-3">
            <span className="tabular text-display">{fmtIndex(r.index)}</span>
            <MaturityBadge level={r.level} />
          </p>
          <p className="mt-1 text-caption text-text-muted">
            Що це: індекс доброчесності від 0 до 100, середнє трьох компонентів. Шкала рівнів від 1
            до 5.
          </p>
        </div>
        <div>
          <h3 className="text-card">Три компоненти</h3>
          <p className="mt-1 text-caption text-text-muted">{VALUE_HINT}</p>
          <ul className="mt-3 mb-0 flex list-none flex-col gap-4 p-0">
            {r.components.map((c) => (
              <Meter key={c.id} c={c} />
            ))}
          </ul>
          <p className="mt-3 text-caption text-text-muted">Текстом: {text}.</p>
          <details className="mt-2">
            <summary className="touch-target inline-flex cursor-pointer items-center text-accent underline underline-offset-4">
              Показати як таблицю
            </summary>
            <table className="mt-2 w-full border-collapse text-body">
              <caption className="sr-only">Значення компонентів підрозділу</caption>
              <thead>
                <tr className="bg-surface-muted text-left">
                  <th scope="col" className="p-2">
                    Компонент
                  </th>
                  <th scope="col" className="p-2">
                    Значення, з 100
                  </th>
                  <th scope="col" className="p-2">
                    Рівень
                  </th>
                </tr>
              </thead>
              <tbody>
                {r.components.map((c) => (
                  <tr key={c.id} className="border-t border-border">
                    <th scope="row" className="p-2 text-left font-normal">
                      {c.label}
                    </th>
                    <td className="tabular p-2">{fmt(c.value)}</td>
                    <td className="p-2">
                      {c.level} {MATURITY[c.level].name}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </details>
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card as="section" aria-labelledby="done-h">
          <h2 id="done-h" className="text-card">
            Що зроблено з минулого циклу
          </h2>
          <ul className="mt-2 mb-0 list-disc space-y-2 pl-5 text-body">
            {r.done.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </Card>
        <Card as="section" aria-labelledby="next-h">
          <h2 id="next-h" className="text-card">
            Що буде далі
          </h2>
          <ul className="mt-2 mb-0 list-disc space-y-2 pl-5 text-body">
            {r.next.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </Card>
      </div>

      <p className="m-0 text-caption text-text-muted">
        Тут лише узагальнені дані групи. Окремих відповідей, імен і порівнянь підрозділів немає.
      </p>
    </div>
  )
}
