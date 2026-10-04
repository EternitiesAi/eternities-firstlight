# Local preview identity

The original read-only `LOCAL_PREVIEW_STATUS.json` checked
`http://127.0.0.1:8780/FIRSTLIGHT_VALLEY.html` at
2026-10-04T02:24:01.387430+00:00. The machine refused the connection with
WinError10061. This establishes no answering server at that checked moment;
it is not proof that a later launch will fail, or that a live preview is running.

No process was stopped or restarted, no browser profile/save was inspected and
no origin was changed. The source launcher still uses8780 and verifies exact
generated HTML before reusing an occupied origin. The actual milestone footage
and native tests used separately labelled synthetic origins/profiles.

The earlier preview-restart action was rejected before execution by automatic
approval review with `CreateProcess blocked by policy`. This receipt records a
read-only check, not a retry or an alternative route around that blocked action.
