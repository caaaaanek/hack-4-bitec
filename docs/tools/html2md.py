"""HTML page (WordPress/Oxygen, e.g. hack.bitec.com.ua) -> Markdown or plain text.

Stdlib only. Extracts the article body between --start and --end markers
(defaults fit hack.bitec.com.ua: from the first <h1 class="wp-block-heading">
to the footer <section id="section-2-98">), so menus/footer/styles are dropped.

Usage:
  python3 -I tools/html2md.py raw/page.html md  --url https://... > md/page.md
  python3 -I tools/html2md.py raw/page.html txt --url https://... > md/page.txt
"""
import argparse, re, sys
from html.parser import HTMLParser
from urllib.parse import urljoin

ap = argparse.ArgumentParser()
ap.add_argument('src')
ap.add_argument('mode', choices=['md', 'txt'])
ap.add_argument('--url', required=True, help='original page URL (relative links are resolved against it)')
ap.add_argument('--start', default='<h1 class="wp-block-heading">')
ap.add_argument('--end', default='<section id="section-2-98"')
args = ap.parse_args()
MD = args.mode == 'md'

html = open(args.src, encoding='utf-8').read()
body = html[html.index(args.start):]
if args.end in body:
    body = body[:body.index(args.end)]


class P(HTMLParser):
    def __init__(s):
        super().__init__(convert_charrefs=True)
        s.out, s.buf, s.lists, s.href = [], '', [], None

    def flush(s, prefix=''):
        t = re.sub(r'\s+', ' ', s.buf).strip()
        if t:
            s.out.append(prefix + t)
        s.buf = ''

    def handle_starttag(s, tag, a):
        a = dict(a)
        if tag in ('h1', 'h2', 'h3', 'h4', 'p'):
            s.flush()
        elif tag == 'li':
            s.flush(); s.lists[-1][1] += 1
        elif tag in ('ul', 'ol'):
            s.flush(); s.lists.append([tag, 0])
        elif tag in ('strong', 'b') and MD:
            s.buf += '**'
        elif tag in ('em', 'i') and MD:
            s.buf += '*'
        elif tag == 'code' and MD:
            s.buf += '`'
        elif tag == 'a':
            s.href = urljoin(args.url, a.get('href') or '')
            s.buf += '\0'
        elif tag == 'br':
            s.buf += ' '

    def handle_endtag(s, tag):
        if tag in ('h1', 'h2', 'h3', 'h4'):
            n = int(tag[1])
            s.flush(('#' * n + ' ') if MD else '')
            if not MD and s.out:
                s.out[-1] += '\n' + ('=' if n == 1 else '-') * min(len(s.out[-1]), 80)
            s.out.append('')
        elif tag in ('p', 'div'):
            s.flush()
            if not s.lists:
                s.out.append('')
        elif tag == 'li':
            kind, cnt = s.lists[-1]
            ind = '  ' * (len(s.lists) - 1)
            mark = f'{cnt}. ' if kind == 'ol' else ('- ' if MD else '• ')
            s.flush(ind + mark)
        elif tag in ('ul', 'ol'):
            s.flush(); s.lists.pop()
            if not s.lists:
                s.out.append('')
        elif tag in ('strong', 'b') and MD:
            s.buf += '**'
        elif tag in ('em', 'i') and MD:
            s.buf += '*'
        elif tag == 'code' and MD:
            s.buf += '`'
        elif tag == 'a' and '\0' in s.buf:
            i = s.buf.rindex('\0')
            txt, h = s.buf[i + 1:], s.href or ''
            if MD:
                rep = f'[{txt.strip()}]({h})'
            else:
                rep = txt if (not h or h.replace('mailto:', '') == txt.strip()) else f'{txt} ({h})'
            s.buf = s.buf[:i] + rep
            s.href = None

    def handle_data(s, d):
        s.buf += d


p = P()
p.feed(body)
p.flush()
txt = re.sub(r'\n{3,}', '\n\n', '\n'.join(p.out)).strip() + '\n'
if MD:
    sys.stdout.write(txt + f'\n---\n\nДжерело: <{args.url}>\n')
else:
    sys.stdout.write(f'Джерело: {args.url}\n\n' + txt)
