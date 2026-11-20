"""PDF -> Markdown with PyMuPDF.

Paragraphs are rebuilt from line geometry (indent = new paragraph, justified
word-per-line runs merged, page numbers dropped); tables come from
page.find_tables(), are glued across page breaks (repeated header / "1|2|3"
numbering row removed, footnotes moved below); raster images are saved to imgdir.

Usage: python -I tools/pdf2md.py raw/doc.pdf md/doc.md md/doc-img
"""
import sys, re, os, pymupdf

src, out, imgdir = sys.argv[1], sys.argv[2], sys.argv[3]
doc = pymupdf.open(src)
os.makedirs(imgdir, exist_ok=True)
BULLET = re.compile(r'^\s*[●•▪◦·]\s*')

def clean(t):
    return t.replace('*', '\\*').replace('\uf06f', '☐').replace('\uf0a8', '☐').replace('\xad', '').replace('​', '')

def fmt_spans(spans):
    """Inline markup: bold spans -> **x**; italics kept only if the whole run is italic (handled by caller)."""
    parts = []
    for s in spans:
        t = clean(s['text'])
        if s['flags'] & 1 and re.fullmatch(r'\s*[\d*]+\s*', t):
            parts.append(f'<sup>{t.strip()}</sup>')
        elif s['flags'] & 16 and t.strip():
            lead, core, trail = re.match(r'^(\s*)(.*?)(\s*)$', t, re.S).groups()
            parts.append(f'{lead}**{core}**{trail}')
        else:
            parts.append(t)
    s = ''.join(parts)
    return re.sub(r'\*\*(\s*)\*\*', r'\1', s)

def page_lines(page, exclude):
    rows = []
    for b in page.get_text('dict')['blocks']:
        if b['type']: continue
        for l in b['lines']:
            x0, y0, x1, y1 = l['bbox']
            cy = (y0 + y1) / 2
            if any(r[0]-1 <= (x0+x1)/2 <= r[2]+1 and r[1]-1 <= cy <= r[3]+1 for r in exclude): continue
            spans = [s for s in l['spans']]
            if not ''.join(s['text'] for s in spans).strip(): continue
            rows.append([x0, y0, x1, y1, spans])
    rows.sort(key=lambda r: ((r[1] + r[3]) / 2, r[0]))
    rows.sort(key=lambda r: (round((r[1] + r[3]) / 2 / 4), r[0]))
    merged = []
    for r in rows:  # justified text is split into one "line" per word: merge same baseline
        if merged and abs((merged[-1][1] + merged[-1][3]) / 2 - (r[1] + r[3]) / 2) < 4 and r[0] >= merged[-1][2] - 2:
            m = merged[-1]
            m[4] = m[4] + [{'text': ' ', 'flags': 0, 'size': r[4][0]['size']}] + r[4]
            m[2] = r[2]; m[3] = max(m[3], r[3])
        else:
            merged.append(r)
    # a lone bullet glyph sits on its own slightly offset line: attach it to the text it marks
    out = []
    for r in merged:
        txt = ''.join(s['text'] for s in r[4]).strip()
        if BULLET.fullmatch(txt + ' ') or txt in ('●', '•', '\uf0b7', '\uf02d', '-'):
            cy = (r[1] + r[3]) / 2
            cands = [m for m in merged if m is not r and m[0] > r[2] - 2 and abs((m[1] + m[3]) / 2 - cy) < 8]
            if cands:
                tgt = min(cands, key=lambda m: m[0])
                tgt[4] = [{'text': '● ', 'flags': 0, 'size': tgt[4][0]['size']}] + tgt[4]
                tgt[0] = r[0]
                continue
        out.append(r)
    return out

def line_info(r, left, right):
    spans = r[4]
    text = clean(''.join(s['text'] for s in spans)).strip()
    vis = [s for s in spans if s['text'].strip()]
    bold = all(s['flags'] & 16 for s in vis)
    ital = all(s['flags'] & 2 for s in vis) and not bold
    size = max(s['size'] for s in vis)
    x0, x1 = r[0], r[2]
    width = right - left
    if abs(x0 - left) < 6: pos = 'left'
    elif x0 - left > 12 and x0 - left < 60 and x1 > right - 40: pos = 'indent'
    elif x0 - left > 12 and x0 - left < 60: pos = 'indent_short'
    elif abs((x0 + x1) / 2 - (left + right) / 2) < 25: pos = 'center'
    elif x1 > right - 15: pos = 'right'
    else: pos = 'indent_short'
    return dict(text=text, md=fmt_spans(spans).strip(), bold=bold, ital=ital, size=size, pos=pos,
                y0=r[1], y1=r[3], x0=x0, bullet=bool(BULLET.match(text)))

