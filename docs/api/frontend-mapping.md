# Контракт фронтенду → API бекенду

Джерело правди — бекенд: [`openapi.json`](openapi.json) (`cd backend && python scripts/export_openapi.py`).
Фронтенд — `frontend-proto/` (React + Vite, JSX). Усі запити йдуть через `frontend-proto/src/lib/api.js`:
`boot()` перевіряє `GET /api/v1/config` і вмикає режим з сервером, `api(path, …)` додає `Authorization: Bearer <token>`
(токен у `sessionStorage`) і перетворює помилку бекенду на `ApiErr`; без API сторінка працює на демо-даних.

База: `/api/v1`. Вхід: `POST /auth/session` (JSON), далі `Authorization: Bearer <token>`.

- У розробці Vite проксіює `/api` на `BACKEND_URL` (за замовчуванням `http://127.0.0.1:8000`), у Docker — nginx: один origin, CORS не задіяний.
- **Помилки** `{code, message, hint, detail, errors?, missing_question_ids?, request_id}`; інтерфейс показує `message` і `hint` українською.
- **k одне:** бекенд віддає його в `GET /config` → `min_group_size`; для хвилі — її `min_group_size`.
- **snake_case без перетворень.** Поля як у бекенді; ключі-словники (категорії, коди компонентів) лишаються як є.

Нижче — відповідність операцій першого прототипу інтерфейсу (його пропозиції контракту) маршрутам бекенду; таблиця лишається як довідник маршрутів.

## Відповідність операцій

