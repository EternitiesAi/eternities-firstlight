"""Bounded, replay-safe Poly Haven CC0 intake for Firstlight authoring.

Powered by Poly Haven. Downloads maps only, never executes acquired content.
"""
import argparse
import hashlib
import json
import os
import re
import time
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path('D:/07-GAMES/Firstlight')
SOURCE = ROOT / 'assets/sources/polyhaven'
MANIFEST = ROOT / 'assets/manifests/EARTH_MATERIALS_1K.json'
RECEIPT = ROOT / 'assets/manifests/EARTH_MATERIALS_1K_RECEIPT.json'
IDS = ('weathered_planks', 'rock_boulder_dry', 'white_plaster_02',
       'clay_roof_tiles_02', 'brown_mud_02')
MAPS = (('Diffuse', 'jpg'), ('nor_gl', 'png'), ('Rough', 'jpg'))
UA = 'FirstlightAssetIntake/1.0 (local game authoring; Powered by Poly Haven)'


def utc():
    return time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())


def digest(path, algorithm):
    h = hashlib.new(algorithm)
    with path.open('rb') as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b''):
            h.update(block)
    return h.hexdigest()


def new_json(path, obj):
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open('x', encoding='utf-8', newline='\n') as out:
        json.dump(obj, out, indent=2, ensure_ascii=False)
        out.write('\n')


def metadata(asset_id, kind):
    path = SOURCE / f'{asset_id}-{kind}.json'
    if not path.exists():
        request = urllib.request.Request(
            f'https://api.polyhaven.com/{kind}/{asset_id}', headers={'User-Agent': UA})
        with urllib.request.urlopen(request, timeout=45) as response:
            raw = response.read(2 * 1024 * 1024 + 1)
        if len(raw) > 2 * 1024 * 1024:
            raise RuntimeError('Metadata exceeds bounded intake limit')
        obj = json.loads(raw)
        SOURCE.mkdir(parents=True, exist_ok=True)
        with path.open('xb') as out:
            out.write(raw)
    return json.loads(path.read_text(encoding='utf-8')), path


def freeze():
    if MANIFEST.exists():
        return json.loads(MANIFEST.read_text(encoding='utf-8'))
    entries, assets = [], []
    for asset_id in IDS:
        info, info_path = metadata(asset_id, 'info')
        files, files_path = metadata(asset_id, 'files')
        assets.append({'id': asset_id, 'name': info['name'],
                       'authors': info.get('authors', {}),
                       'page': f'https://polyhaven.com/a/{asset_id}',
                       'metadata_sha256': {'info': digest(info_path, 'sha256'),
                                           'files': digest(files_path, 'sha256')}})
        for channel, fmt in MAPS:
            item = files[channel]['1k'][fmt]
            url = urllib.parse.urlparse(item['url'])
            basename = Path(url.path).name
            if (url.scheme != 'https' or url.hostname != 'dl.polyhaven.org'
                    or url.query or not basename.startswith(asset_id + '_')
                    or not basename.endswith('_1k.' + fmt)
                    or not 0 < item['size'] < 20 * 1024 * 1024
                    or not re.fullmatch('[0-9a-f]{32}', item['md5'])):
                raise RuntimeError(f'Unexpected publisher file record: {asset_id}/{channel}')
            entries.append({'id': asset_id, 'channel': channel, 'resolution': '1k',
                            'format': fmt, 'url': item['url'],
                            'expected_bytes': item['size'], 'publisher_md5': item['md5'],
                            'relative_path': f'{asset_id}/{basename}'})
    result = {'schema': 1, 'frozen_at_utc': utc(), 'provider': 'Poly Haven',
              'credit': 'Powered by Poly Haven', 'license': 'CC0-1.0',
              'license_url': 'https://polyhaven.com/license',
              'api_terms_url': 'https://github.com/Poly-Haven/Public-API/blob/master/ToS.md',
              'intake_user_agent': UA, 'purpose': 'Offline authoring, not browser integration',
              'assets': assets, 'objects': entries, 'object_count': len(entries),
              'expected_total_bytes': sum(x['expected_bytes'] for x in entries)}
    if result['object_count'] != 15 or result['expected_total_bytes'] != 30448169:
        raise RuntimeError('Publisher metadata changed from reviewed bounded selection')
    new_json(MANIFEST, result)
    return result


