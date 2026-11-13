#!/usr/bin/env python3
"""Capture the story cast on the box GPU from tools/preview_story_art.html.

The traveler, the village resident Ilan and each story figure are framed close,
third-person and as a diorama (plus night frames for the glowing parts). Frames
are refused unless WEBGL_debug_renderer_info names an NVIDIA GPU, so a software
rasterizer can never pass for hardware. A receipt.json beside the frames records
the renderer, the browser build, every frame and any page error.

usage: python3 tools/capture_story_art.py --out preview-frames [--only name,name]
"""
from pathlib import Path
import argparse
import json
import math
import sys

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(Path(__file__).resolve().parent))
from browser_support import launch_kwargs  # the hardware flags live there

PAGE = (ROOT / 'tools/preview_story_art.html').as_uri()
DAY, DUSK = 17.2, 21.6


def frame(name, figure, centre, dist, lift, fov, hour=DAY, base=0.0, off=0.0, yaw=0.6, plinth=False):
    return dict(name=name, figure=figure, centre=centre, dist=dist, lift=lift, fov=fov,
                hour=hour, base=base, off=off, yaw=yaw, plinth=plinth)


FRAMES = [
    frame('traveler-close', 'traveler', [0, 1.56, 0], 1.15, 0.05, 24),
    frame('traveler-third', 'traveler', [0, 1.0, 0], 7.26, 2.07, 40, off=-0.5),
    frame('traveler-diorama', 'traveler', [0, 1.3, 0], 8.2, 6.2, 32, base=0.4, off=-0.2, plinth=True),
    frame('ilan-close', 'ilan', [0, 1.55, 0], 1.15, 0.05, 24),
    frame('regent-close', 'regent', [0, 2.0, 0], 1.45, 0.05, 24),
    frame('regent-third', 'regent', [0, 1.25, 0], 7.26, 2.07, 40, off=-0.5),
    frame('regent-diorama', 'regent', [0, 1.6, 0], 9.5, 7.0, 30, base=0.4, off=-0.2, plinth=True),
    frame('regent-night', 'regent', [0, 1.25, 0], 4.6, 1.2, 34, hour=DUSK, off=-0.5),
    frame('envoy-close', 'envoy', [0, 1.8, 0], 1.3, 0.05, 24),
    frame('envoy-third', 'envoy', [0, 1.05, 0], 7.26, 2.07, 40, off=-0.5),
    frame('envoy-diorama', 'envoy', [0, 1.4, 0], 8.6, 6.4, 30, base=0.4, off=-0.2, plinth=True),
    frame('envoy-night', 'envoy', [0, 1.05, 0], 4.2, 1.1, 34, hour=DUSK, off=-0.5),
    frame('briarFalse-close', 'briarFalse', [0, 0.42, 0], 0.95, 0.12, 24),
    frame('briarFalse-third', 'briarFalse', [0, 0.36, 0], 2.4, 0.9, 34, off=-0.5),
    frame('briarFalse-diorama', 'briarFalse', [0, 0.7, 0], 4.8, 4.2, 30, base=0.4, off=-0.2, plinth=True),
    frame('severingDevice-third', 'severingDevice', [0, 0.62, 0], 3.2, 1.0, 34, off=-0.5),
    frame('severingDevice-diorama', 'severingDevice', [0, 0.95, 0], 6.0, 5.6, 30, base=0.4, off=-0.2, plinth=True),
    frame('severingDevice-night', 'severingDevice', [0, 0.62, 0], 3.2, 1.0, 34, hour=DUSK, off=-0.5),
    frame('chain-third', 'chain', [0, 1.1, 0.3], 5.6, 1.4, 34, yaw=0.0),
    frame('chain-diorama', 'chain', [0, 1.1, 0.3], 9.0, 6.0, 30, yaw=0.0),
    frame('chain-night', 'chain', [0, 1.1, 0.3], 5.6, 1.4, 34, hour=DUSK, yaw=0.0),
]


def camera(f):
    # the eye stands in front of the figure, rotated by off, and lifts by lift above the centre.
    cx, cy, cz = f['centre']
    a = f['yaw'] + f['off']
    eye = [cx + math.sin(a) * f['dist'], cy + f['lift'], cz + math.cos(a) * f['dist']]
    return eye, [cx, cy, cz]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--out', default='preview-frames')
    ap.add_argument('--only', default='', help='comma list of frame names')
    args = ap.parse_args()
    picked = [f for f in FRAMES if not args.only or f['name'] in args.only.split(',')]
    if not picked:
        raise SystemExit('no frames selected')
    out = Path(args.out)
    out.mkdir(parents=True, exist_ok=True)
    receipt = {'page': 'tools/preview_story_art.html', 'frames': [], 'errors': []}
    with sync_playwright() as pw:
        browser = pw.chromium.launch(**launch_kwargs('hardware'))
        receipt['browser'] = browser.version
        page = browser.new_page(viewport={'width': 1280, 'height': 800})
        page.on('pageerror', lambda e: receipt['errors'].append('pageerror: ' + str(e)))
        page.on('console', lambda m: receipt['errors'].append('console.' + m.type + ': ' + m.text)
                if m.type in ('error', 'warning') else None)
        page.goto(PAGE)
        page.wait_for_function('typeof window.renderFrame === "function"', timeout=60000)
        gpu = page.evaluate('() => window.gpuInfo()')
        receipt['gpu'] = gpu
        print('renderer:', gpu.get('renderer'), '| vendor:', gpu.get('vendor'), '| version:', gpu.get('version'), flush=True)
        if 'NVIDIA' not in str(gpu.get('renderer', '')).upper():
            receipt['errors'].append('refused: renderer is not an NVIDIA GPU')
        else:
            for f in picked:
                eye, target = camera(f)
                spec = dict(figure=f['figure'], centre=f['centre'], yaw=f['yaw'], base=f['base'], plinth=f['plinth'],
                            hour=f['hour'], t=0.6, eye=eye, target=target, fov=f['fov'])
                res = page.evaluate('spec => window.renderFrame(spec)', spec)
                if not res.get('ok'):
                    receipt['errors'].append(f['name'] + ': ' + str(res.get('error')))
                    continue
                page.evaluate('() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(() => r(true))))')
                png = out / (f['name'] + '.png')
                page.locator('#scene').screenshot(path=str(png))
                receipt['frames'].append({'name': f['name'], 'bytes': png.stat().st_size,
                                          'items': res['items'], 'kinds': res['kinds']})
                print('frame', f['name'], png.stat().st_size, 'bytes', res['items'], 'instances', flush=True)
        browser.close()
    (out / 'receipt.json').write_text(json.dumps(receipt, indent=2), encoding='utf-8')
    print('receipt:', out / 'receipt.json', '| frames:', len(receipt['frames']), '| errors:', len(receipt['errors']), flush=True)
    for e in receipt['errors']:
        print('ERROR', e, flush=True)
    if receipt['errors'] or len(receipt['frames']) != len(picked):
        raise SystemExit(1)


if __name__ == '__main__':
    main()
