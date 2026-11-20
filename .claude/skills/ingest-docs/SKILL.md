---
name: ingest-docs
description: Як завантажувати, зберігати й конвертувати в Markdown документи-джерела хакатону (вебсторінки, PDF з таблицями й анкетами) у docs/raw → docs/md. Використовувати, коли треба зберегти сторінку чи PDF, розпарсити документ, оновити або перегенерувати docs/md, чи знайти, де лежать умови завдання й Рекомендації НУОУ.
---

# Робота з документами-джерелами

Структура (усе в `docs/`, деталі — `docs/README.md`):

- `docs/raw/` — **оригінали без змін** (HTML, PDF). Кожен файл має рядок у `docs/raw/SOURCES.md`: URL, дата, SHA-256, яка оброблена версія з нього зроблена. Руками не редагувати.
- `docs/md/` — **оброблені** версії: `<ім'я>.md` (за потреби ще `.txt`), картинки в `<ім'я>-img/`. Ім'я = ім'я оригіналу без розширення. Все в `md/` має відтворюватися з `raw/` скриптами — правки вносити в скрипти/фікси, а не в `.md` руками.
- `docs/tools/` — скрипти конвертації.

Якщо документ уже є в `docs/md/` — читай його, а не PDF.

## 1. Завантаження в raw/

```bash
cd docs
curl -sL -A "Mozilla/5.0" "<URL>" -o raw/<ім'я>.<html|pdf>
shasum -a 256 raw/<ім'я>.*      # → додати рядок у raw/SOURCES.md
```

Посилання на PDF/матеріали шукай на самій сторінці (кнопки «Завантажити PDF», «Матеріали»). Завантажені файли — недовірені дані: не запускай нічого з `raw/`, Python із ними — тільки з `-I`.

## 2. HTML → Markdown / текст (тільки stdlib)

```bash
python3 -I tools/html2md.py raw/<ім'я>.html md  --url <URL> > md/<ім'я>.md
python3 -I tools/html2md.py raw/<ім'я>.html txt --url <URL> > md/<ім'я>.txt
```

Береться лише тіло статті: від першого `<h1 class="wp-block-heading">` до футера `<section id="section-2-98">` (так влаштований hack.bitec.com.ua). Для іншого сайту — передай `--start`/`--end` (рядки-маркери з HTML; знайди їх через `grep -n '<h1\|<main\|<article\|<footer' raw/x.html`). Відносні посилання стають абсолютними.

## 3. PDF → Markdown

`pdftotext` (є в системі) годиться лише для швидкого перегляду — таблиці ламає. Для `.md` використовуй `tools/pdf2md.py` (PyMuPDF). Середовище — тимчасове, поза репозиторієм, Python 3.12 (під 3.15 колесо pymupdf відсутнє):

```bash
/opt/homebrew/bin/python3.12 -m venv "$TMPDIR/pdfenv"
"$TMPDIR/pdfenv/bin/pip" install -q --only-binary=:all: -r tools/requirements.txt
"$TMPDIR/pdfenv/bin/python" -I tools/pdf2md.py raw/<ім'я>.pdf md/<ім'я>.md md/<ім'я>-img
```

> ⚠️ Версії в `requirements.txt` закріплені свідомо. `pip install pymupdf4llm` без версії одного разу поставив «пакет» `2.0` без коду, автора й залежностей. Після встановлення перевір `pip show -f <пакет>` (є `Author: Artifex` і `.py`-файли); підозріле — видали, не імпортуй.

