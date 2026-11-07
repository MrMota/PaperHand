#!/usr/bin/env python3
"""Layout diff between two PNG screenshots (stdlib only).

Layout mode (default) compares structure, not colour: both images become edge
maps at the same width, are cut into a grid, and only cells with content in
either image are scored. Pixel mode compares exact pixels (use it for your own
regressions, not against the original).

  python3 imgdiff.py original.png clone.png [--out diff.png] [--json] [--mode pixel] [--name S07]
"""
import json, struct, sys, zlib

def read_png(path):
    data = open(path, 'rb').read()
    if data[:8] != b'\x89PNG\r\n\x1a\n': raise ValueError(f'{path}: not a PNG')
    pos, idat, w = 8, b'', 0
    while pos < len(data):
        n, typ = struct.unpack('>I4s', data[pos:pos + 8]); body = data[pos + 8:pos + 8 + n]; pos += 12 + n
        if typ == b'IHDR': w, h, depth, ctype, _, _, inter = struct.unpack('>IIBBBBB', body)
        elif typ == b'IDAT': idat += body
        elif typ == b'IEND': break
    if depth != 8 or inter: raise ValueError(f'{path}: only 8-bit non-interlaced PNGs supported')
    ch = {0: 1, 2: 3, 4: 2, 6: 4}.get(ctype)
    if not ch: raise ValueError(f'{path}: palette PNGs not supported')
    raw, stride = zlib.decompress(idat), w * ch
    out, prev, i = [], bytearray(stride), 0
    for _ in range(h):
        f = raw[i]; line = bytearray(raw[i + 1:i + 1 + stride]); i += 1 + stride
        for x in range(stride):
            a = line[x - ch] if x >= ch else 0; b = prev[x]; c = prev[x - ch] if x >= ch else 0
            if f == 1: line[x] = (line[x] + a) & 255
            elif f == 2: line[x] = (line[x] + b) & 255
            elif f == 3: line[x] = (line[x] + ((a + b) >> 1)) & 255
            elif f == 4:
                pa, pb, pc = abs(b - c), abs(a - c), abs(a + b - 2 * c)
                line[x] = (line[x] + (a if pa <= pb and pa <= pc else b if pb <= pc else c)) & 255
        prev = line
        # luminance per pixel
        if ch >= 3: out.append([(299 * line[k] + 587 * line[k + 1] + 114 * line[k + 2]) // 1000 for k in range(0, stride, ch)])
        else: out.append([line[k] for k in range(0, stride, ch)])
    return w, h, out

def write_png(path, w, h, rows):  # rows of (r,g,b) tuples
    raw = b''.join(b'\x00' + bytes(v for px in r for v in px) for r in rows)
    chunk = lambda t, d: struct.pack('>I', len(d)) + t + d + struct.pack('>I', zlib.crc32(t + d) & 0xffffffff)
    open(path, 'wb').write(b'\x89PNG\r\n\x1a\n' + chunk(b'IHDR', struct.pack('>IIBBBBB', w, h, 8, 2, 0, 0, 0)) + chunk(b'IDAT', zlib.compress(raw, 6)) + chunk(b'IEND', b''))

def scale(img, W):  # box-average down to width W, keep aspect
    w, h, px = img
    H = max(1, round(h * W / w)); sx, sy = w / W, h / H
    out = []
    for y in range(H):
        y0, y1 = int(y * sy), max(int(y * sy) + 1, int((y + 1) * sy))
        row = []
        for x in range(W):
            x0, x1 = int(x * sx), max(int(x * sx) + 1, int((x + 1) * sx))
            s = n = 0
            for yy in range(y0, min(y1, h), max(1, (y1 - y0) // 3)):
                for xx in range(x0, min(x1, w), max(1, (x1 - x0) // 3)): s += px[yy][xx]; n += 1
            row.append(s // max(n, 1))
        out.append(row)
    return W, H, out

def edges(img, thr=18):
    w, h, px = img
    e = [[0] * w for _ in range(h)]
    for y in range(1, h - 1):
        for x in range(1, w - 1):
            gx = px[y][x + 1] - px[y][x - 1]; gy = px[y + 1][x] - px[y - 1][x]
            e[y][x] = 1 if abs(gx) + abs(gy) > thr else 0
    return e

def verdict(s): return 'matches' if s >= 90 else 'close' if s >= 75 else 'partly' if s >= 50 else 'different'

def main(a):
    if len(a) < 2 or a[0] in ('-h', '--help'): print(__doc__); return 2
    A, B = read_png(a[0]), read_png(a[1])
    mode = a[a.index('--mode') + 1] if '--mode' in a else 'layout'
    name = a[a.index('--name') + 1] if '--name' in a else a[1].rsplit('/', 1)[-1].rsplit('.', 1)[0]
    W, CELL = 360, 15
    sa, sb = scale(A, W), scale(B, W)
    H = min(sa[1], sb[1])
    height_note = None
    if abs(sa[1] - sb[1]) / max(sa[1], 1) > 0.1:
        height_note = f'clone page is {100 * (sb[1] - sa[1]) / sa[1]:+.0f}% {"taller" if sb[1] > sa[1] else "shorter"}'
    cells, diffs = [], []
    if mode == 'pixel':
        ma, mb = sa[2], sb[2]
    else:
        ma, mb = edges(sa), edges(sb)
    for cy in range(0, H - CELL + 1, CELL):
        for cx in range(0, W - CELL + 1, CELL):
            if mode == 'pixel':
                d = sum(abs(ma[y][x] - mb[y][x]) for y in range(cy, cy + CELL) for x in range(cx, cx + CELL)) / (CELL * CELL * 255)
                cells.append(1 - d); diffs.append((d, cx, cy)); continue
            da = sum(ma[y][x] for y in range(cy, cy + CELL) for x in range(cx, cx + CELL)) / (CELL * CELL)
            db = sum(mb[y][x] for y in range(cy, cy + CELL) for x in range(cx, cx + CELL)) / (CELL * CELL)
            if da < 0.01 and db < 0.01: continue
            sim = 1 - abs(da - db) / max(da, db) if max(da, db) > 0.03 or min(da, db) > 0 else 0.0
            cells.append(sim); diffs.append((1 - sim, cx, cy))
    score = 100 * sum(cells) / len(cells) if cells else 100.0
    k = A[0] / W
    regions = [{'x': round(cx * k), 'y': round(cy * k), 'w': round(CELL * k), 'h': round(CELL * k), 'diff': round(d, 2)} for d, cx, cy in sorted(diffs, reverse=True)[:8] if d > 0.35]
    res = {'name': name, 'mode': mode, 'score': round(score, 1), 'verdict': verdict(score), 'cells': len(cells), 'regions': regions, 'height': height_note}
    if '--out' in a:
        out = []
        bad = {(cx, cy) for d, cx, cy in diffs if d > 0.35}
        for y in range(H):
            row = []
            for x in range(W):
                g = sb[2][y][x] // 2 + 100
                row.append((230, 60, 90) if ((x - x % CELL), (y - y % CELL)) in bad and (x % CELL == 0 or y % CELL == 0) else (g, g, g))
            out.append(row)
        write_png(a[a.index('--out') + 1], W, H, out)
    if '--json' in a: print(json.dumps(res))
    else:
        print(f"{name}: {res['score']}% layout ({res['verdict']}) over {res['cells']} cells, mode {mode}")
        if height_note: print('  ' + height_note)
        for r in regions: print(f"  differs at x={r['x']} y={r['y']} {r['w']}x{r['h']} (diff {r['diff']})")
    return 0

if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
