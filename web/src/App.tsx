import { BrowserRouter, Link, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ToastProvider } from '@/components/ui'
import { AppShell } from '@/components/layout/AppShell'
import { Home } from '@/pages/Home'
import { Explain } from '@/pages/Explain'
import { Survey } from '@/pages/Survey'
import { Design } from '@/pages/Design'
import { Placeholder } from '@/pages/Placeholder'
import { DemoProvider } from '@/demo/DemoProvider'

const queryClient = new QueryClient()

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <BrowserRouter>
          <DemoProvider>
            <Routes>
              <Route path="/s/:token" element={<Survey />} />
              <Route element={<AppShell />}>
                <Route path="/" element={<Home />} />
                <Route path="/explain" element={<Explain />} />
                <Route
                  path="/recommendations"
                  element={
                    <Placeholder
                      title="Рекомендації"
                      description="Тут зʼявляться рекомендації за результатами оцінювання. Прийняту рекомендацію можна буде перетворити на захід з виконавцем і строком."
                    />
                  }
                />
                <Route
                  path="/reports"
                  element={
                    <Placeholder
                      title="Звіт"
                      description="Тут можна буде сформувати звіт за циклом оцінювання для друку або збереження."
                    />
                  }
                />
                <Route
                  path="/manage"
                  element={
                    <Placeholder
                      title="Керування циклом"
                      description="Тут уповноважений налаштує цикл оцінювання, мінімальну групу k, розсилку жетонів і побачить лише кількість виданих та використаних жетонів."
                      note="Ця роль не має доступу до відповідей респондентів, навіть узагальнених. Результати бачать лише ті ролі, яким вони потрібні для рішень."
                    />
                  }
                />
                <Route
                  path="/surveys"
                  element={
                    <Placeholder
                      title="Анкети"
                      description="Тут укладач створюватиме анкети, питання з варіантами відповідей і версії, а потім публікуватиме їх у цикл."
                      note="Ця роль не має доступу до відповідей респондентів і не бачить, хто та скільки людей пройшли анкету."
                    />
                  }
                />
                <Route
                  path="/checklist"
                  element={
                    <Placeholder
                      title="Чек-лист"
                      description="Тут зʼявляться пункти чек-листа: один працівник вносить дані, інший підтверджує їх. Кожен пункт матиме джерело й дату."
                    />
                  }
                />
                <Route
                  path="/audit"
                  element={
                    <Placeholder
                      title="Журнал"
                      description="Тут буде журнал дій із перевіркою цілісності: хто, коли й що змінив у налаштуваннях та даних. Відповідей респондентів у журналі немає."
                    />
                  }
                />
                <Route path="/design" element={<Design />} />
                <Route
                  path="*"
                  element={
                    <div data-ready="true">
                      <h1 className="text-title">Сторінку не знайдено</h1>
                      <p className="mt-2 text-body-lg text-text-muted">
                        Перевірте адресу або поверніться на{' '}
                        <Link className="text-accent underline" to="/">
                          головну
                        </Link>
                        .
                      </p>
                    </div>
                  }
                />
              </Route>
            </Routes>
          </DemoProvider>
        </BrowserRouter>
      </ToastProvider>
    </QueryClientProvider>
  )
}
