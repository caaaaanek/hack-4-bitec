import { BrowserRouter, Link, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { SkipLink, ToastProvider } from '@/components/ui'
import { Home } from '@/pages/Home'
import { Design } from '@/pages/Design'

const queryClient = new QueryClient()

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <BrowserRouter>
          <SkipLink />
          <main
            id="main"
            tabIndex={-1}
            className="mx-auto w-full max-w-(--content-max) px-(--gutter) py-8"
          >
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/design" element={<Design />} />
              <Route
                path="*"
                element={
                  <div>
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
            </Routes>
          </main>
        </BrowserRouter>
      </ToastProvider>
    </QueryClientProvider>
  )
}
