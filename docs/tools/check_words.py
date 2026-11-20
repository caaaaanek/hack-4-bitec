"""Word-level completeness check: words (>=3 letters) present in the reference text but missing in the Markdown.

Usage: pdftotext raw/doc.pdf /tmp/doc.txt && python3 -I tools/check_words.py /tmp/doc.txt md/doc.md
Expected misses: repeated table headers and hyphenated words (pdftotext drops the hyphen).
"""
import sys, re, collections
def words(t):
    t = t.replace('\\*', ' ').replace('<br>', ' ')
    return collections.Counter(w.lower() for w in re.findall(r'[А-Яа-яІіЇїЄєҐґ’\']{3,}', t))
a = words(open(sys.argv[1]).read()); b = words(open(sys.argv[2]).read())
miss = a - b
print('pdf words', sum(a.values()), 'md words', sum(b.values()), 'missing', sum(miss.values()))
print(miss.most_common(40))
