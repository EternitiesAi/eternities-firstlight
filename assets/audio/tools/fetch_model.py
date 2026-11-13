"""Download one huggingface model at a pinned revision into a local folder. Public repo, no token."""
import sys

from huggingface_hub import snapshot_download

repo_id, revision, dest = sys.argv[1], sys.argv[2], sys.argv[3]
path = snapshot_download(repo_id=repo_id, revision=revision, local_dir=dest)
print("model at", path)
