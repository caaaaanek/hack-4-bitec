"""Generic post-processing for Markdown produced by tools/pdf2md.py.

- prepends a "> Джерело: <url>" line;
- removes blank lines inside numbered lists;
- --task3: document-specific fixes for zavdannia-3-1811daff.pdf (title, module headings).

Usage: python3 -I tools/fixes/common.py md/doc.md https://source/url.pdf [--task3]
"""
import argparse, re

ap = argparse.ArgumentParser()
ap.add_argument('md')
ap.add_argument('url')
ap.add_argument('--task3', action='store_true')
args = ap.parse_args()

t = open(args.md, encoding='utf-8').read()
if args.task3:
    t = re.sub(r'\A## ЗАВДАННЯ 3\n\n## Integrity Management Dashboard (Цифрова система[^\n]*)',
               r'# Завдання 3. Integrity Management Dashboard\n\n*\1*', t)
    t = re.sub(r'(?m)^\*\*(Assessment Manager|Digital Questionnaire|Evidence Repository \(опційно\)|Integrity Index Engine'
               r'|Executive Dashboard|Comparative Analytics|Recommendations Engine)\*\*$', r'### \1', t)
    t = t.replace('- формування короткого управлінського висновку.\n## ',
                  '- формування короткого управлінського висновку.\n\n## ')
for _ in range(2):
    t = re.sub(r'(?m)^(\d+\. .*)\n\n(?=\d+\. )', r'\1\n', t)
name = args.url.rsplit('/', 1)[-1]
t = f'> Джерело: {args.url} (конвертовано з PDF; оригінал — `{name}`)\n\n' + t
open(args.md, 'w', encoding='utf-8').write(t)