| Фронтенд (пропозиція) | Бекенд | Примітка |
|---|---|---|
| `POST /session` | `POST /auth/session` | JSON `{login, password}` → `access_token`, `expires_in`, `role`, `user` (є й `POST /auth/login` з form-data) |
| `GET /session` | `GET /auth/session` (= `GET /auth/me`) | роль, категорія, `unit_id` |
| `DELETE /session` | `DELETE /auth/session` | 204; токен відкликається на сервері (`revoked_tokens`), фронтенд теж видаляє його |
| — | `POST /auth/proxy` | вхід через SSO організації, якщо `GET /config` → `auth.proxy` |
| `PUT /demo/role` | — | у демо — вхід під іншим демо-логіном (`docs/run.md`) |
| `GET/POST /questionnaires`, `GET/PATCH /questionnaires/{id}` | ті самі шляхи | |
| `PUT /questionnaires/{id}/questions` | `PUT /questionnaires/{id}/structure` | уся структура розділів, питань і варіантів одним запитом |
| `POST .../publish`, `.../archive` | ті самі | перед публікацією можна `GET .../validate` |
| `POST .../versions` | `POST /questionnaires/{id}/new-version` | |
| `GET/POST /cycles`, `GET /cycles/{id}` | `GET/POST /campaigns`, `GET /campaigns/{id}` | «цикл» = «хвиля» |
| `PATCH /cycles/{id}` | `PATCH /campaigns/{id}` | лише чернетка: назва, підрозділ, анкети, k, `access_mode` |
| `PUT .../assignments` | `PUT /campaigns/{id}/participants`, `POST .../participants/import` | явний склад або CSV псевдонімів; без нього — за категорією й підрозділом |
| `/s/:token` (опитування за посиланням) | `GET /respond/form`, `POST /respond/responses` | токен у заголовку `X-Response-Token`; видача: `POST /campaigns/{id}/tokens`; повтор → 409 `token_used` |
| `POST /cycles/{id}/open`, `/close` | `POST /campaigns/{id}/open`, `/close` | закриття фіксує знімок; результати лише після нього |
| `POST /cycles/{id}/publish` | — | результати доступні одразу після закриття |
| `GET /cycles/{id}/counters` | `GET /campaigns/{id}/progress` | без імен; малі групи `too_few_people: true`; для хвилі за посиланнями «видано / використано» |
| `GET /my/surveys` | `GET /me/assignments` | |
| `GET /my/surveys/{id}` | `GET /campaigns/{cid}/questionnaires/{qid}/form` | без балів варіантів |
| `PUT /my/surveys/{id}/draft` | — | **лише на клієнті** (localStorage): серверна чернетка зв'язала б людину з відповідями |
| `POST /my/surveys/{id}/submit` | `POST /campaigns/{cid}/questionnaires/{qid}/responses` | |
| `GET /units` | `GET /units` | `id`, `name`, `parent_id` |
| `GET /institutions` | `GET /units` (корені дерева) | заклад = кореневий підрозділ |
| `GET /dashboard` | `GET /dashboard` | |
| `GET /index/breakdown` | `GET /campaigns/{id}/results` | `components[].sources`, `rule`, `facts` |
| `GET /compare` | `GET /campaigns/{id}/results` (`questions[].by_category`) і `GET /units/{id}/compare` | категорії й хвилі, не підрозділи |
| `GET /trends` | `GET /units/{id}/history` | з `measures_done` |
| `GET /facts` | `GET /units/{id}/indicators?months=3\|6\|12` | |
| `PUT /facts/{id}/manual` | `POST /indicators` (admin) | ручний ввід = той самий прийом фактів |
| `GET /data-sources` | `GET /integrations/status` (admin) + `GET /methodology` (`facts`) | |
| `GET /checklist`, `PUT .../entry`, `POST .../confirmation` | `GET /campaigns/{id}/checklist`, `PUT .../checklist/{question_id}`, `POST .../confirm` | відкликати: `DELETE .../confirm`; файли: `.../checklist/{question_id}/files` (multipart `file`) |
| `GET /recommendations` | `GET /campaigns/{id}/recommendations` | |
| `POST /recommendations/{id}/decision` | `POST /campaigns/{id}/recommendations/{code}/decision` | |
| `GET /measures`, `PATCH /measures/{id}` | ті самі | + `POST /measures`, `GET /measures/stats`; `overdue_days` є; `verification` — перевірка наступною хвилею |
| `GET /me` | `GET /me/results` | |
| `POST /reports`, `GET /reports/{id}`, `.../export` | `GET /campaigns/{id}/report?format=json\|csv\|xlsx\|docx&template=appendix_g\|brief\|measures\|dynamics`, перелік — `GET /report-templates` | звіт будується на льоту зі знімка; `appendix_g` — крос-таблиці, збіги/розбіжності, висновок, пропозиції за Додатком Г; Word/Excel — посилання на завантаження; PDF — print.css |
| «Що, якщо» (`WhatIf.jsx`) | `POST /campaigns/{id}/what-if` | сценарій «що, якщо»: `baseline` / `scenario` / `delta`, `levers`, `options` для перемикачів і повзунків; див. `docs/backend.md` |
| «Навчання» (`Learn.jsx`), картка в «Мої результати» | `GET /learning/decks`, `GET /learning/decks/{code}`, `POST .../complete`, `GET /learning/stats` | стос карток із перегортанням (Пробіл, стрілки); де людина зупинилась, зберігається лише в браузері; охоплення з порогом k; `training_coverage` приходить у фактах результатів |
| «Питання перевірки» (`Insights.jsx`): повний екран і панель «Підготуватися до перевірки» на «Огляді» та у «Звіті» | `GET /campaigns/{id}/devils-advocate` | лише читання; «До числа» веде за `evidence[].path` на розклад, порівняння чи динаміку; позначка «Відповідь підготовлено» зберігається в браузері |
| «Сигнали» (`Insights.jsx`, `components/NotesPop.jsx`): дзвіночок у шапці й пункти в «Що потребує уваги» | `GET /agent/digest` | окремої вкладки немає; на «Огляді» лише критичні й попередження, до трьох |
| Автопілот (`Autopilot.jsx`): розділ хвилі в «Керуванні циклом» | `GET/PUT /campaigns/{id}/autopilot`, `POST /autopilot/tick`, `GET .../autopilot/report` | змінює лише `admin`; `auditor` читає лише через API, окремого екрана немає; координатор хвиль не бачить |
| «Нормативка» (`Normative.jsx`) | `POST /normative/analyze` (multipart) | документ не зберігається |
| «Перевірки» (`Checks.jsx`) | `GET /checks/mock/{kind}`, `POST /checks/procurement\|declarations`, `GET /checks/runs`, `GET /checks/findings`, `POST .../review`, `POST /checks/publish` | бекенд пускає лише `admin`, координатору екрана немає |
| Сповіщення (`components/NotesPop.jsx`, дзвіночок у шапці) | `GET /me/notifications` | рядки «• …» тіла показуються списком |
| Період фактів у «Порівнянні» | поле `periods` фактів у `GET /campaigns/{id}/results` | показується кварталами («4 кв. 2025 – 3 кв. 2026»): факти рахуються лише цілими завершеними кварталами |
| Детектор відвертості й ознаки підгонки (`Candor.jsx`) на «Огляді» | `GET /campaigns/{id}/candor` | `candor` і `goodhart`; порожні дані — картку не показувати |
| Брифінг і шлях до наступного рівня (`Leadership.jsx`) | `GET /campaigns/{id}/briefing`, `GET /campaigns/{id}/next-level-plan` (`?format=docx`) | Word — лише з сервером |
| Розподіл рівнів дочірніх (`Oversight.jsx`) у «Динаміці» | `GET /units/{id}/children-levels` | без назв; `hidden: true` — лише правило |
| «Перегляди підрозділів» (`Oversight.jsx`) | `GET /admin/result-views` | фільтри дат і людини |
| Рівень, що переважає; стійкість ваг (`IndexExtras.jsx`) | `index.modal_levels` у результатах, `GET /campaigns/{id}/sensitivity` | |
| Якір журналу, лотерея, запити другій людині (`Transparency.jsx`) | `POST /admin/audit-log/anchor`, `GET .../anchors`, `POST .../verify-anchor`; `GET /campaigns/{id}/audit-lottery`; `GET /admin/approvals`, `POST .../approve\|reject` | `export-anchor` у UI немає |
| Урна (`Urn.jsx`) | `GET/PUT/DELETE /campaigns/{id}/urn`, `GET .../urn/my-share`, `POST .../urn/shares` | |
| Квитанції (`Receipts.jsx`, `lib/ballot.js`) | `GET .../questionnaires/{qid}/ballot-key`, `POST .../ballot`, `POST /respond/ballot`, `GET /respond/receipts/{квитанція}` | сліпий підпис рахується в браузері |
| «Що саме ми зберігаємо» (`Privacy.jsx`) | `GET /respond/privacy` | без входу |
| Учасники й відповідальні (`WaveAdmin.jsx`) | `GET/PUT /campaigns/{id}/participants`, `GET /campaigns/{id}/people`, `GET/PUT /campaigns/{id}/checklist/assignments` | |
| Стан Mitra (`Integrations.jsx`) | `GET /integrations/status`, `POST /integrations/theme2/sync` | |
| Люди, підрозділи, довідники, реєстр ризиків, запрошення (`Admin.jsx`) | `/admin/users` (+ `/import`, `/{id}/invite`), `/admin/units`, `/admin/overview`, `/dictionaries/categories\|positions\|facts`, `/units/{id}/risk-register` (+ `/import`), `POST /auth/invite` | |
| Заклади Департаменту (`Department.jsx`) | `GET /department/institutions`, `GET /department/institutions/{unit_id}` | без індексів і рейтингу |
| `GET /audit` | `GET /admin/audit-log` | фільтри й `offset` |
| `POST /audit/verify` | `POST /admin/audit-log/verify` | |
| `GET /methodology` | `GET /methodology` | |
| `PATCH /methodology` | — | методика змінюється лише в коді з новою версією (`methodology.py`), щоб знімки лишались порівнянними |

