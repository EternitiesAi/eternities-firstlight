#!/usr/bin/env python3
"""Assemble the offline realm from original local sources. No dependencies."""
from pathlib import Path
import hashlib
import base64
ROOT = Path(__file__).resolve().parent
text = (ROOT / 'src/shell.html').read_text(encoding='utf-8')
for name, token in [('realm-art-data.js','REALM_ART_DATA'),('realm-atlas-ui.js','REALM_ATLAS_UI'),('realm-atlas.css','REALM_ATLAS_STYLE'),('gathering.js','GATHERING'),('gathering-music.js','GATHERING_MUSIC'),('gathering-ui.js','GATHERING_UI'),('gathering-art.js','GATHERING_ART'),('gathering.css','GATHERING_STYLE'),('earth-notes.js','EARTH_NOTES'),('earth-notes-ui.js','EARTH_NOTES_UI'),('earth-notes-art.js','EARTH_NOTES_ART'),('earth-story.js','EARTH_STORY'),('earth-story-ui.js','EARTH_STORY_UI'),('earth.js','EARTH'),('cosmos.js','COSMOS'),('cosmos-ui.js','COSMOS_UI'),('cosmos-art.js','COSMOS_ART'),('cosmos.css','COSMOS_STYLE'),('earth-ui.js','EARTH_UI'),('earth-art.js','EARTH_ART'),('earth.css','EARTH_STYLE'),('classes.js','CLASSES'),('classes-ui.js','CLASSES_UI'),('classes.css','CLASSES_STYLE'),('characters.js','CHARACTERS'),('characters-ui.js','CHARACTERS_UI'),('characters.css','CHARACTERS_STYLE'),('pursuit.js','PURSUIT'),('pursuit-ui.js','PURSUIT_UI'),('pursuit.css','PURSUIT_STYLE'),('starter.js','STARTER'),('starter-art.js','STARTER_ART'),('starter-ui.js','STARTER_UI'),('starter.css','STARTER_STYLE'),('crossing.js','CROSSING'),('crossing-art.js','CROSSING_ART'),('crossing-ui.js','CROSSING_UI'),('crossing.css','CROSSING_STYLE'),('beacon.js','BEACON'),('combat.js','COMBAT'),('beacon-art.js','BEACON_ART'),('rpg-ui.js','RPG_UI'),('rpg.css','RPG_STYLE'),('arsenal.js','ARSENAL'),('arsenal-art.js','ARSENAL_ART'),('arsenal-ui.js','ARSENAL_UI'),('road.js','ROAD'),('road-art.js','ROAD_ART'),('adventure.js','ADVENTURE'),('adventure-ui.js','ADVENTURE_UI'),('adventure-art.js','ADVENTURE_ART'),('sandbox.js','SANDBOX'),('sandbox-ui.js','SANDBOX_UI'),('sandbox-art.js','SANDBOX_ART'),('creative.js','CREATIVE'),('experience.js','EXPERIENCE'),('style.css','STYLE'), ('engine.js','ENGINE'), ('core.js','CORE'), ('world.js','WORLD'), ('app.js','APP')]:
    body=(ROOT/'src'/name).read_text(encoding='utf-8')
    if name == 'realm-art-data.js':
        for marker, asset in [('__WORLD_ART_BASE64__','five-realms.webp'),('__EARTH_ART_BASE64__','hearthwater-kit.webp')]:
            data=(ROOT/'assets/concept-art'/asset).read_bytes()
            if len(data)>700_000 or data[:4]!=b'RIFF' or data[8:12]!=b'WEBP':
                raise ValueError('Invalid or oversized concept asset: '+asset)
            body=body.replace(marker,base64.b64encode(data).decode('ascii'))
    if name.endswith('.js') and '</script' in body.lower():
        raise ValueError('Embedded script terminator in '+name)
    text=text.replace('/*__'+token+'__*/', body)
if '/*__' in text: raise ValueError('Unresolved build placeholder')
for name in ['FIRSTLIGHT_VALLEY.html','index.html']:
    (ROOT/name).write_text(text, encoding='utf-8', newline='\n')
print(f'{len(text.encode()):,} bytes; SHA-256 {hashlib.sha256(text.encode()).hexdigest()}')
