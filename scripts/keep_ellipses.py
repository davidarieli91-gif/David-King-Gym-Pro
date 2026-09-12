#!/usr/bin/env python3
"""c65: keep red only inside given ellipses (soft edges), desaturate other red pixels.
usage: keep_ellipses.py <in.png> <out.png> cx1,cy1,rx1,ry1 [cx2,cy2,rx2,ry2 ...]
"""
import sys
from PIL import Image
import numpy as np

def main():
    src, dst = sys.argv[1], sys.argv[2]
    ells = []
    for spec in sys.argv[3:]:
        cx, cy, rx, ry = map(float, spec.split(','))
        ells.append((cx, cy, rx, ry))
    im = Image.open(src).convert('RGB')
    a = np.asarray(im).astype(np.float32)
    h, w, _ = a.shape
    hsv = np.asarray(Image.open(src).convert('HSV')).astype(np.float32)
    hue, sat = hsv[..., 0], hsv[..., 1]
    hd = np.minimum(hue, 255 - hue)
    hue_win = np.clip(1.0 - hd / 18.0, 0, 1)
    sat_bin = np.clip((sat - 35.0) / 40.0, 0, 1)
    redness = np.clip(hue_win * sat_bin * 1.6, 0, 1)
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    keep = np.zeros((h, w), dtype=np.float32)
    for cx, cy, rx, ry in ells:
        d = ((xx - cx) / rx) ** 2 + ((yy - cy) / ry) ** 2
        keep = np.maximum(keep, np.clip((1.0 - d) * 2.2, 0, 1))  # soft feather at rim
    desat_factor = np.clip(redness * (1.0 - keep), 0, 1)[..., None]
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    lum = (0.299 * r + 0.587 * g + 0.114 * b)
    out = a * (1 - desat_factor) + lum[..., None] * desat_factor
    tint = np.array([10, 8, 6], dtype=np.float32)
    out = out + desat_factor * tint
    Image.fromarray(np.clip(out, 0, 255).astype(np.uint8)).save(dst)
    print('ELLIPSE-OK', dst)

if __name__ == '__main__':
    main()
