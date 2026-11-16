# Backend

API опитувальників, конструктора анкет і ролей. Опис архітектури та API: [`docs/backend.md`](../docs/backend.md).

## Запуск через Docker (з кореня репозиторію)

1. `cp .env.example .env` і заповнити `POSTGRES_PASSWORD`, `JWT_SECRET`, `DEMO_PASSWORD`.
2. `docker compose up --build`
3. Відкрити `http://localhost:8000/docs`

Під час старту застосовуються міграції й створюються синтетичні демо-дані: підрозділи, користувачі `admin`, `commissioner`, `wg1`…`wg6`, `staff01`…`staff24`, `expert1`…`expert5` (пароль: `DEMO_PASSWORD`), чотири опубліковані анкети з додатків Б і В і факти за 12 місяців.

## Локальний запуск без Docker

Потрібні Python 3.12+ і PostgreSQL.

```bash
cd backend
python -m venv .venv && source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements-dev.txt
cp .env.example .env        # заповнити JWT_SECRET і DEMO_PASSWORD
alembic upgrade head && python -m app.seed.seed && uvicorn app.main:app --reload
```

## Демо-хвиля одним запуском

Коли сервер працює, ця команда проходить повну хвилю на демо-даних (анкети, чек-лист, закриття) і друкує Integrity Index з поясненнями:

```bash
python scripts/demo_wave.py
python scripts/demo_wave.py --title "Хвиля 2" --shift 1   # друга хвиля для динаміки
```

## Тести

```bash
cd backend && pytest
```

За замовчуванням тести працюють на тимчасовій SQLite. Щоб прогнати їх на PostgreSQL, задайте `TEST_DATABASE_URL`.

## Де що лежить

| Шлях | Що там |
|---|---|
| `app/models.py` | Таблиці БД |
| `app/schemas.py` | Формати запитів і відповідей API |
| `app/security.py` | Паролі, JWT, перевірка ролей |
| `app/routers/` | Маршрути: `auth`, `admin`, `questionnaires`, `campaigns`, `respond` |
| `app/services/` | Логіка: анкети й версії, перевірка відповідей, правила допуску, методика й розрахунок Integrity Index, факти, знімки |
| `app/seed/` | Демо-дані й анкети з додатків Б і В (JSON) |
| `migrations/` | Міграції Alembic |
| `scripts/demo_wave.py` | Демо-хвиля через API від початку до кінця |
