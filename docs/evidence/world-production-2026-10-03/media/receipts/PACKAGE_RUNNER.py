"""Explicitly launched only after Root's GPU-quiet signal; sequential CPU receipts."""
from pathlib import Path
import argparse, datetime, hashlib, json, subprocess, time

BASE = Path(__file__).parent

def sha(path):
    h = hashlib.sha256()
    with path.open('rb') as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b''):
            h.update(block)
    return h.hexdigest()

def metadata(exe, source, output):
    cmd = [exe, '-hide_banner', '-i', str(source)]
    probe = subprocess.run(cmd, capture_output=True, text=True)
    output.write_text(probe.stderr, encoding='utf-8')
    return {'command': cmd, 'exit': probe.returncode,
            'method': 'Header inspection only; exit1 is expected because no output was specified.',
            'header': probe.stderr}

def main():
    cli = argparse.ArgumentParser()
    cli.add_argument('--gpu-quiet-authorized', action='store_true', required=True)
    cli.add_argument('--plan', type=Path, default=BASE / 'PLAN.json')
    args = cli.parse_args()
    plan = json.loads(args.plan.read_text(encoding='utf-8'))
    receipt = {'utc': datetime.datetime.now(datetime.timezone.utc).isoformat(),
               'plan': str(args.plan), 'plan_sha256': sha(args.plan),
               'runner_sha256': sha(Path(__file__)), 'clips': [], 'success': False}
    dest = BASE / ('PACKAGE_REVIEW.json' if args.plan.name == 'PLAN.json'
                   else args.plan.stem + '_REVIEW.json')
    try:
        for entry in plan['clips']:
            start = time.monotonic()
            name = entry['name']
            print('BEGIN ' + name, flush=True)
            local = Path(entry['source_encode_command'][entry['source_encode_command'].index('--output') + 1]).parent
            local.mkdir(parents=True, exist_ok=True)
            item = {'name': name, 'declared': entry, 'success': False}
            receipt['clips'].append(item)
            for label, key in [('source', 'source_encode_command'), ('mp4', 'mp4_decode_command')]:
                cmd = entry[key]
                item[label + '_invocation'] = {'command': cmd}
                proc = subprocess.run(cmd, capture_output=True, text=True, timeout=1100)
                (local / (label + '_RUN.stdout')).write_text(proc.stdout, encoding='utf-8')
                (local / (label + '_RUN.stderr')).write_text(proc.stderr, encoding='utf-8')
                item[label + '_invocation']['exit'] = proc.returncode
                assert proc.returncode == 0, label + ' helper failed; logs preserved'
                folder = Path(cmd[cmd.index('--output') + 1])
                item[label + '_decode'] = json.loads((folder / 'DECODE.json').read_text(encoding='utf-8'))
                assert item[label + '_decode']['success'], label + ' receipt not successful'
            source = item['source_decode']
            encoded = item['mp4_decode']
            item['source_header'] = metadata(plan['ffmpeg'], Path(entry['source']), local / 'SOURCE_HEADER.log')
            item['mp4_header'] = metadata(plan['ffmpeg'], Path(entry['mp4']), local / 'MP4_HEADER.log')
            item['source_hash_retained'] = sha(Path(entry['source'])) == entry['source_sha256']
            item['mp4_hash'] = sha(Path(entry['mp4']))
            item['mp4_bytes'] = Path(entry['mp4']).stat().st_size
            item['frame_count_equal'] = source['video']['decoded_frames'] == encoded['video']['decoded_frames']
            item['video_decoded_seconds_delta'] = encoded['video']['decoded_seconds'] - source['video']['decoded_seconds']
            item['audio_decoded_seconds_delta'] = encoded['audio']['decoded_seconds'] - source['audio']['decoded_seconds']
            item['seconds_to_prepare_and_validate'] = time.monotonic() - start
            assert item['source_hash_retained'], 'Raw source changed'
            assert item['mp4_bytes'] < 100_000_000, 'File exceeds portable100MB boundary'
            assert item['frame_count_equal'], 'Encoded frame count differs; preserve and inspect before delivery'
            assert abs(item['video_decoded_seconds_delta']) < 0.15, 'Unexpected video timestamp drift'
            assert abs(item['audio_decoded_seconds_delta']) < 0.10, 'Unexpected audio duration drift'
            item['success'] = True
            dest.write_text(json.dumps(receipt, indent=2) + '\n', encoding='utf-8')
            print(json.dumps({'name': name, 'bytes': item['mp4_bytes'],
                              'frames': encoded['video']['decoded_frames'],
                              'video_seconds': encoded['video']['decoded_seconds'],
                              'audio_seconds': encoded['audio']['decoded_seconds'],
                              'wall_seconds': item['seconds_to_prepare_and_validate']}), flush=True)
        receipt['success'] = True
        receipt['total_mp4_bytes'] = sum(x['mp4_bytes'] for x in receipt['clips'])
    finally:
        dest.write_text(json.dumps(receipt, indent=2) + '\n', encoding='utf-8')
    print('COMPLETE ' + str(dest), flush=True)

if __name__ == '__main__':
    main()
