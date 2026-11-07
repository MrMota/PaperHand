#!/usr/bin/env python3
"""Feature parity score from replica/features.csv (stdlib only).

Weights: must 3, should 2, could 1. partial counts half. Rows with priority
'skip' or where the original does not have the feature are left out.
  python3 parity.py replica/features.csv [--visual diffs/*.json] [--markdown]
"""
import csv, json, sys
from collections import defaultdict

W = {'must': 3, 'should': 2, 'could': 1}
VAL = {'yes': 1.0, 'partial': 0.5, 'no': 0.0}

def main(argv):
    if not argv or argv[0] in ('-h', '--help'):
        print(__doc__); return 0
    path, md, visual = argv[0], '--markdown' in argv, []
    if '--visual' in argv:
        visual = [a for a in argv[argv.index('--visual') + 1:] if not a.startswith('--')]
    rows = list(csv.DictReader(open(path, newline='')))
    scored, skipped, extra, bad = [], [], [], []
    for r in rows:
        pr, cl = r['priority'].strip().lower(), r['clone'].strip().lower()
        if pr == 'skip' or cl == 'skip': skipped.append(r); continue
        if r['original'].strip().lower() not in ('yes', 'partial'): extra.append(r); continue
        if pr not in W or cl not in VAL: bad.append(r); continue
        scored.append(r)
    tot = sum(W[r['priority']] for r in scored)
    got = sum(W[r['priority']] * VAL[r['clone']] for r in scored)
    score = 100 * got / tot if tot else 0
    must = [r for r in scored if r['priority'] == 'must']
    must_done = sum(r['clone'] == 'yes' for r in must)
    areas = defaultdict(lambda: [0.0, 0])
    for r in scored:
        areas[r['area']][0] += W[r['priority']] * VAL[r['clone']]; areas[r['area']][1] += W[r['priority']]
    area_scores = sorted(((a, 100 * g / t) for a, (g, t) in areas.items()), key=lambda x: (x[1], x[0]))
    order = {'must': 0, 'should': 1, 'could': 2}
    missing = sorted([r for r in scored if r['clone'] != 'yes'], key=lambda r: (order[r['priority']], VAL[r['clone']], r['area']))
    vis = []
    for f in visual:
        try: vis.append(json.load(open(f)))
        except Exception as e: print(f'warning: {f}: {e}', file=sys.stderr)
    layout = sum(v['score'] for v in vis) / len(vis) if vis else None
    shippable = must_done == len(must) and score >= 80
    out = []
    p = out.append
    h = (lambda t: p(f'\n## {t}\n')) if md else (lambda t: p(f'\n{t}\n' + '-' * len(t)))
    p('# Feature parity' if md else 'FEATURE PARITY')
    p(f"{'**' if md else ''}Feature score: {score:.1f}%{'**' if md else ''}  ({got:g} of {tot} weighted points, {len(scored)} features)")
    p(f'Must-haves: {must_done} / {len(must)} done')
    if layout is not None: p(f'Layout score: {layout:.1f}% over {len(vis)} screen(s)')
    else: p('Layout score: not measured (no --visual files)')
    p(f'Left out: {len(skipped)} skip rows, {len(extra)} clone-only rows' + (f', {len(bad)} malformed rows' if bad else ''))
    p('Verdict (features only): ' + ('shippable' if shippable else 'NOT shippable — ' + ('must-haves missing' if must_done < len(must) else 'feature score under 80')))
    h('Areas, weakest first')
    for a, s in area_scores: p(f'{"- " if md else "  "}{a}: {s:.0f}%')
    h('Missing, in build order')
    if not missing: p('Nothing missing.')
    for r in missing: p(f"{'- ' if md else '  '}[{r['priority']}] {r['feature']} ({r['area']}) — {r['clone']}" + (f": {r['notes']}" if r.get('notes') else ''))
    if vis:
        h('Layout per screen')
        for v in vis: p(f"{'- ' if md else '  '}{v.get('name', '?')}: {v['score']:.1f}% ({v.get('verdict', '')})")
    h('Not cloned (skip)')
    for r in skipped: p(f"{'- ' if md else '  '}{r['feature']}: {r.get('notes') or 'no reason given'}")
    if extra:
        h('Clone-only features (not scored)')
        for r in extra: p(f"{'- ' if md else '  '}{r['feature']}")
    print('\n'.join(out))
    return 0 if shippable else 1

if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