def cell_text(c):
    if c is None: return ''
    c = clean(c).replace('\uf02d', '\n- ').strip()
    lines = [l.strip() for l in c.split('\n') if l.strip()]
    outl = []
    for l in lines:
        if outl and re.search(r'[A-Za-zА-Яа-яІіЇїЄєҐґ]-$', outl[-1]) and re.match(r'[a-zа-яіїєґ]', l):
            outl[-1] += l
        elif outl and not (re.match(r'^([-–—●•]|\d+[.)]\s|\d+\.\d+\.?\s|[а-яa-z]\)\s)', l)):
            outl[-1] += ' ' + l
        else:
            outl.append(l)
    s = '<br>'.join(re.sub(r'\s+', ' ', x) for x in outl)
    return s.replace('|', '\\|')

def is_num_header(row):
    vals = [cell_text(c) for c in row]
    return all(re.fullmatch(r'\d{1,2}', v) for v in vals if v) and sum(bool(v) for v in vals) >= 2

items = []  # (kind, payload)
for pno, page in enumerate(doc):
    W = page.rect.width
    tabs = []
    for t in page.find_tables().tables:
        rows = t.extract()
        multi = sum(1 for r in rows if sum(bool((c or '').strip()) for c in r) >= 2)
        if len(rows[0]) < 2 or multi < max(1, len(rows) * 0.3): continue  # text grid, not a real table
        tabs.append((t.bbox, rows))
    tboxes = [b for b, _ in tabs]
    lines = page_lines(page, tboxes)
    # drop running page number (top, digits only)
    lines = [r for r in lines if not (r[1] < 55 and re.fullmatch(r'\s*\d+\s*', ''.join(s['text'] for s in r[4])))]
    xs = sorted(round(r[0]) for r in lines)
    freq = [v for v in xs if sum(abs(x - v) < 3 for x in xs) >= 3]
    left = min(freq) if freq else (min(xs) if xs else 70)
    right = max((r[2] for r in lines), default=W - 25)
    right = max(right, W - 30)
    elems = [('line', r[1], line_info(r, left, right)) for r in lines]
    elems += [('table', b[1], rows) for b, rows in tabs]
    for b in page.get_text('dict')['blocks']:
        if b['type'] == 1 and (b['bbox'][2]-b['bbox'][0]) > 80 and (b['bbox'][3]-b['bbox'][1]) > 60:
            elems.append(('image', b['bbox'][1], b))
    elems.sort(key=lambda e: e[1])
    items.append(('page', pno + 1))
    for kind, _, e in elems:
        items.append((kind, e))

# ---- assemble
md, para, prev = [], None, None
img_n = 0
def flush():
    global para, last_table
    if para:
        joined = ''
        for part in para['parts']:
            part = part.strip()
            if joined and re.search(r'[A-Za-zА-Яа-яІіЇїЄєҐґ]-$', joined) and re.match(r'[a-zа-яіїєґ]', part):
                joined += part
            else:
                joined += (' ' if joined else '') + part
        t = re.sub(r'\s+', ' ', joined).strip()
        t = re.sub(r'\*\*\s*\*\*', ' ', t)
        t = re.sub(r'\*\*(\S[^*]*?)\*\*\s+\*\*(\S[^*]*?)\*\*', r'**\1 \2**', t)
        plain = re.sub(r'\*\*', '', t)
        if para['bold'] and len(plain) < 200:
            if re.match(r'^(Додаток|ДОДАТКИ|ДОДАТОК)', plain): t = '## ' + plain
            elif para['pos'] in ('center',) or plain.isupper(): t = '## ' + plain
            elif re.match(r'^Розділ \d', plain) or re.match(r'^\d+\.\d+\.\s', plain): t = '### ' + plain
            else: t = '**' + plain + '**'
        elif para['ital'] and not t.startswith('*'):
            t = '*' + plain.strip() + '*'
        elif para['bullet']:
            t = '- ' + BULLET.sub('', t)
        md.append(t); md.append('')
        if last_table is not None and para['size'] > 10.5:
            last_table = None
    para = None

