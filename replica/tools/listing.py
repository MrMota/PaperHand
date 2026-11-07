#!/usr/bin/env python3
"""Lint an App Store / Google Play listing (stdlib only).

  python3 listing.py replica/launch/listing.json [--brand replica/brand.json]

Errors (exit 1): over a store limit, or a name/domain from brand.json "avoid"/"domains" anywhere.
Warnings: ranking or price claims and emoji in short fields, keyword characters wasted on spaces,
duplicates or words already in the name/subtitle.
"""
import json, os, re, sys, unicodedata

LIMITS = {
    ('app_store', 'name'): 30, ('app_store', 'subtitle'): 30, ('app_store', 'promotional_text'): 170,
    ('app_store', 'keywords'): 100, ('app_store', 'description'): 4000,
    ('google_play', 'title'): 30, ('google_play', 'short_description'): 80, ('google_play', 'full_description'): 4000,
}
SHORT = {'name', 'subtitle', 'keywords', 'title', 'short_description', 'promotional_text'}
RANK = re.compile(r"\b(best|#\s?1|number one|no\.? ?1|top[- ]rated|leading|award[- ]winning|most popular)\b", re.I)
PRICE = re.compile(r"\b(free|sale|discount|cheap|deal|\d+% off)\b|\$\s?\d", re.I)
EMOJI = re.compile('[\U0001F300-\U0001FAFF☀-➿\U0001F000-\U0001F2FF]')

def chars(s):
    # count what a person sees: combining marks, ZWJ and variation selectors add nothing
    s = unicodedata.normalize('NFC', s)
    return sum(1 for c in s if unicodedata.category(c) != 'Mn' and c not in '‍️︎')

def main(a):
    if not a or a[0] in ('-h', '--help'): print(__doc__); return 2
    L = json.load(open(a[0]))
    bpath = a[a.index('--brand') + 1] if '--brand' in a else os.path.join(os.path.dirname(os.path.abspath(a[0])), '..', 'brand.json')
    brand = json.load(open(bpath)) if os.path.exists(bpath) else {}
    avoid = brand.get('avoid', []) + brand.get('retired', []) + brand.get('domains', [])
    errors, warns = [], []
    for (store, field), lim in LIMITS.items():
        v = L.get(store, {}).get(field)
        if v is None: warns.append(f'{store}.{field}: missing'); continue
        n = chars(v)
        line = f'{store}.{field}: {n}/{lim}'
        if n > lim: errors.append(line + ' OVER LIMIT')
        print(('ERROR ' if n > lim else 'ok    ') + line)
        if field in SHORT:
            for rx, what in ((RANK, 'ranking claim'), (PRICE, 'price claim'), (EMOJI, 'emoji')):
                m = rx.search(v)
                if m: warns.append(f'{store}.{field}: {what} "{m.group(0)}" in a short field')
    for store, fields in L.items():
        if not isinstance(fields, dict): continue
        for field, v in fields.items():
            if not isinstance(v, str): continue
            for n in avoid:
                if re.search(r'(?<![a-z])' + re.escape(n.lower()) + r'(?![a-z])', v.lower()):
                    errors.append(f'{store}.{field}: contains "{n}" (original name/domain or retired name)')
    kw = L.get('app_store', {}).get('keywords', '')
    if kw:
        parts = kw.split(',')
        if any(p != p.strip() for p in parts): warns.append('app_store.keywords: spaces after commas waste characters')
        words = [p.strip().lower() for p in parts if p.strip()]
        dup = sorted({w for w in words if words.count(w) > 1})
        if dup: warns.append(f'app_store.keywords: duplicates {dup}')
        named = set(re.findall(r'[a-z]+', (L['app_store'].get('name', '') + ' ' + L['app_store'].get('subtitle', '')).lower()))
        wasted = [w for w in words if w in named]
        if wasted: warns.append(f'app_store.keywords: already in name/subtitle (Apple indexes those): {wasted}')
    for w in warns: print('warn  ' + w)
    for e in errors:
        if 'OVER LIMIT' not in e: print('ERROR ' + e)
    print('PASS' if not errors else f'FAIL: {len(errors)} error(s)')
    return 1 if errors else 0

if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
