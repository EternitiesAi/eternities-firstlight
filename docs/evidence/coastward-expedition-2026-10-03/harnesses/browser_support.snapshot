import os

def launch_kwargs(renderer="software"):
    args = ["--no-sandbox", "--disable-dev-shm-usage", "--enable-webgl", "--ignore-gpu-blocklist"]
    if renderer == "software":
        args += ["--disable-gpu-sandbox", "--use-angle=swiftshader"]
    else:
        args += ["--use-angle=d3d11"]
    result = {"headless": True, "args": args}
    executable = os.environ.get("FIRSTLIGHT_CHROMIUM_EXECUTABLE")
    if executable: result["executable_path"] = executable
    return result
