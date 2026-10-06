#!/usr/bin/env python3
"""Assemble the offline realm from original local sources. No dependencies."""
from pathlib import Path
import hashlib
import base64
from html.parser import HTMLParser
import json
import math
import re
import struct
import zlib
ROOT = Path(__file__).resolve().parent
TIMBER_SIZE = 512
TIMBER_BUDGET = 180 * 1024
TIMBER_ID = 'earth-weathered-timber-v1'


def validate_timber_image(data, channel):
    """Read actual image headers; roughness must be one scalar byte per pixel."""
    if channel == 'color':
        if data[:2] != b'\xff\xd8' or data[-2:] != b'\xff\xd9':
            raise ValueError('Timber color is not a complete JPEG.')
        offset = 2
        dimensions = None
        while offset < len(data) - 2:
            if data[offset] != 255:
                raise ValueError('Invalid timber JPEG marker.')
            while offset < len(data) and data[offset] == 255:
                offset += 1
            if offset >= len(data):
                raise ValueError('Truncated timber JPEG marker.')
            marker = data[offset]
            offset += 1
            if marker in (0, 0xD8, 0xD9) or 0xD0 <= marker <= 0xD7:
                raise ValueError('Unexpected timber JPEG header marker.')
            if offset + 2 > len(data):
                raise ValueError('Truncated timber JPEG header.')
            length = struct.unpack_from('>H', data, offset)[0]
            if length < 2 or offset + length > len(data):
                raise ValueError('Invalid timber JPEG segment length.')
            if marker in (0xC0, 0xC2):
                if length < 8:
                    raise ValueError('Truncated timber JPEG frame.')
                bits, height, width, channels = struct.unpack_from('>BHHB', data, offset + 2)
                if (bits, width, height, channels) != (8, TIMBER_SIZE, TIMBER_SIZE, 3):
                    raise ValueError('Timber color must be an actual 512x512, 8-bit RGB JPEG.')
                dimensions = (width, height)
            if marker == 0xDA:
                if dimensions is None:
                    raise ValueError('Timber JPEG scan has no supported frame header.')
                return dimensions
            offset += length
        raise ValueError('Timber JPEG has no image scan.')
    if channel != 'roughness' or data[:8] != b'\x89PNG\r\n\x1a\n':
        raise ValueError('Timber roughness must be a grayscale PNG.')
    offset = 8
    kinds = []
    compressed = []
    while offset < len(data):
        if offset + 12 > len(data):
            raise ValueError('Truncated timber PNG chunk.')
        length = struct.unpack_from('>I', data, offset)[0]
        end = offset + length + 12
        kind = data[offset + 4:offset + 8]
        if end > len(data):
            raise ValueError('Invalid timber PNG chunk length.')
        payload = data[offset + 8:end - 4]
        if zlib.crc32(kind + payload) != struct.unpack_from('>I', data, end - 4)[0]:
            raise ValueError('Timber PNG chunk checksum mismatch.')
        if kind not in (b'IHDR', b'IDAT', b'IEND'):
            raise ValueError('Timber scalar PNG must omit color/gamma and ancillary metadata.')
        if kind == b'IHDR':
            if kinds or length != 13 or struct.unpack('>IIBBBBB', payload) != (TIMBER_SIZE, TIMBER_SIZE, 8, 0, 0, 0, 0):
                raise ValueError('Timber roughness must be an actual 512x512, 8-bit grayscale PNG without alpha.')
        if kind == b'IDAT':
            compressed.append(payload)
        if kind == b'IEND' and (length or end != len(data)):
            raise ValueError('Invalid timber PNG terminator.')
        kinds.append(kind)
        offset = end
    if not kinds or kinds[0] != b'IHDR' or kinds[-1] != b'IEND' or not compressed:
        raise ValueError('Timber PNG is incomplete.')
    expected = TIMBER_SIZE * (TIMBER_SIZE + 1)
    decoder = zlib.decompressobj()
    try:
        pixels = decoder.decompress(b''.join(compressed), expected + 1)
    except zlib.error as error:
        raise ValueError('Timber PNG compressed samples are invalid.') from error
    if len(pixels) != expected or not decoder.eof or decoder.unused_data or decoder.unconsumed_tail:
        raise ValueError('Timber PNG decoded sample count differs from its dimensions.')
    if any(pixels[row * (TIMBER_SIZE + 1)] > 4 for row in range(TIMBER_SIZE)):
        raise ValueError('Timber PNG uses an invalid scanline filter.')
    return (TIMBER_SIZE, TIMBER_SIZE)


