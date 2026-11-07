import json, sys
def lum(h):
    h=h.lstrip('#'); c=[int(h[i:i+2],16)/255 for i in (0,2,4)]
    c=[x/12.92 if x<=0.03928 else ((x+0.055)/1.055)**2.4 for x in c]
    return 0.2126*c[0]+0.7152*c[1]+0.0722*c[2]
t=json.load(open(sys.argv[1])); col=t['color']; bad=0
for a,b in t['pairs']:
    l1,l2=sorted([lum(col[a]),lum(col[b])],reverse=True); r=(l1+.05)/(l2+.05)
    need=3 if a=='border-input' else 4.5; ok=r>=need; bad+=not ok
    print(f"{'OK ' if ok else 'FAIL'} {a:14} on {b:12} {r:5.2f} (need {need})")
sys.exit(1 if bad else 0)