def verify_file(path, entry):
    if path.stat().st_size != entry['expected_bytes']:
        raise RuntimeError(f'Size mismatch: {path}')
    if digest(path, 'md5') != entry['publisher_md5']:
        raise RuntimeError(f'Publisher MD5 mismatch: {path}')
    return {'relative_path': entry['relative_path'], 'bytes': path.stat().st_size,
            'publisher_md5_match': True, 'local_sha256': digest(path, 'sha256')}


def run(acquire):
    print('Powered by Poly Haven - CC0 material intake', flush=True)
    manifest = freeze()
    if tuple(x['id'] for x in manifest['assets']) != IDS or len(manifest['objects']) != 15:
        raise RuntimeError('Frozen manifest membership changed')
    rows, downloaded, reused = [], 0, 0
    previous = json.loads(RECEIPT.read_text(encoding='utf-8')) if RECEIPT.exists() else None
    previous_rows = {x['relative_path']: x for x in previous['objects']} if previous else {}
    for entry in manifest['objects']:
        path = SOURCE / entry['relative_path']
        if not path.resolve().is_relative_to(SOURCE.resolve()):
            raise RuntimeError('Destination escapes source root')
        if path.exists():
            row = verify_file(path, entry)
            if previous and row != previous_rows.get(entry['relative_path']):
                raise RuntimeError(f'Existing acquired bytes changed: {path}')
            reused += 1
        else:
            if not acquire or previous:
                raise RuntimeError(f'Missing file; acquisition required: {path}')
            path.parent.mkdir(parents=True, exist_ok=True)
            staged = path.with_name(path.name + '.part')
            request = urllib.request.Request(entry['url'], headers={'User-Agent': UA})
            with urllib.request.urlopen(request, timeout=60) as response, staged.open('xb') as out:
                final_url = urllib.parse.urlparse(response.geturl())
                if final_url.scheme != 'https' or final_url.hostname != 'dl.polyhaven.org':
                    raise RuntimeError('Unexpected download redirect')
                count = 0
                while block := response.read(256 * 1024):
                    count += len(block)
                    if count > entry['expected_bytes']:
                        raise RuntimeError('Download exceeds frozen expected size')
                    out.write(block)
            row = verify_file(staged, entry)
            os.rename(staged, path)
            downloaded += 1
        rows.append(row)
        print(f"verified {entry['id']}/{entry['channel']} {row['bytes']} bytes", flush=True)
    if not previous:
        new_json(RECEIPT, {'schema': 1, 'acquired_at_utc': utc(),
                         'manifest_sha256': digest(MANIFEST, 'sha256'),
                         'downloaded_objects': downloaded, 'reused_objects': reused,
                         'actual_bytes': sum(x['bytes'] for x in rows), 'objects': rows,
                         'verification': 'HTTPS official metadata, publisher MD5, local SHA256; not a signed attestation'})
    elif digest(MANIFEST, 'sha256') != previous['manifest_sha256']:
        raise RuntimeError('Frozen manifest digest changed')
    print(json.dumps({'status': 'verified', 'downloaded': downloaded, 'reused': reused,
                      'actual_bytes': sum(x['bytes'] for x in rows),
                      'manifest': str(MANIFEST), 'receipt': str(RECEIPT)}))


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--acquire', action='store_true', help='Acquire the exact frozen set')
    parser.add_argument('--root', type=Path, default=ROOT,
                        help='Heavy-storage home; defaults to Dom\'s D: Firstlight directory')
    args = parser.parse_args()
    ROOT = args.root.resolve()
    SOURCE = ROOT / 'assets/sources/polyhaven'
    MANIFEST = ROOT / 'assets/manifests/EARTH_MATERIALS_1K.json'
    RECEIPT = ROOT / 'assets/manifests/EARTH_MATERIALS_1K_RECEIPT.json'
    run(args.acquire)
