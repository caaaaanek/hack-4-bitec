import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Link, useParams } from 'react-router-dom'
import { CheckCircle2, EyeOff, LinkIcon, ShieldCheck, UserRoundX, UsersRound } from 'lucide-react'
import { Button, EmptyState } from '@/components/ui'
import { cn } from '@/lib/cn'
import { K_MIN_GROUP } from '@/lib/scoring/methodology'
import { defaultRoute } from '@/lib/access'
import { useDemo } from '@/demo/demoContext'
import { DEMO_SURVEY, checkToken, type Survey as SurveyModel } from '@/demo/survey'
import {
  answeredCount,
  clearDraft,
  loadDraft,
  missingQuestions,
  questionCount,
  saveDraft,
  type Answers,
  type MissingQuestion,
} from '@/lib/survey'

type Phase = 'guarantees' | 'steps' | 'thanks'

const GUARANTEES = [
  { icon: UserRoundX, text: 'Ваші відповіді не повʼязані з вами і не містять імен.' },
  {
    icon: EyeOff,
    text: 'Адміністратор бачить лише кількість відповідей, а не те, що ви відповіли.',
  },
  {
    icon: UsersRound,
    text: `Результати показують лише для груп не менше ${K_MIN_GROUP} осіб.`,
  },
]

function Frame({ children }: { children: ReactNode }) {
  const { role } = useDemo()
  return (
    <div className="min-h-screen bg-bg" data-ready="true">
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex max-w-xl items-center justify-between gap-3 px-4 py-3">
          <p className="m-0 flex items-center gap-2 text-caption font-semibold text-text">
            <ShieldCheck aria-hidden className="size-5 text-accent" />
            Анонімне опитування
          </p>
          <Link
            to={defaultRoute(role)}
            className="touch-target inline-flex items-center text-caption text-accent underline underline-offset-4"
          >
            Закрити
          </Link>
        </div>
      </header>
      <main id="main" tabIndex={-1} className="mx-auto max-w-xl px-4 py-5">
        {children}
      </main>
    </div>
  )
}

function TokenState({ state }: { state: 'used' | 'invalid' }) {
  const { role } = useDemo()
  return (
    <Frame>
      <h1 className="sr-only">Опитування</h1>
      {state === 'used' ? (
        <EmptyState
          icon={<CheckCircle2 className="size-8" />}
          title="Цю анкету вже заповнено"
          description="Повторно відповісти за цим посиланням не можна: так ми захищаємо анонімність і не допускаємо подвоєних відповідей. Дякуємо за участь."
          action={
            <Link to={defaultRoute(role)} className="text-accent underline underline-offset-4">
              Закрити
            </Link>
          }
        />
      ) : (
        <EmptyState
          icon={<LinkIcon className="size-8" />}
          title="Посилання недійсне або застаріле"
          description="Перевірте, чи адресу скопійовано повністю. Якщо не допомогло, попросіть нове посилання в тієї особи, яка надіслала вам анкету."
          action={
            <Link to={defaultRoute(role)} className="text-accent underline underline-offset-4">
              Закрити
            </Link>
          }
        />
      )}
    </Frame>
  )
}

export function Survey() {
  const { token } = useParams()
  const state = checkToken(token)
  if (state !== 'valid') return <TokenState state={state} />
  return <SurveyFlow survey={DEMO_SURVEY} token={token!} />
}