def timber_replacements(root):
    folder = root / 'assets/materials/timber'
    receipt = json.loads((folder / 'provenance.json').read_text(encoding='utf-8'))
    if (receipt.get('schema'), receipt.get('material_id'), receipt.get('width'), receipt.get('height'), receipt.get('license')) != (1, TIMBER_ID, TIMBER_SIZE, TIMBER_SIZE, 'CC0-1.0'):
        raise ValueError('Invalid timber derivative identity, dimensions or license receipt.')
    source_folder = root / 'docs/art/material-proof-2026-09-30'
    manifest_data = (source_folder / 'EARTH_MATERIALS_1K.json').read_bytes()
    manifest = json.loads(manifest_data)
    intake = json.loads((source_folder / 'EARTH_MATERIALS_1K_RECEIPT.json').read_text(encoding='utf-8'))
    if receipt.get('source_manifest_sha256') != hashlib.sha256(manifest_data).hexdigest() or intake['manifest_sha256'] != receipt['source_manifest_sha256']:
        raise ValueError('Timber source manifest receipt mismatch.')
    if receipt.get('source_asset', {}).get('id') != 'weathered_planks' or receipt.get('license_url') != manifest['license_url']:
        raise ValueError('Timber source attribution mismatch.')
    replacements = {}
    total = 0
    specs = [('color', 'color-512.jpg', 'image/jpeg', '__TIMBER_COLOR_BASE64__', 'weathered_planks/weathered_planks_diff_1k.jpg', 3),
             ('roughness', 'roughness-512.png', 'image/png', '__TIMBER_ROUGHNESS_BASE64__', 'weathered_planks/weathered_planks_rough_1k.jpg', 1)]
    if set(receipt['derivatives']) != {'color', 'roughness'}:
        raise ValueError('The timber proof must contain exactly color and roughness derivatives.')
    for channel, name, mime, marker, source_path, channels in specs:
        source = receipt['sources'][channel]
        original = next(entry for entry in manifest['objects'] if entry['relative_path'] == source_path)
        acquired = next(entry for entry in intake['objects'] if entry['relative_path'] == source_path)
        if source.get('relative_path') != source_path or source.get('sha256') != acquired['local_sha256'] or source.get('url') != original['url'] or source.get('bytes') != original['expected_bytes']:
            raise ValueError('Timber approved source receipt mismatch: ' + channel)
        entry = receipt['derivatives'][channel]
        if (entry.get('file'), entry.get('mime'), entry.get('width'), entry.get('height'), entry.get('channels'), entry.get('bit_depth')) != (name, mime, TIMBER_SIZE, TIMBER_SIZE, channels, 8):
            raise ValueError('Timber derivative metadata mismatch: ' + channel)
        if entry.get('color_space') != ('sRGB' if channel == 'color' else 'scalar; no gamma conversion'):
            raise ValueError('Timber derivative color-space receipt mismatch: ' + channel)
        data = (folder / name).read_bytes()
        if not 1024 <= len(data) <= TIMBER_BUDGET or entry.get('bytes') != len(data):
            raise ValueError('Invalid or oversized timber derivative: ' + name)
        if entry.get('sha256') != hashlib.sha256(data).hexdigest():
            raise ValueError('Timber derivative SHA256 mismatch: ' + name)
        validate_timber_image(data, channel)
        replacements[marker] = base64.b64encode(data).decode('ascii')
        total += len(data)
    if total > TIMBER_BUDGET or receipt.get('combined_bytes') != total or receipt.get('budget_bytes') != TIMBER_BUDGET:
        raise ValueError('Timber maps exceed or disagree with the combined 180 KiB budget.')
    calibration = receipt['calibration']
    mean = calibration.get('stripMeanLinearRGB')
    if calibration.get('crop') != [0.1, 0.2, 0, 1] or not isinstance(mean, list) or len(mean) != 3 or any(type(value) not in (int, float) or not math.isfinite(value) or not 0 < value <= 1 for value in mean):
        raise ValueError('Invalid timber linear-color calibration.')
    replacements['__TIMBER_STRIP_MEAN_LINEAR_RGB__'] = json.dumps(mean, separators=(',', ':'))
    return replacements


