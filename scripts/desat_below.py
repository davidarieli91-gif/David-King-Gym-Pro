#!/usr/bin/env python3
"""c65: desaturate red pixels below a cutoff line (soft feather) — abductors fix.
usage: desat_below.py <in.png> <out.png> <y_soft_start> <y_full>
"""
import sys
from PIL import Image
import numpy as np

def main():
    src, dst = sys.argv[1], sys.argv[2]
    y_soft, y_full = float(sys.argv[3]), float(sys.argv[4])
    im = Image.open(src).convert('RGB')
    a = np.asarray(im).astype(np.float32)
    h, w, _ = a.shape
    hsv = np.asarray(Image.open(src).convert('HSV')).astype(np.float32)
    hue, sat, val = hsv[..., 0], hsv[..., 1], hsv[..., 2]
    # PIL HSV hue: 0-255 maps 0-360deg. red zone: <12 or >243, with meaningful saturation
    hue_dist = np.minimum(hue, 255 - hue)  # distance from 0 in PIL units
    redness = np.clip((sat / 255.0) * (1.0 - hue_dist / 14.0), 0, 1)
    ys = np.arange(h, dtype=np.float32)
    # factor 0 = keep color, 1 = desaturate fully
    line = np.where(ys <= y_soft, 0.0, np.where(ys >= y_full, 1.0, (ys - y_soft) / (y_full - y_soft)))
    fade = np.clip(line[:, None] * 2.0, 0, 1)
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    lum = (0.299 * r + 0.587 * g + 0.114 * b)
    mix = np.clip(redness * fade, 0, 1)[..., None]
    out = a * (1 - mix) + lum[..., None] * mix
    # add slight silver tint to desaturated zones to match ecorche palette
    tint = np.array([10, 8, 6], dtype=np.float32)
    out = out + mix * tint
    Image.fromarray(np.clip(out, 0, 255).astype(np.uint8)).save(dst)
    print('DESAT-OK', dst)

if __name__ == '__main__':
    main()
