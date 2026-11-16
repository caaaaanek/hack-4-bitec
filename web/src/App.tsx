import { BrowserRouter, Link, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ToastProvider } from '@/components/ui'
import { AppShell } from '@/components/layout/AppShell'
import { Home } from '@/pages/Home'
import { Design } from '@/pages/Design'
import { Placeholder } from '@/pages/Placeholder'

const queryClient = new QueryClient()

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<AppShell />}>
              <Route path="/" element={<Home />} />
              <Route
                path="/explain"
                element={
                  <Placeholder
                    title="Розклад індексу"
                    description="Тут буде розклад індексу на компоненти, питання й факти: звідки взялося кожне число. Розділ зʼявиться в наступному етапі."
                  />
                }
              />
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
        </BrowserRouter>
      </ToastProvider>
    </QueryClientProvider>
  )
}