export function SurveyFlow({ survey, token }: { survey: SurveyModel; token: string }) {
  const { setRole } = useDemo()
  const [phase, setPhase] = useState<Phase>('guarantees')
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState<Answers>(() => loadDraft(survey, token))
  const [missing, setMissing] = useState<MissingQuestion[] | null>(null)
  const headingRef = useRef<HTMLHeadingElement>(null)
  const pendingFocus = useRef<string | null>(null)
  const moved = useRef(false)

  const total = survey.sections.length
  const section = survey.sections[step]!
  const done = answeredCount(survey, answers)
  const all = questionCount(survey)

  useEffect(() => {
    if (!moved.current) {
      moved.current = true
      return
    }
    if (pendingFocus.current) {
      const el = document.getElementById(pendingFocus.current)
      pendingFocus.current = null
      el?.focus()
      el?.scrollIntoView?.({ block: 'center' })
    } else headingRef.current?.focus()
  }, [step, phase])

  const choose = (qid: string, oid: string) => {
    const next = { ...answers, [qid]: oid }
    setAnswers(next)
    saveDraft(token, next)
    if (missing) setMissing(missingQuestions(survey, next))
  }

  const submit = () => {
    const m = missingQuestions(survey, answers)
    if (m.length > 0) {
      setMissing(m)
      return
    }
    clearDraft(token)
    setMissing(null)
    setPhase('thanks')
  }

  if (phase === 'guarantees') {
    return (
      <Frame>
        <h1 ref={headingRef} tabIndex={-1} className="text-title outline-none">
          Перш ніж почати
        </h1>
        <p className="mt-2 text-body-lg text-text-muted">
          {survey.category}. Анкета займе кілька хвилин. Ось що ми гарантуємо.
        </p>
        <ul className="m-0 mt-4 flex list-none flex-col gap-3 p-0">
          {GUARANTEES.map(({ icon: Icon, text }) => (
            <li
              key={text}
              className="flex items-start gap-3 rounded-lg border border-border bg-surface p-4"
            >
              <Icon aria-hidden className="mt-0.5 size-6 shrink-0 text-accent" />
              <span className="text-body-lg">{text}</span>
            </li>
          ))}
        </ul>
        <Button size="lg" className="mt-6 w-full" onClick={() => setPhase('steps')}>
          Розумію, почати
        </Button>
        {done > 0 && (
          <p className="mt-3 text-caption text-text-muted">
            Збережені раніше відповіді на цьому пристрої буде підставлено ({done} з {all}).
          </p>
        )}
      </Frame>
    )
  }

  if (phase === 'thanks') {
    return (
      <Frame>
        <div role="status" className="rounded-lg border border-border bg-surface p-5">
          <CheckCircle2 aria-hidden className="size-8 text-strength-solid" />
          <h1 ref={headingRef} tabIndex={-1} className="mt-3 text-title outline-none">
            Дякуємо. Ваші відповіді збережено анонімно.
          </h1>
          <p className="mt-3 text-body-lg text-text-muted">
            Що далі: коли відповість достатньо людей (не менше {K_MIN_GROUP}), ви зможете побачити
            узагальнені результати свого підрозділу. Окремих відповідей і імен там не буде.
          </p>
        </div>
        <Button size="lg" className="mt-5 w-full" onClick={() => setRole('respondent')}>
          Переглянути результати підрозділу
        </Button>
      </Frame>
    )
  }

  const last = step === total - 1
  return (
    <Frame>
      <p className="m-0 text-caption font-semibold text-text-muted">
        Крок {step + 1} з {total}
      </p>
      <div
        role="progressbar"
        aria-label="Прогрес анкети"
        aria-valuemin={1}
        aria-valuemax={total}
        aria-valuenow={step + 1}
        aria-valuetext={`Крок ${step + 1} з ${total}`}
        className="mt-2 h-2 overflow-hidden rounded-full bg-surface-muted"
      >
        <div className="h-full bg-accent" style={{ width: `${((step + 1) / total) * 100}%` }} />
      </div>
      <h1 ref={headingRef} tabIndex={-1} className="mt-4 text-title outline-none">
        {section.title}
      </h1>
      <p className="mt-1 text-caption text-text-muted">
        Відповіли на {done} з {all}. Відповіді зберігаються на цьому пристрої, поки ви заповнюєте.
      </p>

      <div className="mt-4 flex flex-col gap-6">
        {section.questions.map((qq, qi) => (
          <fieldset
            key={qq.id}
            id={qq.id}
            tabIndex={-1}
            className="m-0 min-w-0 border-0 p-0 outline-none"
          >
            <legend className="mb-2 text-card text-text">
              {qi + 1}. {qq.text}
            </legend>
            <div className="flex flex-col gap-2">
              {qq.options.map((o) => {
                const selected = answers[qq.id] === o.id
                return (
                  <label
                    key={o.id}
                    className={cn(
                      'flex min-h-11 cursor-pointer items-start gap-3 rounded-lg border px-3 py-3 text-body-lg',
                      'has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-focus',
                      selected
                        ? 'border-accent bg-accent-soft font-medium'
                        : 'border-border-strong bg-surface hover:bg-surface-muted',
                    )}
                  >
                    <input
                      type="radio"
                      name={qq.id}
                      value={o.id}
                      checked={selected}
                      onChange={() => choose(qq.id, o.id)}
                      className="mt-1 size-5 shrink-0 accent-accent"
                    />
                    <span className="min-w-0">{o.text}</span>
                  </label>
                )
              })}
            </div>
          </fieldset>
        ))}
      </div>

      <div aria-live="polite" className="mt-6">
        {missing && missing.length > 0 && (
          <div className="rounded-lg border border-attention-solid bg-attention-bg p-4 text-attention-text">
            <p className="m-0 text-card">
              Залишилось відповісти на {missing.length}. Натисніть на питання, щоб перейти до нього.
            </p>
            <ul className="mt-2 mb-0 list-disc pl-5 text-body-lg">
              {missing.map((m) => (
                <li key={m.questionId}>
                  <a
                    href={`#${m.questionId}`}
                    className="inline-flex min-h-11 items-center underline underline-offset-4"
                    onClick={(e) => {
                      e.preventDefault()
                      pendingFocus.current = m.questionId
                      if (m.sectionIndex !== step) setStep(m.sectionIndex)
                      else {
                        const el = document.getElementById(m.questionId)
                        pendingFocus.current = null
                        el?.focus()
                        el?.scrollIntoView?.({ block: 'center' })
                      }
                    }}
                  >
                    {m.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="mt-6 flex gap-3">
        <Button
          variant="secondary"
          size="lg"
          className="flex-1"
          onClick={() => (step === 0 ? setPhase('guarantees') : setStep(step - 1))}
        >
          Назад
        </Button>
        {last ? (
          <Button size="lg" className="flex-1" onClick={submit}>
            Надіслати
          </Button>
        ) : (
          <Button size="lg" className="flex-1" onClick={() => setStep(step + 1)}>
            Далі
          </Button>
        )}
      </div>
    </Frame>
  )
}
