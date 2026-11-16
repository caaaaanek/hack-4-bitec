import { Link } from 'react-router-dom'
import { Card } from '@/components/ui'

export function Home() {
  return (
    <div data-ready="true" className="space-y-6">
      <h1 className="text-title">Платформа оцінювання доброчесності</h1>
      <Card>
        <p className="text-body-lg">
          Тут буде огляд результатів. Поки що доступна вітрина дизайн-системи.
        </p>
        <p className="mt-4">
          <Link className="text-accent underline underline-offset-4" to="/design">
            Відкрити вітрину дизайн-системи
          </Link>
        </p>
      </Card>
    </div>
  )
}