class OfflineResources(HTMLParser):
    """Resource-bearing markup must stay inside the assembled document."""
    def handle_starttag(self, tag, attrs):
        attributes = dict(attrs)
        if tag == 'base':
            raise ValueError('An offline build cannot set an external base URL.')
        resource_keys = {'script': ('src',), 'link': ('href',), 'img': ('src', 'srcset'),
                         'source': ('src', 'srcset'), 'audio': ('src',), 'video': ('src', 'poster'),
                         'iframe': ('src',), 'object': ('data',), 'embed': ('src',)}
        for key in resource_keys.get(tag, ()):
            value = attributes.get(key)
            if value and not value.startswith(('data:', 'blob:')):
                raise ValueError('External resource in offline markup: ' + tag + ' ' + key)


def build(root=ROOT):
    text = (root / 'src/shell.html').read_text(encoding='utf-8')
    surface_assets = timber_replacements(root)
    for name, token in [('earth-homecoming-data.js','EARTH_HOMECOMING_DATA'),('earth-homecoming.js','EARTH_HOMECOMING'),('earth-homecoming-ui.js','EARTH_HOMECOMING_UI'),('earth-homecoming-art.js','EARTH_HOMECOMING_ART'),('earth-homecoming.css','EARTH_HOMECOMING_STYLE'),('cosmos-campaign-data.js','COSMOS_CAMPAIGN_DATA'),('cosmos-campaign.js','COSMOS_CAMPAIGN'),('cosmos-campaign-ui.js','COSMOS_CAMPAIGN_UI'),('cosmos-campaign-art.js','COSMOS_CAMPAIGN_ART'),('cosmos-campaign.css','COSMOS_CAMPAIGN_STYLE'),('atlantis-campaign-data.js','ATLANTIS_CAMPAIGN_DATA'),('atlantis-campaign.js','ATLANTIS_CAMPAIGN'),('atlantis-campaign-ui.js','ATLANTIS_CAMPAIGN_UI'),('atlantis-campaign-art.js','ATLANTIS_CAMPAIGN_ART'),('atlantis-campaign.css','ATLANTIS_CAMPAIGN_STYLE'),('heaven-campaign-data.js','HEAVEN_CAMPAIGN_DATA'),('heaven-campaign.js','HEAVEN_CAMPAIGN'),('heaven-campaign-ui.js','HEAVEN_CAMPAIGN_UI'),('heaven-campaign-art.js','HEAVEN_CAMPAIGN_ART'),('heaven-campaign.css','HEAVEN_CAMPAIGN_STYLE'),('hell-campaign-data.js','HELL_CAMPAIGN_DATA'),('hell-campaign.js','HELL_CAMPAIGN'),('hell-campaign-ui.js','HELL_CAMPAIGN_UI'),('hell-campaign-art.js','HELL_CAMPAIGN_ART'),('hell-campaign.css','HELL_CAMPAIGN_STYLE'),('elderweald-world.js','ELDERWEALD_WORLD'),('elderweald-trail-art.js','ELDERWEALD_TRAIL_ART'),('earth-expedition.js','EARTH_EXPEDITION'),('earth-expedition-dialogue.js','EARTH_EXPEDITION_DIALOGUE'),('earth-expedition-beast-art.js','EARTH_EXPEDITION_BEAST_ART'),('earth-expedition-ui.js','EARTH_EXPEDITION_UI'),('earth-expedition-art.js','EARTH_EXPEDITION_ART'),('earth-expedition.css','EARTH_EXPEDITION_STYLE'),('realm-trails-north.js','REALM_TRAILS_NORTH'),('realm-trails-south.js','REALM_TRAILS_SOUTH'),('realm-trails-cosmos.js','REALM_TRAILS_COSMOS'),('realm-trails.js','REALM_TRAILS'),('bridge-community.js','BRIDGE_COMMUNITY'),('bridge-community-ui.js','BRIDGE_COMMUNITY_UI'),('bridge-community-art.js','BRIDGE_COMMUNITY_ART'),('bridge-community.css','BRIDGE_COMMUNITY_STYLE'),('local-life.js','LOCAL_LIFE'),('local-life-ui.js','LOCAL_LIFE_UI'),('local-life-art.js','LOCAL_LIFE_ART'),('realm-craft.js','REALM_CRAFT'),('realm-trails-art.js','REALM_TRAILS_ART'),('realm-trails-ui.js','REALM_TRAILS_UI'),('world-heaven-hell.js','WORLD_HEAVEN_HELL'),('coastward-settlement-art.js','COASTWARD_SETTLEMENT_ART'),('coastward-woodland-art.js','COASTWARD_WOODLAND_ART'),('world-atlantis-earth.js','WORLD_ATLANTIS_EARTH'),('world-foundations.js','WORLD_FOUNDATIONS'),('realm-givers-art.js','REALM_GIVERS_ART'),('world-ground-coalescing.js','WORLD_GROUND_COALESCING'),('world-foundations-art.js','WORLD_FOUNDATIONS_ART'),('world-foundations-ui.js','WORLD_FOUNDATIONS_UI'),('world-foundations.css','WORLD_FOUNDATIONS_STYLE'),('surface-assets.js','SURFACE_ASSETS'),('realm-art-data.js','REALM_ART_DATA'),('realm-atlas-ui.js','REALM_ATLAS_UI'),('realm-atlas.css','REALM_ATLAS_STYLE'),('gathering.js','GATHERING'),('gathering-music.js','GATHERING_MUSIC'),('gathering-ui.js','GATHERING_UI'),('gathering-art.js','GATHERING_ART'),('gathering.css','GATHERING_STYLE'),('earth-notes.js','EARTH_NOTES'),('earth-notes-ui.js','EARTH_NOTES_UI'),('earth-notes-art.js','EARTH_NOTES_ART'),('earth-story.js','EARTH_STORY'),('earth-story-ui.js','EARTH_STORY_UI'),('earth.js','EARTH'),('earth-road.js','EARTH_ROAD'),('earth-road-ui.js','EARTH_ROAD_UI'),('earth-road-art.js','EARTH_ROAD_ART'),('cosmos.js','COSMOS'),('cosmos-ui.js','COSMOS_UI'),('cosmos-art.js','COSMOS_ART'),('cosmos.css','COSMOS_STYLE'),('earth-ui.js','EARTH_UI'),('earth-shoulder-art.js','EARTH_SHOULDER_ART'),('quarry-art.js','QUARRY_ART'),('drover-art.js','DROVER_ART'),('millwright-art.js','MILLWRIGHT_ART'),('mill-gate-art.js','MILL_GATE_ART'),('bridge-art.js','BRIDGE_ART'),('earth-art.js','EARTH_ART'),('earth.css','EARTH_STYLE'),('classes.js','CLASSES'),('classes-ui.js','CLASSES_UI'),('classes.css','CLASSES_STYLE'),('characters.js','CHARACTERS'),('characters-ui.js','CHARACTERS_UI'),('characters.css','CHARACTERS_STYLE'),('pursuit.js','PURSUIT'),('pursuit-ui.js','PURSUIT_UI'),('pursuit.css','PURSUIT_STYLE'),('starter.js','STARTER'),('starter-art.js','STARTER_ART'),('starter-ui.js','STARTER_UI'),('starter.css','STARTER_STYLE'),('crossing.js','CROSSING'),('crossing-art.js','CROSSING_ART'),('crossing-ui.js','CROSSING_UI'),('crossing.css','CROSSING_STYLE'),('beacon.js','BEACON'),('combat.js','COMBAT'),('beacon-art.js','BEACON_ART'),('rpg-ui.js','RPG_UI'),('rpg.css','RPG_STYLE'),('arsenal.js','ARSENAL'),('arsenal-art.js','ARSENAL_ART'),('arsenal-ui.js','ARSENAL_UI'),('road.js','ROAD'),('road-art.js','ROAD_ART'),('adventure.js','ADVENTURE'),('adventure-ui.js','ADVENTURE_UI'),('skitter-art.js','SKITTER_ART'),('companion-art.js','COMPANION_ART'),('adventure-art.js','ADVENTURE_ART'),('sandbox.js','SANDBOX'),('sandbox-ui.js','SANDBOX_UI'),('sandbox-art.js','SANDBOX_ART'),('home-history.js','HOME_HISTORY'),('home-history-art.js','HOME_HISTORY_ART'),('home-history-ui.js','HOME_HISTORY_UI'),('home-history.css','HOME_HISTORY_STYLE'),('creative.js','CREATIVE'),('experience.js','EXPERIENCE'),('style.css','STYLE'), ('soundscape.js','SOUNDSCAPE'), ('engine.js','ENGINE'), ('core.js','CORE'), ('workshop-transactions.js','WORKSHOP_TRANSACTIONS'), ('traveler-art.js','TRAVELER_ART'), ('traveler-equipment-art.js','TRAVELER_EQUIPMENT_ART'), ('world.js','WORLD'), ('combat-view.js','COMBAT_VIEW'), ('bridge-moment-view.js','BRIDGE_MOMENT_VIEW'),('app.js','APP')]:
        body=(root/'src'/name).read_text(encoding='utf-8')
        if name == 'surface-assets.js':
            for marker, replacement in surface_assets.items():
                if body.count(marker) != 1:
                    raise ValueError('Missing or duplicate surface placeholder: ' + marker)
                body = body.replace(marker, replacement)
        if name == 'realm-art-data.js':
            for marker, asset in [('__WORLD_ART_BASE64__','five-realms.webp'),('__EARTH_ART_BASE64__','hearthwater-kit.webp')]:
                data=(root/'assets/concept-art'/asset).read_bytes()
                if len(data)>700_000 or data[:4]!=b'RIFF' or data[8:12]!=b'WEBP':
                    raise ValueError('Invalid or oversized concept asset: '+asset)
                body=body.replace(marker,base64.b64encode(data).decode('ascii'))
        if name.endswith('.js') and '</script' in body.lower():
            raise ValueError('Embedded script terminator in '+name)
        placeholder = '/*__'+token+'__*/'
        if text.count(placeholder) != 1:
            raise ValueError('Missing or duplicate module placeholder: ' + token)
        text=text.replace(placeholder, body)
    if re.search(r'/\*__|__[A-Z][A-Z0-9_]*__', text):
        raise ValueError('Unresolved build placeholder')
    OfflineResources().feed(text)
    for name in ['FIRSTLIGHT_VALLEY.html','index.html']:
        (root/name).write_text(text, encoding='utf-8', newline='\n')
    print(f'{len(text.encode()):,} bytes; SHA-256 {hashlib.sha256(text.encode()).hexdigest()}')
    return text


if __name__ == '__main__':
    build()
