"""Shared portable Playwright setup for the offline browser checks."""
import os
from pathlib import Path

LEGACY_BROWSER_OUTPUTS = frozenset({
    'characters_browser', 'classes_browser', 'combat_cue_browser',
    'companion_presentation_browser', 'cosmos_browser', 'crossing_browser',
    'cutaway_browser', 'earth_browser', 'earth_notes_browser', 'earth_story_browser',
    'gathering_browser', 'journey_usability_browser', 'native_origin_browser',
    'pursuit_browser', 'realm_atlas_browser', 'realm_trails_browser',
    'realm_trails_cosmos_browser', 'reflection_browser', 'regression09_browser',
    'skitter_presentation_browser', 'soundscape_browser', 'starter_browser',
    'timber_browser', 'traveler_browser', 'workshop_transactions_browser',
    'world_cutaway_browser',
})

def browser_output(default, *, windows=None):
    """Reserve an explicit fresh evidence root; absent configuration stays legacy.

    The platform override supports portable CPU fixtures without creating native
    profiles. Actual browser callers use the current host's Windows D policy.
    """
    configured = os.environ.get('FIRSTLIGHT_BROWSER_OUTPUT')
    if configured is None:
        return default
    output = Path(configured)
    if not output.is_absolute():
        raise ValueError('FIRSTLIGHT_BROWSER_OUTPUT must name an absolute bounded directory')
    is_windows = os.name == 'nt' if windows is None else windows
    if is_windows and output.drive.upper() != 'D:':
        raise ValueError('Browser evidence must stay on D: on Windows')
    output = output.resolve()
    if output == Path(output.anchor):
        raise ValueError('Browser evidence cannot use a filesystem root')
    if is_windows and output.drive.upper() != 'D:':
        raise ValueError('Resolved browser evidence must stay on D: on Windows')
    output.mkdir(parents=True, exist_ok=False)
    return output

def chromium_launch_kwargs():
    args = ["--no-sandbox", "--disable-dev-shm-usage", "--enable-webgl", "--ignore-gpu-blocklist", "--disable-gpu-sandbox", "--use-angle=swiftshader"]
    result = {"headless": True, "args": args}
    executable = os.environ.get("FIRSTLIGHT_CHROMIUM_EXECUTABLE")
    if executable:
        result["executable_path"] = executable
    return result

def read_utf8(path: Path):
    return path.read_text(encoding="utf-8")
