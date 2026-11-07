#!/usr/bin/env python3
"""Find anything of the original (or a retired name) left in the codebase. Stdlib only.

  python3 sweep.py . --config replica/brand.json
  python3 sweep.py . --avoid "Original,Its Company" --domains original.com --colors "#006bff"

Matches names case-insensitively, also inside identifiers (OriginalEmbed), but not as a prefix of a
longer common word (so "Canva" does not match "canvas"). Colours match exactly or within --near
(RGB distance, default 36). Exit 1 when anything is found.
"""
import json, os, re, sys

TEXT = {'.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.json', '.html', '.css', '.scss', '.md', '.txt', '.svg', '.yml', '.yaml', '.toml', '.py', '.xml', '.webmanifest'}

def arg(a, k, d=None):
    return a[a.index(k) + 1] if k in a else d

def hexrgb(h):
    h = h.lstrip('#'); h = ''.join(c * 2 for c in h) if len(h) == 3 else h
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))

def main(a):
    if not a or a[0] in ('-h', '--help'): print(__doc__); return 2
    root = a[0]
    cfg = json.load(open(arg(a, '--config'))) if '--config' in a else {}
    avoid = cfg.get('avoid', []) + [s.strip() for s in (arg(a, '--avoid', '') or '').split(',') if s.strip()]
    retired = cfg.get('retired', [])
    domains = cfg.get('domains', []) + [s.strip() for s in (arg(a, '--domains', '') or '').split(',') if s.strip()]
    colors = cfg.get('colors', []) + [s.strip() for s in (arg(a, '--colors', '') or '').split(',') if s.strip()]
    near = float(arg(a, '--near', cfg.get('near', 36)))
    ignore = set(cfg.get('ignore', ['node_modules', 'dist', 'build', '.git', 'replica', '.next', 'coverage']))
    # name followed by end, non-letter, or an uppercase letter (identifier boundary): Canva, CanvaEmbed, canva_x; not canvas
    name_rx = [(n, re.compile(r'(?<![A-Za-z])' + re.escape(n) + r'(?![a-z])', re.I)) for n in avoid + retired]
    name_rx = [(n, re.compile(r'(?i:(?<![a-z])' + re.escape(n.lower()) + r')(?![a-z])')) for n, _ in name_rx]
    dom_rx = [(d, re.compile(re.escape(d), re.I)) for d in domains]
    targets = [(c, hexrgb(c)) for c in colors]
    hex_rx = re.compile(r'#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b')
    found = []
    for dp, dns, fns in os.walk(root):
        dns[:] = [d for d in dns if d not in ignore]
        for fn in fns:
            if fn in ignore: continue
            p = os.path.join(dp, fn); rel = os.path.relpath(p, root)
            for n, rx in name_rx + dom_rx:
                if rx.search(fn): found.append((rel, 0, f'file name contains "{n}"'))
            if os.path.splitext(fn)[1].lower() not in TEXT: continue
            try: lines = open(p, encoding='utf-8').read().splitlines()
            except Exception: continue
            for i, line in enumerate(lines, 1):
                for n, rx in name_rx:
                    if rx.search(line): found.append((rel, i, f'{"retired name" if n in retired else "original name"} "{n}": {line.strip()[:90]}'))
                for d, rx in dom_rx:
                    if rx.search(line): found.append((rel, i, f'original domain "{d}": {line.strip()[:90]}'))
                for m in hex_rx.findall(line):
                    try: c = hexrgb(m)
                    except ValueError: continue
                    for t, tc in targets:
                        dist = sum((x - y) ** 2 for x, y in zip(c, tc)) ** .5
                        if dist <= near: found.append((rel, i, f'colour {m} {"is" if dist == 0 else f"is near ({dist:.0f})"} original {t}'))
    for rel, i, msg in found: print(f'{rel}:{i}: {msg}')
    print('clean' if not found else f'{len(found)} finding(s)')
    return 1 if found else 0

if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
