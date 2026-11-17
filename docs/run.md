# Як запустити все: база, бекенд, фронтенд

## Docker (рекомендовано)

```bash
cp .env.example .env     # заповнити POSTGRES_PASSWORD, JWT_SECRET, DEMO_PASSWORD, INTEGRATION_API_KEY
docker compose up --build
```

| Що | Адреса |
|---|---|
| Застосунок (фронтенд) | http://localhost:8080 |
| API і Swagger | http://localhost:8000/docs |

Фронтенд віддає nginx, а запити `/api` він проксіює на бекенд, тож усе працює з одного адреси без CORS і без зовнішніх сервісів.

Почати з чистої бази: `docker compose down -v`, потім `docker compose up --build`.

## Для розробки (без Docker для фронту)

1. Бекенд: `cd backend`, далі кроки з `backend/README.md` (alembic, seed, uvicorn на порту 8000).
2. Фронтенд:
   ```bash
   cd frontend
   npm ci
   npm run dev          # http://localhost:5173, /api проксіюється на http://localhost:8000
   ```
   Інший адрес бекенду можна задати змінною `VITE_API_TARGET`.

## Демо-дані для показу

Після seed закритих хвиль ще немає, тож дашборд показує порожній стан. Щоб одразу були результати й динаміка:

```bash
cd backend
python scripts/demo_wave.py --title "Хвиля 1 (травень)"
python scripts/demo_wave.py --title "Хвиля 2 (листопад)" --shift 1
```

Або пройти все руками: admin створює й відкриває хвилю (Керування), учасники проходять анкети (Мої опитування), робоча група вносить чек-лист, commissioner його підтверджує, admin закриває хвилю.

Демо-логіни (пароль у всіх DEMO_PASSWORD):

| Логін | Роль | Що бачить |
|---|---|---|
| `admin` | адміністратор | огляд, розклад, звіт, керування (хвилі, люди, підрозділи, факти), журнал |
| `commissioner` | укладач анкет | огляд, розклад, звіт, конструктор анкет, підтвердження чек-листа |
| `wg1`…`wg6` | учасник, робоча група | Анкета 1, внесення чек-листа, мої результати |
| `staff01`…`staff24` | учасник, особовий склад | Анкета 2, мої результати |
| `expert1`…`expert5` | учасник, експерт | Анкета 3, мої результати |

## Перевірки

```bash
cd backend && pytest              # бекенд: 59 тестів
cd frontend && npm run check           # фронтенд: typecheck, lint, тести, збірка
cd frontend && npm run check:contrast  # контраст кольорів
```

`npm run verify` додатково знімає скріншоти всіх екранів у Playwright. Для цього потрібні запущений бекенд із демо-даними і змінна `DEMO_PASSWORD`.
