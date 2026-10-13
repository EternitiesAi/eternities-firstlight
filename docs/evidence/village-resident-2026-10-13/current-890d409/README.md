# Resident source and native evidence

Tested exact remote head:890d409c3f1610aad923d7b30d00384425230152.
Read RESULTS.json, the qualification document and CLIP_PROVENANCE.json first.
MANIFEST.json binds all payload bytes except itself. COMPRESSED_REPORTS.json binds
the original uncompressed report bytes: gzip.decompress must match those hashes.
SOURCE04_LOGS.zip holds227 top-level logs/metadata only; SOURCE04_LOG_INDEX.json
binds each member. Nested earned-journey trees remain local, not copied here.

NATIVE04 and CORRIDOR03 passed. CORRIDOR01 remains failed, CORRIDOR02 remains
memory-refused; keep both negative reports as recorded. Earlier corridor buffered
center arrays are aliased and do not establish exact historical camera centers.
The corrected03 deep snapshot fixes this evidence issue. Tests use synthetic
task state only. No personal profile, raw video or game copy is packaged.

The final movie is ordinary software-rendered gameplay with pauses/UI, not an
RTX benchmark or human playtest. A one-second count or source review cannot
replace full browser qualification: the broader current --browser gate is pending.
