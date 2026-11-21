# Архітектура і модулі

Додаток до розділу «Як влаштовано» в [`README.md`](../README.md): структура репозиторію й відповідність модулів із умови завдання коду.

## Де лежить логіка висновків

| Що | Файл у `backend/app/services/` |
|---|---|
| Усі ваги й пороги методики | `methodology.py` |
| Розрахунок індексу, правило реальності, достовірність | `scoring.py` |
| Рівень за фактами | `facts.py` |
| Рекомендації | `recommendations.py` |
| Знімки результатів, історія, порівняння | `results.py` |
| Журнал дій з ланцюжком хешів | `audit.py` (у `backend/app/`) |

Усі ваги й пороги можна прочитати через `GET /api/v1/methodology`, а в кожному числі результатів є поле `rule`. Те, що однаковий вхід
дає однаковий результат, перевіряє тест `backend/tests/test_results.py::test_same_input_gives_same_snapshot`.

## Структура

```
hack-4-bitec/
├── backend/                 API: FastAPI + SQLAlchemy 2 + PostgreSQL 16 + Alembic, JWT
│   ├── app/
│   │   ├── routers/         HTTP-маршрути /api/v1, по файлу на модуль (див. таблицю нижче)
│   │   ├── services/        логіка: scoring.py, methodology.py, recommendations.py, facts.py, results.py …
│   │   ├── seed/data/       анкети 1–3, чек-лист (Додатки Б і В) і каталог заходів (Додаток Д) у JSON
│   │   ├── models.py        модель даних; audit.py: журнал дій; security.py: ролі
│   │   └── main.py
│   ├── adapters/            демо-адаптери джерел фактів (синтетичні дані)
│   ├── migrations/          Alembic
│   ├── scripts/             demo_wave.py, smoke.py, gen_docs.py, export_openapi.py
│   └── tests/               pytest (за замовчуванням на SQLite)
├── frontend-proto/          інтерфейс: React + Vite → dist/ → nginx у Docker
├── docs/                    документація (перелік нижче)
├── docker-compose.yml       db + backend + frontend одним docker compose up
└── AGENTS.md                правила роботи з репозиторієм для людей і агентів
```

## Модулі

Модулі з умови завдання і де вони реалізовані. Фронтенд: `frontend-proto` (маршрути `#…`).

| Модуль | Backend | Frontend |
|---|---|---|
| Assessment Manager: хвилі, учасники, підрозділи | `routers/campaigns.py` (зміна чернетки, явні учасники, імпорт CSV псевдонімів, одноразові посилання, QR для зали), `routers/admin.py` | `#manage` хвилі, QR |
| Digital Questionnaire: анкети 1–3, конструктор, версії | `routers/questionnaires.py`, `routers/respond.py` (вхід або анонімно за QR чи посиланням) | `/q/<код>`, `/s/<токен>`, `#survey`, `#surveys` |
| Evidence Repository: чек-лист, файли-докази з sha256 | `routers/checklist.py`, `services/evidence.py` | `#checklist` з файлами |
| Integrity Index Engine: детермінований розрахунок | `services/scoring.py`, `services/methodology.py`, `routers/results.py` | `#explain` розклад індексу |
| Executive Dashboard: один екран | `GET /dashboard` | `#overview` |
| Comparative Analytics: РГ / ОС / експерти / факти, динаміка | `routers/results.py` (history, compare), `routers/indicators.py` (факти, сигнали ризику) | `#compare`, `#trends`, `#institutions` |
| Recommendations Engine: явні правила | `services/recommendations.py`, `routers/recommendations.py`, каталог з Додатку Д | `#recs`, `#whatif` «Що, якщо» |
| Recommendations Tracker: відповідальний, строк, статус | `routers/measures.py`, синхронізація з темою 2 (`routers/integrations.py`) | `#tracker` |
| Audit Trail: журнал дій | `audit.py` (ланцюжок хешів), `GET /admin/audit-log`, `POST /admin/audit-log/verify`; якір назовні (файл WORM / мітка часу RFC 3161, `services/audit_anchor.py`); перегляди чужих підрозділів: `GET /admin/result-views` | `#audit` з перевіркою; якір і перегляди: API |
| Reporting Module | `GET /campaigns/{id}/report?format=json\|csv\|xlsx\|docx` | `#report` |
| Кабінет учасника: узагальнені результати свого підрозділу | `GET /me/results`, за посиланням `GET /respond/results` | `#me`, `/s/<токен>` після закриття |
| Інтеграція з іншими системами | `POST /indicators` (ключ на джерело), вхід через проксі організації (`POST /auth/proxy`), `ROOT_PATH` | `#sources` джерела фактів |
| «Адвокат диявола»: питання аудитора до хвилі за правилами | `GET /campaigns/{id}/devils-advocate` | `#advocate` «Питання перевірки» |
| Агент-черговий: що впало, чому, як виправити | `GET /agent/digest` | дзвіночок у шапці й «Що потребує уваги» |
| Аналіз нормативки: які пункти зачіпає новий наказ | `POST /normative/analyze` (локальний пошук, без моделей) | `#normative` «Нормативка» |
| Автопілот хвилі: відкриття, нагадування всім, закриття, звіт | `PUT /campaigns/{id}/autopilot`, `POST /autopilot/tick`, `GET /me/notifications` | розділ у «Керуванні циклом», дзвіночок |
| Флешкартки доброчесності: джерело охоплення навчанням | `/learning/*` | `#learn` «Навчання» |
| Детектор відвертості: непрямі питання й «дзеркало», картка «Що люди бояться сказати прямо» | `services/candor.py`, `GET /campaigns/{id}/candor`, `candor_card` у `GET /dashboard` | API (у формі анкети непряме питання приходить як вибір «0…N») |
| Урна з трьома ключами: відповіді розшифрують лише двоє з трьох власників | `services/urn.py`, `routers/urn.py` | API |
| Квитанції: жетон зі сліпим підписом, перевірка «моя відповідь урахована» | `services/ballots.py`, `/campaigns/{id}/questionnaires/{qid}/ballot`, `/respond/ballot`, `/respond/receipts/{квитанція}` | API |
| Детектор Гудхарта, лотерея перевірок, шлях до наступного рівня, брифінг, стійкість ваг | `services/goodhart.py`, `services/planning.py`, `routers/insights_plus.py` | API |
| Довідники (категорії, посади, факти з власниками джерел), Департамент, реєстр ризиків, принцип двох осіб, запрошення | `routers/dictionaries.py`, `routers/department.py`, `routers/risks.py`, `services/approvals.py`, `services/invites.py` | API |
| Профіль безпеки: `SECURITY_PROFILE=production` вмикає всі запобіжники разом | `config.py` (`PRODUCTION_PROFILE`), `GET /config` → `policies` | попередження адміну: API |
| Асистент (опційно, вимкнено) | `POST /assistant/ask`, `/api/assistant` (OpenAI-сумісний, `LLM_*`) | кнопка «Асистент» |
