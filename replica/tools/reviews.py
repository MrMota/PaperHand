#!/usr/bin/env python3
"""Rank user feedback into themes (stdlib only).

  python3 reviews.py replica/reviews.csv --out replica/feedback.md [--themes themes.json]

Rows without a URL are dropped. Weight = rating weight (1★ 3, 2★ 2.5, 3★ 2, 4★ 1, 5★ .5, n/a 1.5)
x recency (last 90 days 1, last year .8, last 3 years .5, older .25). A theme with fewer than 3
reviews or a single source is marked THIN.
"""
import csv, json, os, re, sys
from collections import defaultdict
from datetime import date

RW = {'1': 3, '2': 2.5, '3': 2, '4': 1, '5': .5}

def recency(d, today):
    try: y, m, dd = map(int, d[:10].split('-')); age = (today - date(y, m, dd)).days
    except Exception: return .5
    return 1 if age <= 90 else .8 if age <= 365 else .5 if age <= 1095 else .25

def main(a):
    if not a or a[0] in ('-h', '--help'): print(__doc__); return 2
    out = a[a.index('--out') + 1] if '--out' in a else None
    tpath = a[a.index('--themes') + 1] if '--themes' in a else os.path.join(os.path.dirname(os.path.abspath(__file__)), 'themes.json')
    themes = {k: v for k, v in json.load(open(tpath)).items() if not k.startswith('_')}
    rx = {k: [re.compile(p, re.I) for p in v['patterns']] for k, v in themes.items()}
    rows = [r for r in csv.DictReader(open(a[0], newline='')) if r.get('url', '').strip().startswith('http')]
    dropped = sum(1 for _ in csv.DictReader(open(a[0], newline=''))) - len(rows)
    today = max((date.fromisoformat(r['date'][:10]) for r in rows if re.match(r'\d{4}-\d\d-\d\d', r['date'])), default=date.today())
    hits = defaultdict(list); unmatched = []
    for r in rows:
        w = RW.get(r['rating'].strip(), 1.5) * recency(r['date'], today)
        m = [k for k in themes if any(p.search(r['text']) for p in rx[k])]
        for k in m: hits[k].append((w, r))
        if not m and r['rating'] in ('1', '2', '3'): unmatched.append(r)
    sources = sorted({r['source'] for r in rows})
    L = [f'# User feedback, ranked', '',
         f'{len(rows)} items from {len(sources)} source(s): ' + ', '.join(f"{s} ({sum(r['source'] == s for r in rows)})" for s in sources) + (f'. {dropped} rows dropped for missing URLs.' if dropped else '.'),
         'Ratings: ' + ', '.join(f"{k}★ {sum(r['rating'] == k for r in rows)}" for k in '12345') + f", unrated {sum(r['rating'] not in RW for r in rows)}.",
         'Score = sum of weights (low ratings and recent items count more). Quotes are verbatim; long ones are cut and marked […].', '']
    order = sorted(themes, key=lambda k: -sum(w for w, _ in hits[k]))
    for kind, title in (('hate', 'What they hate'), ('missing', 'What is missing'), ('unsolved', 'What is unsolved')):
        L += [f'## {title}', '', '| theme | score | items | low-rated (1–3★) | sources | evidence |', '| --- | --- | --- | --- | --- | --- |']
        for k in [k for k in order if themes[k]['kind'] == kind]:
            h = hits[k]; srcs = {r['source'] for _, r in h}; low = sum(r['rating'] in ('1', '2', '3') for _, r in h)
            thin = 'THIN' if len(h) < 3 or len(srcs) < 2 else 'ok'
            L.append(f"| {k} | {sum(w for w, _ in h):.1f} | {len(h)} | {low} | {len(srcs)} | {thin} |")
        L.append('')
    L += ['## Top quotes per theme', '']
    for k in order:
        h = sorted(hits[k], key=lambda x: -x[0])[:6]
        if not h: continue
        L += [f'### {k}', '']
        for w, r in h: L.append(f"- {r['rating']}{'★' if r['rating'] in RW else ''} · {r['date']} · [{r['source']}]({r['url']}) — “{r['text']}”")
        L.append('')
    L += ['## Low ratings that matched no theme (read these by hand)', '']
    for r in unmatched: L.append(f"- {r['rating']}★ · {r['date']} · [{r['source']}]({r['url']}) — “{r['text']}”")
    text = '\n'.join(L) + '\n'
    if out: open(out, 'w').write(text); print(f'wrote {out}: {len(rows)} items, {len(unmatched)} unmatched low ratings')
    else: print(text)
    return 0

if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