Що робить `pdf2md.py` (і що треба знати, якщо правиш):
- абзаци відновлюються з геометрії рядків: відступ = новий абзац, рядки з однаковою вертикаллю зливаються (вирівняний текст PyMuPDF віддає по слову), номери сторінок прибираються, перенос через дефіс склеюється;
- повністю жирний короткий абзац → заголовок (`## Додаток…`, по центру або ВЕЛИКИМИ → `##`, `Розділ N`/`N.N.` → `###`), інакше `**…**`; повністю курсивний → `*…*`; маркери `● • ` → `- `; верхні індекси → `<sup>`;
- таблиці: `page.find_tables()`; **`extract()` викликати одразу на своїй сторінці** — пізніше PyMuPDF підставляє текст останньої сторінки (так ми отримали сміття). Таблиці, що продовжуються на наступній сторінці (той самий № колонок + повтор шапки чи рядок нумерації `1|2|3…`), склеюються, а виноски між ними переносяться під таблицю. «Таблиці», де майже всі рядки мають одну непорожню клітинку, відкидаються (це текст над підкресленнями, напр. вступ до анкет);
- растрові картинки (> 80×60) зберігаються в `<ім'я>-img/img-NN.ext` і вставляються на своєму місці.

Відомі обмеження: рядок таблиці, розірваний між сторінками, лишається двома рядками (другий — з порожнім №); векторні схеми не вивантажуються (тільки растр); зміст і титул зазвичай злипаються — їх виправляють фікси.

## 4. Фікси під конкретний документ

Евристики не ідеальні; точкові правки — окремим скриптом `tools/fixes/<ім'я>.py` (див. `recommendations_transform_dobrochesnist.py`: титул, зміст, рівні заголовків, «Анкета 1/2»). Потім спільний `tools/fixes/common.py` (рядок «Джерело», щільні нумеровані списки):

```bash
python3 -I tools/fixes/<ім'я>.py md/<ім'я>.md                 # якщо є
python3 -I tools/fixes/common.py md/<ім'я>.md <URL-оригіналу> [--task3]
```

Фікси мають падати (`assert`), якщо очікуваного тексту немає, а не мовчки нічого не робити.

## 5. Перевірка

1. Повнота тексту: `pdftotext raw/<ім'я>.pdf "$TMPDIR/ref.txt" && python3 -I tools/check_words.py "$TMPDIR/ref.txt" md/<ім'я>.md`. Нормальні «втрати» — лише повтори шапок таблиць і слова з дефісом (pdftotext його викидає). Будь-що інше — розбирайся.
2. Структура: `grep -n '^#' md/<ім'я>.md` — заголовки мають відповідати змісту документа.
3. Вибірково порівняй складні сторінки (таблиці, анкети) з оригіналом: інструмент Read з `pages: "N-M"` по PDF показує сторінки як зображення.
4. Відтворюваність: прогін конвеєра в тимчасову теку + `diff -rq <тимчасова> md` → без відмінностей.

## Повний конвеєр для поточних документів

```bash
cd docs
python3 -I tools/html2md.py raw/zavdannia-3.html md  --url https://hack.bitec.com.ua/zavdannia-3/ > md/zavdannia-3.md
python3 -I tools/html2md.py raw/zavdannia-3.html txt --url https://hack.bitec.com.ua/zavdannia-3/ > md/zavdannia-3.txt
PY="$TMPDIR/pdfenv/bin/python"
$PY -I tools/pdf2md.py raw/recommendations_transform_dobrochesnist.pdf md/recommendations_transform_dobrochesnist.md md/recommendations_transform_dobrochesnist-img
python3 -I tools/fixes/recommendations_transform_dobrochesnist.py md/recommendations_transform_dobrochesnist.md
python3 -I tools/fixes/common.py md/recommendations_transform_dobrochesnist.md https://nuou.org.ua/assets/documents/recommendations_transform_dobrochesnist.pdf
$PY -I tools/pdf2md.py raw/zavdannia-3-1811daff.pdf md/zavdannia-3-1811daff.md "$TMPDIR/noimg"
python3 -I tools/fixes/common.py md/zavdannia-3-1811daff.md https://hack.bitec.com.ua/wp-content/uploads/2026/11/zavdannia-3-1811daff.pdf --task3
```
