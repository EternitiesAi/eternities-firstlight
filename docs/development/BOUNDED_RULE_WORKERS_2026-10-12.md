# Complete rule verification beside an independently owned VM

Base: `42950a8d30bc0f1f907e24dab34e80213f6dea4c`, draft PR #65.
Branch: `verification/bounded-rule-workers-20261012`.
Owner: parent Firstlight checkout. Two existing colleagues perform read-only source review.

Dom requires that the VM and Claude Code work stay untouched. This change lets
Firstlight request fewer Node rule-test file workers rather than change another
worker, omit tests, or extend acceptance deadlines. Host free memory varied from
about 3.2 GiB to 6.3 GiB during admission; no guest inspection or process control
was used. There is no promise of bounded aggregate RAM or VM performance.

`python tools/verify.py --rule-workers 2` still discovers every sorted rule file,
all source syntax checks, Python tests and command-earned journeys. Supported
caps are 1, 2 and 4. Omission keeps the original Node command vector. Only the
main multi-file rules command receives `--test-concurrency=N`; other Node
commands, child environments, browser routing and native gates stay unchanged.
The original rules deadline is 180 seconds and Python deadline is 600 seconds.
A timeout or nonzero exit still stops the gate and retains the failure.

The same vector dispatched to the child is serialized into `rules-command.json`
with a versioned schema, requested worker count, exact ordered file membership,
verifier hash and budgets. Its hash is printed in the raw console. The file
records requested dispatch, including failed attempts. It does not prove process
launch, successful checks, memory reduction or complete qualification.

The original output directory contract remains: command logs and this record can
be rewritten when explicitly reusing a log root. Qualification controllers must
use fresh log/console/exit namespaces and bind their exact raw bytes. A record
must never be retroactively attached to an older source receipt.

The installed ordinary forest preparation pins the old verifier bytes. It
correctly refuses this new verifier until a separately reviewed forward pin and
current closed source receipt exist. Preserve its ordered 214-command/log checks,
runtime/HTML/head pins, native controls and original deadlines. Do not normalize
arbitrary command arguments or borrow an older source gate. The pinned old
prepared callers remain unexecuted; changing this option does not admit them.

Five new detecting tests exercise the actual parser, discovery, run/log/failure
logic through explicitly synthetic external subprocess transport. They verify
all 142 sorted file arguments, the original default vector, three supported
caps, invalid refusal before allocation, unchanged deadlines, and failed-gate
termination. An inherited `NODE_OPTIONS` sentinel detects global/environment
rewrites. RED: five tests, six errors before implementation; initial GREEN:
five tests OK in 0.840 seconds. After the inherited-environment review repair,
fresh GREEN: five tests OK in 1.257 seconds. The affected verifier components
reported 75 tests OK in 93.000 seconds with one explicit skip; that discovery
had loaded the earlier worker tests before the review repair, so GREEN02
separately checks the final bytes. The transport fixture is not gameplay or
timing proof. Two colleagues reviewed source only; neither independently ran it.

Actual complete source and fresh remote qualification are pending at this
implementation checkpoint. Measure the requested mode honestly with all tests
and original deadlines; retain any timeout or failure. Native startup mismatch,
ordinary Choir/forest play, garden camera framing and human feel/pacing gates
remain open. Hosted CI at the base reported an account billing lock and started
zero job steps; do not change billing or retry hosted work merely for this patch.

No runtime module, generated page, asset or existing test changes. World 9,
Adventure 12, WildSigns 1; personal keys, saves, XP, histories, ledgers, equipment,
sockets, companions, building, music and both cameras remain untouched. Reuse
the D qualification checkout; no duplicate game, browser profile or video.
Goal remains ACTIVE and unfinished, heartbeat PAUSED; no merge or deployment.