## Відповіді на питання фронтенду

1. **Анонімність.** Окремі таблиці «хто пройшов» і «що відповіли» без зв'язку, плюс зашифрований буфер: відповіді переносяться
   лише при закритті хвилі, однією транзакцією й у перемішаному порядку, тому навіть системні поля БД не вказують на людину. Є й одноразові посилання (хвиля `access_mode: token`)
   без облікових записів. Деталі: [`docs/anonymity.md`](../anonymity.md).
2. **Вхід.** Логін і пароль, JWT (HS256, 8 годин); або через довірений проксі організації (`POST /auth/proxy`).
3. **Ролі.** `admin`, `coordinator`, `department`, `leader`, `auditor`, `respondent`. Фронтенд: `observer` → `department`,
   `checklist_editor` → респондент категорії `working_group`, `checklist_approver` → `auditor` (`lib/api.js`, `frontRole`).
4. **Ваги питань** — у анкеті (`weight` питання). Ваги джерел і компонентів — у методиці.
5. **Індекс, обмежувач і достовірність рахує бекенд.** Фронтенд лише показує; `lib/scoring` можна лишити для демо.
6. **Хеш методики** — поки лише `version`. **Журнал** — ланцюжок sha256 (`seq`, `prev_hash`, `hash`).
7. **Підрозділи** — дерево `unit` будь-якої глибини. Підрозділ респондента береться з його облікового запису й зберігається
   у відповіді лише як `unit_id` (без людини). Групи, менші за k, і групи, які довелося приховати, щоб малу не можна було
   обчислити різницею, приходять із `null` замість чисел і `suppressed: true` / `too_few_people`.
8. **Факти** — `POST /indicators` з інших систем (ключ на джерело) або вручну адміном; помісячно.

## Що враховує фронтенд

- Прихований стан: замість окремого прапорця бекенд віддає `null` у числах, `sufficient: false`, `suppressed: true` у групі;
  вищий рівень для такої групи — `parent_id` підрозділу.
- Ідентифікатори — UUID; назви полів — `snake_case`.