last_table = None
for kind, e in items:
    if kind == 'page':
        if para and (para['bold'] or para['pos'] == 'center'): flush()
        continue
    if kind == 'image':
        flush()
        img_n += 1
        ext = e.get('ext', 'png')
        name = f'img-{img_n:02d}.{ext}'
        open(os.path.join(imgdir, name), 'wb').write(e['image'])
        md.append(f'![]({os.path.relpath(os.path.join(imgdir, name), os.path.dirname(os.path.abspath(out)))})'); md.append('')
        last_table = None
        continue
    if kind == 'table':
        flush()
        rows = list(e)
        deferred = []
        cont = (rows and last_table is not None and len(rows[0]) == last_table['ncol']
                and (is_num_header(rows[0]) or [cell_text(c) for c in rows[0]] == last_table['hdr']))
        if cont:
            deferred = md[last_table['end']:]
            del md[last_table['end']:]
            md.append('')
        if cont:
            if is_num_header(rows[0]) or [cell_text(c) for c in rows[0]] == last_table['hdr']: rows = rows[1:]
            if rows and is_num_header(rows[0]): rows = rows[1:]
            md.pop()  # glue to previous table
            hdr = last_table['hdr']
        else:
            hdr, rows = [cell_text(c) for c in rows[0]], rows[1:]
            md.append('| ' + ' | '.join(hdr) + ' |')
            md.append('|' + '---|' * len(hdr))
            if rows and is_num_header(rows[0]): rows = rows[1:]
        for r in rows:
            md.append('| ' + ' | '.join(cell_text(c) for c in r) + ' |')
        md.append('')
        last_table = {'ncol': len(e[0]), 'hdr': hdr, 'end': len(md)}
        md.extend(deferred)
        continue
    L = e
    starts_new = (
        para is None or L['bullet'] or L['pos'] in ('indent', 'indent_short', 'center', 'right')
        or (L['bold'] != para['bold'] and L['pos'] != 'left') or (L['y0'] - para['y1'] > 0.9 * (L['y1'] - L['y0']))
        or para['pos'] in ('right',)
    )
    if para is not None and L['pos'] == 'center' and para['pos'] == 'center' and L['bold'] == para['bold'] and L['y0'] - para['y1'] < 10:
        starts_new = False
    if para is not None and L['bold'] and para['bold'] and L['pos'] != 'left' and para['pos'] != 'left' and L['y0'] - para['y1'] < 12 and not L['text'].startswith('Додаток') and not para['parts'][-1].strip('* ').startswith('Додаток'):
        starts_new = False
    if para is not None and L['pos'] == 'left' and para['pos'] != 'center' and L['y0'] < para['y1'] + 0.9*(L['y1']-L['y0']):
        starts_new = False
    # paragraph continuing from previous page (same style, previous ended without terminal punctuation)
    if para is not None and L['pos'] == 'left' and L['y0'] < 90 and para['y1'] > 450 and not re.search(r'[.:;!?]$', para['parts'][-1].strip()):
        starts_new = False
    caps = lambda x: (lambda letters: len(letters) > 3 and letters.isupper())(re.sub(r'[^A-Za-zА-Яа-яІіЇїЄєҐґ]', '', x))
    if para is not None and L['bold'] and (caps(L['text']) or para.get('caps')):
        starts_new = True
    if starts_new:
        flush()
        para = dict(parts=[], size=L['size'], bold=L['bold'], ital=L['ital'], pos=L['pos'], bullet=L['bullet'], y1=L['y1'])
    para['parts'].append(L['md'])
    para['caps'] = L['bold'] and caps(L['text'])
    para['ital'] = para['ital'] and L['ital']
    para['bold'] = para['bold'] and L['bold']
    para['y1'] = L['y1']; para['size'] = max(para['size'], L['size'])
flush()
txt = '\n'.join(md)
txt = re.sub(r'\n{3,}', '\n\n', txt).strip() + '\n'
txt = re.sub(r'(?m)^(- .*)\n\n(?=- )', r'\1\n', txt)
txt = re.sub(r'(?m)^(- .*)\n\n(?=- )', r'\1\n', txt)
open(out, 'w', encoding='utf-8').write(txt)
print('images:', img_n)
