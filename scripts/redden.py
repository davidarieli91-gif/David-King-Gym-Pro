#!/usr/bin/env python3
"""c65: colorize gray fibers toward muscle-red inside a feathered ellipse (rhomboid zone).
usage: redden.py <in.png> <out.png> cx,cy,rx,ry
"""
import sys
from PIL import Image
import numpy as np

def main():
    src, dst = sys.argv[1], sys.argv[2]
    cx, cy, rx, ry = map(float, sys.argv[3].split(','))
    im = Image.open(src).convert('RGB')
    a = np.asarray(im).astype(np.float32)
    h, w, _ = a.shape
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    d = ((xx - cx) / rx) ** 2 + ((yy - cy) / ry) ** 2
    m = np.clip((1.0 - d) * 1.9, 0, 1)  # feathered ellipse mask (h,w)
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    # red-shift: raise R, drop G/B, keep fiber luminance variation
    red_r = np.clip(r * 1.55 + 40, 0, 235)
    red_g = np.clip(g * 0.30, 0, 255)
    red_b = np.clip(b * 0.28, 0, 255)
    out = np.stack([r * (1 - m) + red_r * m,
                    g * (1 - m) + red_g * m,
                    b * (1 - m) + red_b * m], axis=-1)
    Image.fromarray(np.clip(out, 0, 255).astype(np.uint8)).save(dst)
    print('REDDEN-OK', dst)

if __name__ == '__main__':
    main()
